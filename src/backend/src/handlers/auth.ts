/**
 * Auth Handler — Login, Registro (first-run) e Status da plataforma.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { userService } from '../services/userService';
import { success, badRequest, forbidden, error, corsPreflightResponse } from '../utils/response';
import { LoginRequest, RegisterRequest } from '../utils/types';
import { authRateLimiter, RATE_LIMITS, getClientIp } from '../utils/rateLimiter';
import { resolveAllowedOrigin } from '../utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const origin = event.headers?.origin || event.headers?.Origin;
  if (event.httpMethod === 'OPTIONS') return corsPreflightResponse(origin);

  try {
    const path = event.resource || event.path;

    if (event.httpMethod === 'GET' && path.includes('/auth/status')) {
      return await getStatus(origin);
    }

    if (event.httpMethod === 'POST' && path.includes('/auth/login')) {
      return await login(event, origin);
    }

    if (event.httpMethod === 'POST' && path.includes('/auth/register')) {
      return await register(event, origin);
    }

    return badRequest('Rota não encontrada', origin);
  } catch (err: any) {
    console.error('Auth handler error:', err);
    return error(err.message || 'Erro interno', err.statusCode || 500, origin);
  }
}

/**
 * GET /auth/status
 * Retorna se a plataforma está no estado "first-run" (sem nenhum admin cadastrado).
 * O frontend usa isso para decidir se exibe o formulário de registro ou de login.
 */
async function getStatus(origin?: string): Promise<APIGatewayProxyResult> {
  const hasUser = await userService.hasAnyUser();
  return success({ isFirstRun: !hasUser }, 200, origin);
}

async function login(event: APIGatewayProxyEvent, origin?: string): Promise<APIGatewayProxyResult> {
  // Rate limiting por IP para mitigar força bruta
  const clientIp = getClientIp(event.headers as Record<string, string | undefined>);
  const rateLimitKey = `login:${clientIp}`;

  if (authRateLimiter.isRateLimited(rateLimitKey, RATE_LIMITS.auth.maxAttempts, RATE_LIMITS.auth.windowMs)) {
    const retryAfter = authRateLimiter.getRetryAfterSeconds(rateLimitKey, RATE_LIMITS.auth.windowMs);
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
        error: `Muitas tentativas de login. Tente novamente em ${retryAfter} segundos.`,
      }),
    };
  }

  const body = JSON.parse(event.body || '{}') as LoginRequest;

  if (!body.email || !body.password) {
    return badRequest('Email e senha são obrigatórios', origin);
  }

  const result = await userService.login(body.email, body.password);
  return success(result, 200, origin);
}

async function register(event: APIGatewayProxyEvent, origin?: string): Promise<APIGatewayProxyResult> {
  // Verifica first-run: registro só é permitido se não houver nenhum usuário
  const hasUser = await userService.hasAnyUser();
  if (hasUser) {
    return forbidden('Registro não permitido. Contate o administrador da plataforma.', origin);
  }

  const body = JSON.parse(event.body || '{}') as RegisterRequest;

  if (!body.email || !body.password || !body.name) {
    return badRequest('Email, senha e nome são obrigatórios', origin);
  }

  // Senha mínima de 12 caracteres para conta administrativa
  if (body.password.length < 12) {
    return badRequest('A senha deve ter no mínimo 12 caracteres', origin);
  }

  const result = await userService.register(body.email, body.password, body.name);
  return success(result, 201, origin);
}
