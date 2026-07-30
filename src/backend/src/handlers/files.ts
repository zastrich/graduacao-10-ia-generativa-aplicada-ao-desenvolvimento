/**
 * Files Handler — Upload e gerenciamento de arquivos nas bases de conhecimento.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import { s3Service } from '../services/s3Service';
import { requireAuth } from '../utils/auth';
import { success, created, noContent, badRequest, error, corsPreflightResponse } from '../utils/response';
import { validateFile } from '../utils/fileValidator';
import { validateUrl } from '../utils/urlValidator';
import { AddLinkRequest } from '../utils/types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const origin = event.headers?.origin || event.headers?.Origin;
  if (event.httpMethod === 'OPTIONS') return corsPreflightResponse(origin);

  try {
    requireAuth(event);

    const kbId = event.pathParameters?.id;
    if (!kbId) return badRequest('ID da base é obrigatório', origin);

    const path = event.resource || event.path;

    // POST /admin/knowledge-bases/:id/files
    if (event.httpMethod === 'POST' && path.includes('/files')) {
      return await uploadFile(kbId, event, origin);
    }

    // GET /admin/knowledge-bases/:id/files/:fileId/download
    if (event.httpMethod === 'GET' && path.includes('/files/')) {
      const fileId = event.pathParameters?.fileId;
      if (!fileId) return badRequest('ID do arquivo e obrigatorio', origin);
      return await getDownloadUrl(kbId, fileId, origin);
    }

    // DELETE /admin/knowledge-bases/:id/files/:fileId
    if (event.httpMethod === 'DELETE' && path.includes('/files/')) {
      const fileId = event.pathParameters?.fileId;
      if (!fileId) return badRequest('ID do arquivo é obrigatório', origin);
      return await deleteFile(kbId, fileId, origin);
    }

    // POST /admin/knowledge-bases/:id/links
    if (event.httpMethod === 'POST' && path.includes('/sitemap')) {
      return await importSitemap(kbId, event, origin);
    }

    if (event.httpMethod === 'POST' && path.includes('/links')) {
      return await addLink(kbId, event, origin);
    }

    // DELETE /admin/knowledge-bases/:id/links
    if (event.httpMethod === 'DELETE' && path.includes('/links')) {
      return await deleteLink(kbId, event, origin);
    }

    return badRequest('Rota não encontrada', origin);
  } catch (err: any) {
    console.error('Files handler error:', err);
    return error(err.message || 'Erro interno', err.statusCode || 500, origin);
  }
}

async function uploadFile(kbId: string, event: APIGatewayProxyEvent, origin?: string): Promise<APIGatewayProxyResult> {
  const body = event.body;
  if (!body) return badRequest('Corpo da requisição vazio', origin);

  let parsed: any;
  try {
    parsed = JSON.parse(body);
  } catch {
    return badRequest('JSON inválido no corpo da requisição', origin);
  }

  if (!parsed.fileName || !parsed.fileContent) {
    return badRequest('fileName e fileContent (base64) são obrigatórios', origin);
  }

  // Sanitiza o nome do arquivo contra path traversal (mantém pontos simples para extensão)
  const safeFileName = parsed.fileName
    .replace(/\.\./g, '_')          // remove sequências ..
    .replace(/[/\\]/g, '_')         // remove separadores de path
    .replace(/[^\w.\-\s]/g, '_')    // mantém apenas alfanuméricos, ponto, hífen, espaço
    .substring(0, 255);

  let fileBuffer: Buffer;
  try {
    fileBuffer = Buffer.from(parsed.fileContent, 'base64');
  } catch {
    return badRequest('fileContent deve ser uma string base64 válida', origin);
  }

  const contentType = parsed.contentType || 'application/octet-stream';

  // Valida o arquivo (extensão, tamanho, magic bytes)
  const validationError = validateFile(safeFileName, contentType, fileBuffer);
  if (validationError) {
    return badRequest(validationError.message, origin);
  }

  const file = await knowledgeBaseService.addFile(kbId, safeFileName, fileBuffer, contentType);
  return created(file, origin);
}

async function deleteFile(kbId: string, fileId: string, origin?: string): Promise<APIGatewayProxyResult> {
  await knowledgeBaseService.deleteFile(kbId, fileId);
  return noContent(origin);
}

async function getDownloadUrl(kbId: string, fileId: string, origin?: string): Promise<APIGatewayProxyResult> {
  const kb = await knowledgeBaseService.getById(kbId);
  const file = kb.files.find((f) => f.id === fileId);
  if (!file) return badRequest('Arquivo nao encontrado', origin);

  const url = await s3Service.getPresignedUrl(file.s3Key, file.name);
  return success({ url, fileName: file.name }, 200, origin);
}

async function addLink(kbId: string, event: APIGatewayProxyEvent, origin?: string): Promise<APIGatewayProxyResult> {
  let body: AddLinkRequest;
  try {
    body = JSON.parse(event.body || '{}') as AddLinkRequest;
  } catch {
    return badRequest('JSON inválido no corpo da requisição', origin);
  }

  if (!body.url) {
    return badRequest('URL é obrigatória', origin);
  }

  // Valida URL contra SSRF
  const urlError = validateUrl(body.url);
  if (urlError) {
    return badRequest(urlError.message, origin);
  }

  const link = await knowledgeBaseService.addLink(kbId, body);
  return created(link, origin);
}

async function deleteLink(kbId: string, event: APIGatewayProxyEvent, origin?: string): Promise<APIGatewayProxyResult> {
  let body: { linkId?: string };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return badRequest('JSON invalido', origin);
  }

  if (!body.linkId) {
    return badRequest('linkId e obrigatorio', origin);
  }

  await knowledgeBaseService.deleteLink(kbId, body.linkId);
  return noContent(origin);
}

async function importSitemap(kbId: string, event: APIGatewayProxyEvent, origin?: string): Promise<APIGatewayProxyResult> {
  let body: { url?: string };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return badRequest('JSON invalido', origin);
  }

  if (!body.url) {
    return badRequest('URL do sitemap e obrigatoria', origin);
  }

  try {
    // Fetch the sitemap XML
    const response = await fetch(body.url, {
      headers: { 'User-Agent': 'CopilotoCorporativo/1.0' },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return badRequest(`Falha ao acessar sitemap: HTTP ${response.status}`, origin);
    }

    const xml = await response.text();

    // Parse URLs from sitemap XML (handles both <url><loc> and <sitemap><loc>)
    const urls: string[] = [];
    const locRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
    let match;
    while ((match = locRegex.exec(xml)) !== null) {
      const loc = match[1].trim();
      if (loc.startsWith('http')) {
        urls.push(loc);
      }
    }

    if (urls.length === 0) {
      return badRequest('Nenhuma URL encontrada no sitemap', origin);
    }

    // Add each URL as a link (skip duplicates)
    const kb = await knowledgeBaseService.getById(kbId);
    const existingUrls = new Set(kb.links.map((l) => l.url));
    let added = 0;

    for (const url of urls) {
      if (!existingUrls.has(url)) {
        await knowledgeBaseService.addLink(kbId, { url });
        added++;
      }
    }

    return success({ added, total: urls.length, skipped: urls.length - added }, 200, origin);
  } catch (err: any) {
    return badRequest(`Erro ao processar sitemap: ${err.message}`, origin);
  }
}
