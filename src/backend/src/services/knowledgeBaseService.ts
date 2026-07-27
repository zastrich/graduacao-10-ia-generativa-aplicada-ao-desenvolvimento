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
    // Remove pasta do S3
    await s3Service.deleteFolder(`${kb.id}/`);
    // Remove todos os chunks parseados dessa base
    const chunks = await dynamoService.query(CHUNKS_TABLE, { knowledgeBaseId: id }) as ParsedChunk[];
    for (const chunk of chunks) {
      await dynamoService.delete(CHUNKS_TABLE, { knowledgeBaseId: id, fileId: chunk.fileId });
    }
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

    // Em uma implementação real, aqui:
    // 1. Re-parsear todos os arquivos
    // 2. Re-baixar todos os links
    // 3. Reconstruir índice de busca
    console.log(`[KnowledgeBaseService] Retreinando base: ${kb.name} (${kbId})`);

    const updated = await dynamoService.update(TABLE, { id: kbId }, {
      lastTrainedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return updated as KnowledgeBase;
  },

  /**
   * Monta o contexto RAG para a inferência — lê chunks parseados da tabela de chunks.
   */
  async buildContext(kbId: string, query: string): Promise<string> {
    // Busca todos os chunks dessa base de conhecimento
    const chunks = await dynamoService.query(CHUNKS_TABLE, { knowledgeBaseId: kbId }) as ParsedChunk[];

    const allContent: string[] = [];

    for (const chunk of chunks) {
      if (chunk.content) {
        allContent.push(`[Arquivo: ${chunk.fileName}]\n${chunk.content}`);
      }
    }

    // Coleta conteúdo dos links
    const kb = await this.getById(kbId);
    for (const link of kb.links) {
      if (link.content) {
        allContent.push(`[Link: ${link.url}]\n${link.content}`);
      }
    }

    if (allContent.length === 0) {
      return '';
    }

    // RAG simples: busca por similaridade textual (keyword matching)
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    
    const scoredContent = allContent.map((content) => {
      const lowerContent = content.toLowerCase();
      const score = queryWords.reduce((acc, word) => {
        return acc + (lowerContent.includes(word) ? 1 : 0);
      }, 0);
      return { content, score };
    });

    // Ordena por relevância e pega os top 3
    scoredContent.sort((a, b) => b.score - a.score);
    const topContent = scoredContent.slice(0, 3).map((item) => item.content);

    return topContent.join('\n\n---\n\n');
  },
};

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
