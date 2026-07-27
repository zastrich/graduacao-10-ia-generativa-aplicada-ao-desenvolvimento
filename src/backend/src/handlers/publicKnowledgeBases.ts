/**
 * Public Knowledge Bases Handler — Endpoints públicos (sem auth).
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import { success, badRequest, error, corsPreflightResponse } from '../utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const origin = event.headers?.origin || event.headers?.Origin;
  if (event.httpMethod === 'OPTIONS') return corsPreflightResponse(origin);

  try {
    const slug = event.pathParameters?.slug;

    if (event.httpMethod === 'GET') {
      if (slug) return await getBySlug(slug, origin);
      return await listPublic(origin);
    }

    return badRequest('Método não suportado', origin);
  } catch (err: any) {
    console.error('PublicKB handler error:', err);
    return error(err.message || 'Erro interno', err.statusCode || 500, origin);
  }
}

async function listPublic(origin?: string): Promise<APIGatewayProxyResult> {
  const bases = await knowledgeBaseService.list();

  // Retorna campos públicos + agentName para exibição no chat
  const publicBases = bases.map((kb) => ({
    id: kb.id,
    name: kb.name,
    slug: kb.slug,
    description: kb.description,
    fileCount: kb.fileCount,
    lastTrainedAt: kb.lastTrainedAt,
    updatedAt: kb.updatedAt,
    agentName: kb.config?.agentName || '',
  }));

  return success(publicBases, 200, origin);
}

async function getBySlug(slug: string, origin?: string): Promise<APIGatewayProxyResult> {
  const kb = await knowledgeBaseService.getBySlug(slug);

  return success(
    {
      id: kb.id,
      name: kb.name,
      slug: kb.slug,
      description: kb.description,
      fileCount: kb.fileCount,
      lastTrainedAt: kb.lastTrainedAt,
      updatedAt: kb.updatedAt,
      agentName: kb.config?.agentName || '',
    },
    200,
    origin
  );
}
