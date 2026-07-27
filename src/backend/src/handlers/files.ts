/**
 * Files Handler — Upload e gerenciamento de arquivos nas bases de conhecimento.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
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

    // DELETE /admin/knowledge-bases/:id/files/:fileId
    if (event.httpMethod === 'DELETE' && path.includes('/files/')) {
      const fileId = event.pathParameters?.fileId;
      if (!fileId) return badRequest('ID do arquivo é obrigatório', origin);
      return await deleteFile(kbId, fileId, origin);
    }

    // POST /admin/knowledge-bases/:id/links
    if (event.httpMethod === 'POST' && path.includes('/links')) {
      return await addLink(kbId, event, origin);
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
