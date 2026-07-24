import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Lista de origens permitidas para CORS.
 * Configurada via variável de ambiente ALLOWED_ORIGINS (separadas por vírgula).
 * Em desenvolvimento local, aceita localhost:5173.
 */
const ALLOWED_ORIGINS: Set<string> = new Set(
  (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
);

/**
 * Retorna o valor do header Access-Control-Allow-Origin para uma origem específica.
 * Retorna a origem se ela estiver na lista de permitidas, undefined caso contrário.
 */
export function resolveAllowedOrigin(requestOrigin: string | undefined): string | undefined {
  if (!requestOrigin) return undefined;
  return ALLOWED_ORIGINS.has(requestOrigin) ? requestOrigin : undefined;
}

function buildCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigin = resolveAllowedOrigin(origin);
  return {
    ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
  };
}

export function success<T>(data: T, statusCode = 200, origin?: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: buildCorsHeaders(origin),
    body: JSON.stringify({ success: true, data }),
  };
}

export function created<T>(data: T, origin?: string): APIGatewayProxyResult {
  return success(data, 201, origin);
}

export function noContent(origin?: string): APIGatewayProxyResult {
  return {
    statusCode: 204,
    headers: buildCorsHeaders(origin),
    body: '',
  };
}

export function error(message: string, statusCode = 500, origin?: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: buildCorsHeaders(origin),
    body: JSON.stringify({ success: false, error: message }),
  };
}

export function badRequest(message = 'Bad Request', origin?: string): APIGatewayProxyResult {
  return error(message, 400, origin);
}

export function unauthorized(message = 'Unauthorized', origin?: string): APIGatewayProxyResult {
  return error(message, 401, origin);
}

export function forbidden(message = 'Forbidden', origin?: string): APIGatewayProxyResult {
  return error(message, 403, origin);
}

export function notFound(message = 'Not Found', origin?: string): APIGatewayProxyResult {
  return error(message, 404, origin);
}

export function corsPreflightResponse(origin?: string): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: buildCorsHeaders(origin),
    body: '',
  };
}
