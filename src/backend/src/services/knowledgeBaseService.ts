/**
 * Knowledge Base Service — CRUD de bases de conhecimento + gestão de arquivos.
 */

import { v4 as uuid } from 'uuid';
import { config } from '../utils/config';
import { dynamoService } from './dynamoService';
import { s3Service } from './s3Service';
import {
  KnowledgeBase,
  KnowledgeBaseFile,
  KnowledgeBaseLink,
  ParsedChunk,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
  AddLinkRequest,
  DEFAULT_BEDROCK_CONFIG,
} from '../utils/types';

const TABLE = config.tables.knowledgeBases;
const CHUNKS_TABLE = config.tables.chunks;

export const knowledgeBaseService = {
  async create(data: CreateKnowledgeBaseRequest): Promise<KnowledgeBase> {
    // Verifica unicidade do slug
    const existing = await dynamoService.query(TABLE, { slug: data.slug }, 'slug-index');
    if (existing.length > 0) {
      throw { statusCode: 409, message: `Slug "${data.slug}" já está em uso` };
    }

    const kb: KnowledgeBase = {
      id: uuid(),
      name: data.name,
      slug: data.slug,
      description: data.description,
      fileCount: 0,
      files: [],
      links: [],
      config: { ...DEFAULT_BEDROCK_CONFIG, ...(data.config || {}) },
      lastTrainedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dynamoService.put(TABLE, kb);
    return kb;
  },

  async list(): Promise<KnowledgeBase[]> {
    return await dynamoService.scan(TABLE) as KnowledgeBase[];
  },

  async getById(id: string): Promise<KnowledgeBase> {
    const kb = await dynamoService.get(TABLE, { id });
    if (!kb) throw { statusCode: 404, message: 'Base de conhecimento não encontrada' };
    return kb as KnowledgeBase;
  },

  async getBySlug(slug: string): Promise<KnowledgeBase> {
    const results = await dynamoService.query(TABLE, { slug }, 'slug-index');
    if (results.length === 0) throw { statusCode: 404, message: 'Base de conhecimento não encontrada' };
    return results[0] as KnowledgeBase;
  },

  async update(id: string, data: UpdateKnowledgeBaseRequest): Promise<KnowledgeBase> {
    const kb = await this.getById(id);

    // Se o slug mudou, verifica unicidade
    if (data.slug && data.slug !== kb.slug) {
      const existing = await dynamoService.query(TABLE, { slug: data.slug }, 'slug-index');
      if (existing.length > 0) {
        throw { statusCode: 409, message: `Slug "${data.slug}" já está em uso` };
      }
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (data.name !== undefined) updates.name = data.name;
    if (data.slug !== undefined) updates.slug = data.slug;
    if (data.description !== undefined) updates.description = data.description;
    if (data.config) {
      updates.config = { ...kb.config, ...data.config };
    }

    const updated = await dynamoService.update(TABLE, { id }, updates);
    return updated as KnowledgeBase;
  },

  async delete(id: string): Promise<void> {
    const kb = await this.getById(id);
    // Remove pasta do S3 (arquivos originais + context.txt)
    await s3Service.deleteFolder(`${kb.id}/`);
    // Remove todos os chunks parseados dessa base
    const chunks = await dynamoService.query(CHUNKS_TABLE, { knowledgeBaseId: id }) as ParsedChunk[];
    for (const chunk of chunks) {
      await dynamoService.delete(CHUNKS_TABLE, { knowledgeBaseId: id, fileId: chunk.fileId });
    }
    // Remove conversas e mensagens associadas a essa base
    const conversations = await dynamoService.query(
      config.tables.conversations, { knowledgeBaseId: id }, 'knowledgeBase-index'
    );
    for (const conv of conversations) {
      // Remove mensagens da conversa
      const messages = await dynamoService.query(config.tables.messages, { conversationId: conv.id });
      for (const msg of messages) {
        await dynamoService.delete(config.tables.messages, { conversationId: conv.id, createdAt: msg.createdAt });
      }
      // Remove a conversa
      await dynamoService.delete(config.tables.conversations, { id: conv.id });
    }
    // Remove a KB
    await dynamoService.delete(TABLE, { id });
  },

  async addFile(kbId: string, fileName: string, fileContent: Buffer, contentType: string): Promise<KnowledgeBaseFile> {
    const fileId = uuid();
    const s3Key = `${kbId}/${fileId}-${fileName}`;

    // Upload original para S3
    await s3Service.putObject(s3Key, fileContent, contentType);

    // Parseia e armazena o conteúdo na tabela de chunks (separada da KB)
    const parsedContent = await parseFileContent(fileContent, fileName);
    if (parsedContent) {
      const chunk: ParsedChunk = {
        knowledgeBaseId: kbId,
        fileId,
        fileName,
        content: parsedContent,
        parsedAt: new Date().toISOString(),
      };
      await dynamoService.put(CHUNKS_TABLE, chunk);
    }

    const file: KnowledgeBaseFile = {
      id: fileId,
      name: fileName,
      type: contentType,
      size: fileContent.length,
      s3Key,
      uploadedAt: new Date().toISOString(),
    };

    // Append atômico — seguro para uploads simultâneos
    await dynamoService.appendToList(TABLE, { id: kbId }, 'files', file, 'fileCount');

    return file;
  },

  async deleteFile(kbId: string, fileId: string): Promise<void> {
    const kb = await this.getById(kbId);
    const file = kb.files.find((f) => f.id === fileId);
    if (!file) throw { statusCode: 404, message: 'Arquivo não encontrado' };

    // Remove do S3
    await s3Service.deleteObject(file.s3Key);

    // Remove chunk parseado
    await dynamoService.delete(CHUNKS_TABLE, { knowledgeBaseId: kbId, fileId }).catch(() => {});

    const updatedFiles = kb.files.filter((f) => f.id !== fileId);
    await dynamoService.update(TABLE, { id: kbId }, {
      files: updatedFiles,
      fileCount: updatedFiles.length,
      updatedAt: new Date().toISOString(),
    });
  },

  async addLink(kbId: string, data: AddLinkRequest): Promise<KnowledgeBaseLink> {
    const kb = await this.getById(kbId);

    const link: KnowledgeBaseLink = {
      id: uuid(),
      url: data.url,
      refreshIntervalHours: data.refreshIntervalHours || null,
      lastFetchedAt: null,
      content: null,
      createdAt: new Date().toISOString(),
    };

    const updatedLinks = [...kb.links, link];
    await dynamoService.update(TABLE, { id: kbId }, {
      links: updatedLinks,
      updatedAt: new Date().toISOString(),
    });

    return link;
  },

  async retrain(kbId: string): Promise<KnowledgeBase> {
    const kb = await this.getById(kbId);

    // Consolida todos os chunks em um único arquivo de contexto RAG no S3
    const chunks = await dynamoService.query(CHUNKS_TABLE, { knowledgeBaseId: kbId }) as ParsedChunk[];
    const allContent: string[] = [];

    for (const chunk of chunks) {
      if (chunk.content) {
        // Normaliza o conteúdo: remove HTML, limpa whitespace excessivo
        const cleaned = normalizeContent(chunk.content);
        if (cleaned.trim().length > 20) { // ignora chunks vazios/muito curtos
          allContent.push(`[Fonte: ${chunk.fileName}]\n${cleaned}`);
        }
      }
    }

    // Adiciona conteúdo dos links
    for (const link of kb.links) {
      if (link.content) {
        const cleaned = normalizeContent(link.content);
        if (cleaned.trim().length > 20) {
          allContent.push(`[Link: ${link.url}]\n${cleaned}`);
        }
      }
    }

    const contextText = allContent.join('\n\n---\n\n');
    const contextKey = `${kbId}/context.txt`;

    // Salva o contexto consolidado no S3
    await s3Service.putObject(contextKey, Buffer.from(contextText, 'utf-8'), 'text/plain');

    console.log(`[KnowledgeBaseService] Retreinamento concluido: ${kb.name} (${kbId}) — ${allContent.length} fontes, ${contextText.length} chars`);

    const updated = await dynamoService.update(TABLE, { id: kbId }, {
      lastTrainedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return updated as KnowledgeBase;
  },

  /**
   * Monta o contexto RAG para a inferência.
   * Caminho rápido: lê context.txt pré-consolidado do S3 (gerado pelo retreino).
   * Fallback: lê chunks individuais do DynamoDB se context.txt não existir.
   */
  async buildContext(kbId: string, query: string): Promise<string> {
    // Tenta ler o contexto consolidado do S3 (gerado pelo retreino)
    const contextKey = `${kbId}/context.txt`;
    const cachedContext = await s3Service.getObject(contextKey);

    if (cachedContext && cachedContext.length > 0) {
      const fullContext = cachedContext.toString('utf-8');

      // Se o contexto for pequeno, retorna inteiro
      if (fullContext.length <= 8000) {
        return fullContext;
      }

      // RAG: busca trechos mais relevantes
      const sections = fullContext.split('\n\n---\n\n');
      return rankAndSelect(sections, query);
    }

    // Fallback: lê chunks do DynamoDB (caso nunca tenha sido treinado)
    const chunks = await dynamoService.query(CHUNKS_TABLE, { knowledgeBaseId: kbId }) as ParsedChunk[];
    const allContent: string[] = [];

    for (const chunk of chunks) {
      if (chunk.content) {
        allContent.push(`[Arquivo: ${chunk.fileName}]\n${chunk.content}`);
      }
    }

    const kb = await this.getById(kbId);
    for (const link of kb.links) {
      if (link.content) {
        allContent.push(`[Link: ${link.url}]\n${link.content}`);
      }
    }

    if (allContent.length === 0) return '';

    return rankAndSelect(allContent, query);
  },
};

/**
 * Normaliza conteúdo removendo HTML e limpando formatação.
 * Converte HTML em texto estruturado legível.
 */
function normalizeContent(raw: string): string {
  let text = raw;

  // Remove scripts e styles inteiros
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove forms e inputs (não contêm conteúdo útil)
  text = text.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '');
  text = text.replace(/<input[^>]*\/?>/gi, '');

  // Substitui <br>, <hr>, </p>, </div>, </tr>, </li> por quebra de linha
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(?:p|div|tr|li|h[1-6])>/gi, '\n');
  text = text.replace(/<hr\s*\/?>/gi, '\n');

  // Substitui <td> por tab (para manter estrutura tabular mínima)
  text = text.replace(/<\/td>/gi, ' | ');

  // Remove todas as tags HTML restantes
  text = text.replace(/<[^>]+>/g, '');

  // Decodifica entidades HTML comuns
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/&amp;/gi, '&');
  text = text.replace(/&lt;/gi, '<');
  text = text.replace(/&gt;/gi, '>');
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));

  // Remove linhas que são apenas whitespace ou separadores
  text = text.split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^[\s|_\-=]+$/.test(line))
    .join('\n');

  // Colapsa múltiplas quebras de linha
  text = text.replace(/\n{3,}/g, '\n\n');

  // Remove espaços múltiplos
  text = text.replace(/ {2,}/g, ' ');

  return text.trim();
}

