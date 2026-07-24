/**
 * Chat Handler — Endpoint de chat público (inferência com Bedrock).
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { chatService } from '../services/chatService';
import { success, badRequest, error, corsPreflightResponse } from '../utils/response';
import { resolveAllowedOrigin } from '../utils/response';
import { ChatRequest } from '../utils/types';
import { chatRateLimiter, RATE_LIMITS } from '../utils/rateLimiter';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const origin = event.headers?.origin || event.headers?.Origin;
  if (event.httpMethod === 'OPTIONS') return corsPreflightResponse(origin);

  try {
    const slug = event.pathParameters?.slug;
    if (!slug) return badRequest('Slug da base é obrigatório', origin);

    if (event.httpMethod === 'POST') {
      return await sendMessage(slug, event, origin);
    }

    return badRequest('Método não suportado', origin);
  } catch (err: any) {
    console.error('Chat handler error:', err);
    return error(err.message || 'Erro interno', err.statusCode || 500, origin);
  }
}

async function sendMessage(slug: string, event: APIGatewayProxyEvent, origin?: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}') as ChatRequest;

  if (!body.message || !body.userUid) {
    return badRequest('message e userUid são obrigatórios', origin);
  }

  // Limite de tamanho da mensagem (proteção contra prompt injection e abuso)
  if (body.message.length > 2000) {
    return badRequest('A mensagem não pode ultrapassar 2000 caracteres', origin);
  }

  // Rate limiting por userUid para controlar custo do Bedrock
  const rateLimitKey = `chat:${body.userUid}`;
  if (chatRateLimiter.isRateLimited(rateLimitKey, RATE_LIMITS.chat.maxRequests, RATE_LIMITS.chat.windowMs)) {
    const retryAfter = chatRateLimiter.getRetryAfterSeconds(rateLimitKey, RATE_LIMITS.chat.windowMs);
    const allowedOrigin = resolveAllowedOrigin(origin);
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: `Limite de mensagens atingido. Tente novamente em ${retryAfter} segundos.`,
      }),
    };
  }

  const result = await chatService.sendMessage(slug, body);
  return success(result, 200, origin);
}
