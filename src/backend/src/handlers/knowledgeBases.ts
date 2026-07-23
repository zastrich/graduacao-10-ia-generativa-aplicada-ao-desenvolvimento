/**
 * Knowledge Bases Handler — CRUD de bases de conhecimento (admin).
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import { requireAuth } from '../utils/auth';
import { success, created, noContent, badRequest, error, corsPreflightResponse } from '../utils/response';
import { CreateKnowledgeBaseRequest, UpdateKnowledgeBaseRequest } from '../utils/types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsPreflightResponse();

  try {
    // Todas as rotas admin requerem auth
    requireAuth(event);

    const id = event.pathParameters?.id;

    switch (event.httpMethod) {
      case 'POST':
        if (id && event.resource?.includes('/retrain')) {
          return await retrain(id);
        }
        return await createKnowledgeBase(event);

      case 'GET':
        if (id) return await getKnowledgeBase(id);
        return await listKnowledgeBases();

      case 'PUT':
        if (!id) return badRequest('ID é obrigatório');
        return await updateKnowledgeBase(id, event);

      case 'DELETE':
        if (!id) return badRequest('ID é obrigatório');
        return await deleteKnowledgeBase(id);

      default:
        return badRequest('Método não suportado');
    }
  } catch (err: any) {
    console.error('KnowledgeBases handler error:', err);
    return error(err.message || 'Erro interno', err.statusCode || 500);
  }
}

async function createKnowledgeBase(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}') as CreateKnowledgeBaseRequest;

  if (!body.name || !body.slug || !body.description) {
    return badRequest('Nome, slug e descrição são obrigatórios');
  }

  // Valida slug (apenas letras minúsculas, números e hífens)
  if (!/^[a-z0-9-]+$/.test(body.slug)) {
    return badRequest('Slug deve conter apenas letras minúsculas, números e hífens');
  }

  const kb = await knowledgeBaseService.create(body);
  return created(kb);
}

async function listKnowledgeBases(): Promise<APIGatewayProxyResult> {
  const bases = await knowledgeBaseService.list();
  return success(bases);
}

async function getKnowledgeBase(id: string): Promise<APIGatewayProxyResult> {
  const kb = await knowledgeBaseService.getById(id);
  return success(kb);
}

async function updateKnowledgeBase(id: string, event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}') as UpdateKnowledgeBaseRequest;
  const kb = await knowledgeBaseService.update(id, body);
  return success(kb);
}

async function deleteKnowledgeBase(id: string): Promise<APIGatewayProxyResult> {
  await knowledgeBaseService.delete(id);
  return noContent();
}

async function retrain(id: string): Promise<APIGatewayProxyResult> {
  const kb = await knowledgeBaseService.retrain(id);
  return success(kb);
}