/**
 * Ranqueia seções por relevância usando TF (frequência do termo) + boost por proximidade.
 * Retorna os top 5 trechos mais relevantes, limitados a ~6000 chars total para caber no contexto.
 */
function rankAndSelect(sections: string[], query: string): string {
  const MAX_CONTEXT_CHARS = 6000;
  const TOP_N = 5;

  // Tokeniza a query — inclui palavras curtas também (ex: "idoso", "mapa")
  const queryWords = query.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (queryWords.length === 0) {
    return sections.slice(0, TOP_N).join('\n\n---\n\n').substring(0, MAX_CONTEXT_CHARS);
  }

  const scored = sections.map((content) => {
    const lowerContent = content.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const contentLength = lowerContent.length || 1;

    let score = 0;

    for (const word of queryWords) {
      // Conta ocorrências (TF)
      const regex = new RegExp(word, 'gi');
      const matches = lowerContent.match(regex);
      const tf = matches ? matches.length : 0;

      if (tf > 0) {
        // TF normalizado pelo tamanho do documento (favorece documentos mais focados)
        score += (tf / (contentLength / 1000));

        // Boost se a palavra aparece nas primeiras 200 chars (título/início)
        const firstPart = lowerContent.substring(0, 200);
        if (firstPart.includes(word)) {
          score += 2;
        }
      }
    }

    // Boost para documentos menores (mais focados/específicos)
    if (contentLength < 2000) score *= 1.2;

    return { content, score };
  });

  // Filtra somente seções que tiveram algum match
  const matched = scored.filter((s) => s.score > 0);
  matched.sort((a, b) => b.score - a.score);

  // Pega os top N respeitando o limite de caracteres
  const selected: string[] = [];
  let totalChars = 0;

  for (const item of matched.slice(0, TOP_N)) {
    // Trunca seções muito longas para 1500 chars
    const truncated = item.content.length > 1500
      ? item.content.substring(0, 1500) + '\n[... conteudo truncado]'
      : item.content;

    if (totalChars + truncated.length > MAX_CONTEXT_CHARS) break;
    selected.push(truncated);
    totalChars += truncated.length;
  }

  return selected.join('\n\n---\n\n');
}

/**
 * Faz parsing de arquivo para texto plano.
 */
async function parseFileContent(content: Buffer, fileName: string): Promise<string> {
  const ext = fileName.toLowerCase().split('.').pop();

  switch (ext) {
    case 'pdf':
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(content);
        return pdfData.text;
      } catch (err) {
        console.error('Erro ao parsear PDF:', err);
        return '';
      }

    case 'txt':
    case 'md':
    case 'csv':
      return content.toString('utf-8');

    case 'xlsx':
    case 'xls':
      try {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(content, { type: 'buffer' });
        const allText: string[] = [];
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          allText.push(`[Planilha: ${sheetName}]\n${JSON.stringify(json, null, 2)}`);
        }
        return allText.join('\n\n');
      } catch (err) {
        console.error('Erro ao parsear XLSX:', err);
        return '';
      }

    case 'json':
      try {
        return JSON.stringify(JSON.parse(content.toString('utf-8')), null, 2);
      } catch {
        return content.toString('utf-8');
      }

    default:
      return content.toString('utf-8');
  }
}
