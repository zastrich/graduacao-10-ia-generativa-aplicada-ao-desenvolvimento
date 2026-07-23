/**
 * Conversations Handler — Lista e detalha conversas por usuário.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { chatService } from '../services/chatService';
import { success, badRequest, error, corsPreflightResponse } from '../utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsPreflightResponse();

  try {
    const uid = event.pathParameters?.uid;
    if (!uid) return badRequest('UID do usuário é obrigatório');

    const conversationId = event.pathParameters?.conversationId;

    if (event.httpMethod === 'GET') {
      if (conversationId) {
        return await getConversation(conversationId);
      }
      return await listConversations(uid);
    }

    return badRequest('Método não suportado');
  } catch (err: any) {
    console.error('Conversations handler error:', err);
    return error(err.message || 'Erro interno', err.statusCode || 500);
  }
}

async function listConversations(userUid: string): Promise<APIGatewayProxyResult> {
  const conversations = await chatService.getConversationsByUser(userUid);
  return success(conversations);
}

async function getConversation(conversationId: string): Promise<APIGatewayProxyResult> {
  const result = await chatService.getConversation(conversationId);
  return success(result);
}
