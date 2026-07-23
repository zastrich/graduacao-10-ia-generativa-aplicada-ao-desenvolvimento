/**
 * Admin Logs Handler — Visualização de logs de conversas (admin).
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { chatService } from '../services/chatService';
import { requireAuth } from '../utils/auth';
import { success, badRequest, error, corsPreflightResponse } from '../utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsPreflightResponse();

  try {
    requireAuth(event);

    if (event.httpMethod === 'GET') {
      return await getLogs(event);
    }

    return badRequest('Método não suportado');
  } catch (err: any) {
    console.error('AdminLogs handler error:', err);
    return error(err.message || 'Erro interno', err.statusCode || 500);
  }
}

async function getLogs(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const knowledgeBaseId = event.queryStringParameters?.knowledgeBaseId;

  let conversations;
  if (knowledgeBaseId) {
    conversations = await chatService.getLogsByKnowledgeBase(knowledgeBaseId);
  } else {
    conversations = await chatService.getAllConversations();
  }

  return success(conversations);
}
