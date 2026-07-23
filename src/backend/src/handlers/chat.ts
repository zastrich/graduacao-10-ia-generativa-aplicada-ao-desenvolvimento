/**
 * Chat Handler — Endpoint de chat público (inferência com Bedrock).
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { chatService } from '../services/chatService';
import { success, badRequest, error, corsPreflightResponse } from '../utils/response';
import { ChatRequest } from '../utils/types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsPreflightResponse();

  try {
    const slug = event.pathParameters?.slug;
    if (!slug) return badRequest('Slug da base é obrigatório');

    if (event.httpMethod === 'POST') {
      return await sendMessage(slug, event);
    }

    return badRequest('Método não suportado');
  } catch (err: any) {
    console.error('Chat handler error:', err);
    return error(err.message || 'Erro interno', err.statusCode || 500);
  }
}

async function sendMessage(slug: string, event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}') as ChatRequest;

  if (!body.message || !body.userUid) {
    return badRequest('message e userUid são obrigatórios');
  }

  const result = await chatService.sendMessage(slug, body);
  return success(result);
}
