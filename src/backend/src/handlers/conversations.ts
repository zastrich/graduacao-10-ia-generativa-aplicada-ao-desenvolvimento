/**
 * Conversations Handler — Lista, detalha e deleta conversas por usuário.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { chatService } from '../services/chatService';
import { success, noContent, badRequest, error, corsPreflightResponse } from '../utils/response';
import { dynamoService } from '../services/dynamoService';
import { config } from '../utils/config';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const origin = event.headers?.origin || event.headers?.Origin;
  if (event.httpMethod === 'OPTIONS') return corsPreflightResponse(origin);

  try {
    const uid = event.pathParameters?.uid;
    if (!uid) return badRequest('UID do usuario e obrigatorio', origin);

    const conversationId = event.pathParameters?.conversationId;

    if (event.httpMethod === 'GET') {
      if (conversationId) {
        return await getConversation(conversationId, origin);
      }
      return await listConversations(uid, origin);
    }

    if (event.httpMethod === 'DELETE' && conversationId) {
      return await deleteConversation(uid, conversationId, origin);
    }

    return badRequest('Metodo nao suportado', origin);
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

async function deleteConversation(userUid: string, conversationId: string, origin?: string): Promise<APIGatewayProxyResult> {
  // Verifica que a conversa pertence ao usuario
  const conv = await dynamoService.get(config.tables.conversations, { id: conversationId });
  if (!conv) {
    return error('Conversa nao encontrada', 404, origin);
  }
  if (conv.userUid !== userUid) {
    return error('Sem permissao para deletar esta conversa', 403, origin);
  }

  // Remove mensagens da conversa
  const messages = await dynamoService.query(config.tables.messages, { conversationId });
  for (const msg of messages) {
    await dynamoService.delete(config.tables.messages, { conversationId, createdAt: msg.createdAt });
  }

  // Remove a conversa
  await dynamoService.delete(config.tables.conversations, { id: conversationId });

  return noContent(origin);
}
