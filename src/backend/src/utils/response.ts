import { APIGatewayProxyResult } from 'aws-lambda';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

export function success<T>(data: T, statusCode = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: true, data }),
  };
}

export function created<T>(data: T): APIGatewayProxyResult {
  return success(data, 201);
}

export function noContent(): APIGatewayProxyResult {
  return {
    statusCode: 204,
    headers: CORS_HEADERS,
    body: '',
  };
}

export function error(message: string, statusCode = 500): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: false, error: message }),
  };
}

export function badRequest(message = 'Bad Request'): APIGatewayProxyResult {
  return error(message, 400);
}

export function unauthorized(message = 'Unauthorized'): APIGatewayProxyResult {
  return error(message, 401);
}

export function forbidden(message = 'Forbidden'): APIGatewayProxyResult {
  return error(message, 403);
}

export function notFound(message = 'Not Found'): APIGatewayProxyResult {
  return error(message, 404);
}

export function corsPreflightResponse(): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: '',
  };
}
