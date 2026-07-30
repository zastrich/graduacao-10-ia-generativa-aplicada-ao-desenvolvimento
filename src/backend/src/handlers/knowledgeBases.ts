/**
 * Knowledge Bases Handler — CRUD de bases de conhecimento (admin).
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import { requireAuth } from '../utils/auth';
import { success, created, noContent, badRequest, error, corsPreflightResponse } from '../utils/response';
import { CreateKnowledgeBaseRequest, UpdateKnowledgeBaseRequest } from '../utils/types';

const MAX_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const origin = event.headers?.origin || event.headers?.Origin;
  if (event.httpMethod === 'OPTIONS') return corsPreflightResponse(origin);

  try {
    // Todas as rotas admin requerem auth
    requireAuth(event);

    const id = event.pathParameters?.id;

    switch (event.httpMethod) {
      case 'POST':
        if (id && event.resource?.includes('/retrain')) {
          return await retrain(id, event, origin);
        }
        if (id && event.resource?.includes('/cancel-retrain')) {
          await knowledgeBaseService.cancelRetrain(id);
          return success({ message: 'Cancelamento solicitado.' }, 200, origin);
        }
        return await createKnowledgeBase(event, origin);

      case 'GET':
        if (id) return await getKnowledgeBase(id, origin);
        return await listKnowledgeBases(origin);

      case 'PUT':
        if (!id) return badRequest('ID é obrigatório', origin);
        return await updateKnowledgeBase(id, event, origin);

      case 'DELETE':
        if (!id) return badRequest('ID é obrigatório', origin);
        return await deleteKnowledgeBase(id, origin);

      default:
        return badRequest('Método não suportado', origin);
    }
  } catch (err: any) {
    console.error('KnowledgeBases handler error:', err);
    return error(err.message || 'Erro interno', err.statusCode || 500, origin);
  }
}

async function createKnowledgeBase(event: APIGatewayProxyEvent, origin?: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}') as CreateKnowledgeBaseRequest;

  if (!body.name || !body.slug || !body.description) {
    return badRequest('Nome, slug e descrição são obrigatórios', origin);
  }

  // Valida tamanhos máximos (M6)
  if (body.name.length > MAX_NAME_LENGTH) {
    return badRequest(`Nome não pode ultrapassar ${MAX_NAME_LENGTH} caracteres`, origin);
  }
  if (body.description.length > MAX_DESCRIPTION_LENGTH) {
    return badRequest(`Descrição não pode ultrapassar ${MAX_DESCRIPTION_LENGTH} caracteres`, origin);
  }

  // Valida slug (apenas letras minúsculas, números e hífens)
  if (!/^[a-z0-9-]+$/.test(body.slug)) {
    return badRequest('Slug deve conter apenas letras minúsculas, números e hífens', origin);
  }

  const kb = await knowledgeBaseService.create(body);
  return created(kb, origin);
}

async function listKnowledgeBases(origin?: string): Promise<APIGatewayProxyResult> {
  const bases = await knowledgeBaseService.list();
  return success(bases, 200, origin);
}

async function getKnowledgeBase(id: string, origin?: string): Promise<APIGatewayProxyResult> {
  const kb = await knowledgeBaseService.getById(id);
  return success(kb, 200, origin);
}

async function updateKnowledgeBase(id: string, event: APIGatewayProxyEvent, origin?: string): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}') as UpdateKnowledgeBaseRequest;

  // Valida tamanhos se fornecidos
  if (body.name && body.name.length > MAX_NAME_LENGTH) {
    return badRequest(`Nome não pode ultrapassar ${MAX_NAME_LENGTH} caracteres`, origin);
  }
  if (body.description && body.description.length > MAX_DESCRIPTION_LENGTH) {
    return badRequest(`Descrição não pode ultrapassar ${MAX_DESCRIPTION_LENGTH} caracteres`, origin);
  }

  const kb = await knowledgeBaseService.update(id, body);
  return success(kb, 200, origin);
}

async function deleteKnowledgeBase(id: string, origin?: string): Promise<APIGatewayProxyResult> {
  await knowledgeBaseService.delete(id);
  return noContent(origin);
}

async function retrain(id: string, event: APIGatewayProxyEvent, origin?: string): Promise<APIGatewayProxyResult> {
  // Se chamado com header X-Async-Retrain, processa inline (invocacao async da propria Lambda)
  const isAsyncInvocation = event.headers?.['x-async-retrain'] === 'true';

  if (isAsyncInvocation) {
    // Processamento real — chamado via Lambda invoke async
    try {
      const kb = await knowledgeBaseService.retrain(id);
      return success(kb, 200, origin);
    } catch (err: any) {
      // Se falhar, reseta o status para idle
      await knowledgeBaseService.cancelRetrain(id);
      console.error('[Retrain async] Erro:', err);
      return error(err.message || 'Erro no retreinamento', 500, origin);
    }
  }

  // Chamado via API Gateway — retorna imediatamente e dispara processamento async
  const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (functionName) {
    const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');
    const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

    const asyncEvent = {
      ...event,
      headers: { ...event.headers, 'x-async-retrain': 'true' },
    };

    await lambda.send(new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'Event', // Fire-and-forget
      Payload: Buffer.from(JSON.stringify(asyncEvent)),
    }));
  } else {
    // Fallback: executa inline (dev local)
    await knowledgeBaseService.retrain(id);
  }

  return success({ message: 'Retreinamento iniciado. O processo pode levar alguns minutos dependendo da quantidade de links.' }, 202, origin);
}
