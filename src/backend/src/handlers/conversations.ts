/**
 * Conversations Handler — Lista e detalha conversas por usuário (requer auth de admin).
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { chatService } from '../services/chatService';
import { requireAuth } from '../utils/auth';
import { success, badRequest, error, corsPreflightResponse } from '../utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const origin = event.headers?.origin || event.headers?.Origin;
  if (event.httpMethod === 'OPTIONS') return corsPreflightResponse(origin);

  try {
    // Acesso ao histórico de conversas requer autenticação de admin
    requireAuth(event);

    const uid = event.pathParameters?.uid;
    if (!uid) return badRequest('UID do usuário é obrigatório', origin);

    const conversationId = event.pathParameters?.conversationId;

    if (event.httpMethod === 'GET') {
      if (conversationId) {
        return await getConversation(conversationId, origin);
      }
      return await listConversations(uid, origin);
    }

    return badRequest('Método não suportado', origin);
  } catch (err: any) {
    console.error('Conversations handler error:', err);
    return error(err.message || 'Erro interno', err.statusCode || 500, origin);
  }
}

async function listConversations(userUid: string, origin?: string): Promise<APIGatewayProxyResult> {
  const conversations = await chatService.getConversationsByUser(userUid);
  return success(conversations, 200, origin);
}

async function getConversation(conversationId: string, origin?: string): Promise<APIGatewayProxyResult> {
  const result = await chatService.getConversation(conversationId);
  return success(result, 200, origin);
}
