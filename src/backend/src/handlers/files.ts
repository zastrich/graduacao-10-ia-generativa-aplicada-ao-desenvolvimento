/**
 * Files Handler — Upload e gerenciamento de arquivos nas bases de conhecimento.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import { requireAuth } from '../utils/auth';
import { success, created, noContent, badRequest, error, corsPreflightResponse } from '../utils/response';
import { AddLinkRequest } from '../utils/types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsPreflightResponse();

  try {
    requireAuth(event);

    const kbId = event.pathParameters?.id;
    if (!kbId) return badRequest('ID da base é obrigatório');

    const path = event.resource || event.path;

    // POST /admin/knowledge-bases/:id/files
    if (event.httpMethod === 'POST' && path.includes('/files')) {
      return await uploadFile(kbId, event);
    }

    // DELETE /admin/knowledge-bases/:id/files/:fileId
    if (event.httpMethod === 'DELETE' && path.includes('/files/')) {
      const fileId = event.pathParameters?.fileId;
      if (!fileId) return badRequest('ID do arquivo é obrigatório');
      return await deleteFile(kbId, fileId);
    }

    // POST /admin/knowledge-bases/:id/links
    if (event.httpMethod === 'POST' && path.includes('/links')) {
      return await addLink(kbId, event);
    }

    return badRequest('Rota não encontrada');
  } catch (err: any) {
    console.error('Files handler error:', err);
    return error(err.message || 'Erro interno', err.statusCode || 500);
  }
}

async function uploadFile(kbId: string, event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = event.body;
  if (!body) return badRequest('Corpo da requisição vazio');

  // Para simplificar, aceita JSON com base64
  // Em produção, usar multipart/form-data
  const parsed = JSON.parse(body);
  
  if (!parsed.fileName || !parsed.fileContent) {
    return badRequest('fileName e fileContent (base64) são obrigatórios');
  }

  const fileBuffer = Buffer.from(parsed.fileContent, 'base64');
  const contentType = parsed.contentType || 'application/octet-stream';

  const file = await knowledgeBaseService.addFile(kbId, parsed.fileName, fileBuffer, contentType);
  return created(file);
}

async function deleteFile(kbId: string, fileId: string): Promise<APIGatewayProxyResult> {
  await knowledgeBaseService.deleteFile(kbId, fileId);
  return noContent();
}

async function addLink(kbId: string, event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}') as AddLinkRequest;

  if (!body.url) {
    return badRequest('URL é obrigatória');
  }

  const link = await knowledgeBaseService.addLink(kbId, body);
  return created(link);
}
