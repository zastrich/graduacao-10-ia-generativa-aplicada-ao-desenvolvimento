/**
 * Auth Handler — Login e Registro de usuários admin.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { userService } from '../services/userService';
import { success, badRequest, error, corsPreflightResponse } from '../utils/response';
import { LoginRequest, RegisterRequest } from '../utils/types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsPreflightResponse();

  try {
    const path = event.resource || event.path;

    if (event.httpMethod === 'POST' && path.includes('/auth/login')) {
      return await login(event);
    }

    if (event.httpMethod === 'POST' && path.includes('/auth/register')) {
      return await register(event);
    }

    return badRequest('Rota não encontrada');
  } catch (err: any) {
    console.error('Auth handler error:', err);
    return error(err.message || 'Erro interno', err.statusCode || 500);
  }
}

async function login(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}') as LoginRequest;

  if (!body.email || !body.password) {
    return badRequest('Email e senha são obrigatórios');
  }

  const result = await userService.login(body.email, body.password);
  return success(result);
}

async function register(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}') as RegisterRequest;

  if (!body.email || !body.password || !body.name) {
    return badRequest('Email, senha e nome são obrigatórios');
  }

  if (body.password.length < 6) {
    return badRequest('A senha deve ter no mínimo 6 caracteres');
  }

  const result = await userService.register(body.email, body.password, body.name);
  return success(result, 201);
}
