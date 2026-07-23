/**
 * Public Knowledge Bases Handler — Endpoints públicos (sem auth).
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import { success, badRequest, error, corsPreflightResponse } from '../utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === 'OPTIONS') return corsPreflightResponse();

  try {
    const slug = event.pathParameters?.slug;

    if (event.httpMethod === 'GET') {
      if (slug) return await getBySlug(slug);
      return await listPublic();
    }

    return badRequest('Método não suportado');
  } catch (err: any) {
    console.error('PublicKB handler error:', err);
    return error(err.message || 'Erro interno', err.statusCode || 500);
  }
}

async function listPublic(): Promise<APIGatewayProxyResult> {
  const bases = await knowledgeBaseService.list();

  // Retorna apenas campos públicos (sem detalhes internos)
  const publicBases = bases.map((kb) => ({
    id: kb.id,
    name: kb.name,
    slug: kb.slug,
    description: kb.description,
    fileCount: kb.fileCount,
    lastTrainedAt: kb.lastTrainedAt,
    updatedAt: kb.updatedAt,
  }));

  return success(publicBases);
}

async function getBySlug(slug: string): Promise<APIGatewayProxyResult> {
  const kb = await knowledgeBaseService.getBySlug(slug);

  return success({
    id: kb.id,
    name: kb.name,
    slug: kb.slug,
    description: kb.description,
    fileCount: kb.fileCount,
    lastTrainedAt: kb.lastTrainedAt,
    updatedAt: kb.updatedAt,
  });
}
