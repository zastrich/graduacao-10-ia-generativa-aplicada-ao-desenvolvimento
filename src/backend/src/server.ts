/**
 * Servidor local de desenvolvimento — simula API Gateway + Lambda localmente.
 * Usa Node.js http nativo (sem Express para manter as deps leves).
 */

import http from 'http';
import { URL } from 'url';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { config } from './utils/config';

// Força modo local
process.env.IS_LOCAL = 'true';
process.env.NODE_ENV = 'development';

// Import dos handlers
import { handler as authHandler } from './handlers/auth';
import { handler as knowledgeBasesHandler } from './handlers/knowledgeBases';
import { handler as filesHandler } from './handlers/files';
import { handler as chatHandler } from './handlers/chat';
import { handler as conversationsHandler } from './handlers/conversations';
import { handler as publicKnowledgeBasesHandler } from './handlers/publicKnowledgeBases';
import { handler as adminLogsHandler } from './handlers/adminLogs';

// Definição de rotas
interface Route {
  method: string;
  pattern: RegExp;
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
  resource: string;
  paramNames: string[];
}

const routes: Route[] = [
  // Auth
  { method: 'POST', pattern: /^\/auth\/login$/, handler: authHandler, resource: '/auth/login', paramNames: [] },
  { method: 'POST', pattern: /^\/auth\/register$/, handler: authHandler, resource: '/auth/register', paramNames: [] },

  // Admin - Knowledge Bases
  { method: 'POST', pattern: /^\/admin\/knowledge-bases$/, handler: knowledgeBasesHandler, resource: '/admin/knowledge-bases', paramNames: [] },
  { method: 'GET', pattern: /^\/admin\/knowledge-bases$/, handler: knowledgeBasesHandler, resource: '/admin/knowledge-bases', paramNames: [] },
  { method: 'GET', pattern: /^\/admin\/knowledge-bases\/([^/]+)$/, handler: knowledgeBasesHandler, resource: '/admin/knowledge-bases/{id}', paramNames: ['id'] },
  { method: 'PUT', pattern: /^\/admin\/knowledge-bases\/([^/]+)$/, handler: knowledgeBasesHandler, resource: '/admin/knowledge-bases/{id}', paramNames: ['id'] },
  { method: 'DELETE', pattern: /^\/admin\/knowledge-bases\/([^/]+)$/, handler: knowledgeBasesHandler, resource: '/admin/knowledge-bases/{id}', paramNames: ['id'] },
  { method: 'POST', pattern: /^\/admin\/knowledge-bases\/([^/]+)\/retrain$/, handler: knowledgeBasesHandler, resource: '/admin/knowledge-bases/{id}/retrain', paramNames: ['id'] },

  // Admin - Files & Links
  { method: 'POST', pattern: /^\/admin\/knowledge-bases\/([^/]+)\/files$/, handler: filesHandler, resource: '/admin/knowledge-bases/{id}/files', paramNames: ['id'] },
  { method: 'DELETE', pattern: /^\/admin\/knowledge-bases\/([^/]+)\/files\/([^/]+)$/, handler: filesHandler, resource: '/admin/knowledge-bases/{id}/files/{fileId}', paramNames: ['id', 'fileId'] },
  { method: 'POST', pattern: /^\/admin\/knowledge-bases\/([^/]+)\/links$/, handler: filesHandler, resource: '/admin/knowledge-bases/{id}/links', paramNames: ['id'] },

  // Admin - Logs
  { method: 'GET', pattern: /^\/admin\/logs$/, handler: adminLogsHandler, resource: '/admin/logs', paramNames: [] },

  // Chat
  { method: 'POST', pattern: /^\/chat\/([^/]+)$/, handler: chatHandler, resource: '/chat/{slug}', paramNames: ['slug'] },

  // Conversations
  { method: 'GET', pattern: /^\/conversations\/([^/]+)$/, handler: conversationsHandler, resource: '/conversations/{uid}', paramNames: ['uid'] },
  { method: 'GET', pattern: /^\/conversations\/([^/]+)\/([^/]+)$/, handler: conversationsHandler, resource: '/conversations/{uid}/{conversationId}', paramNames: ['uid', 'conversationId'] },

  // Public - Knowledge Bases
  { method: 'GET', pattern: /^\/knowledge-bases$/, handler: publicKnowledgeBasesHandler, resource: '/knowledge-bases', paramNames: [] },
  { method: 'GET', pattern: /^\/knowledge-bases\/([^/]+)$/, handler: publicKnowledgeBasesHandler, resource: '/knowledge-bases/{slug}', paramNames: ['slug'] },
];

function findRoute(method: string, pathname: string): { route: Route; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method && method !== 'OPTIONS') continue;

    const match = pathname.match(route.pattern);
    if (match) {
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });
      return { route, params };
    }
  }
  return null;
}

function buildEvent(method: string, pathname: string, params: Record<string, string>, headers: Record<string, string>, body: string | null, queryParams: Record<string, string>, resource: string): APIGatewayProxyEvent {
  return {
    httpMethod: method,
    path: pathname,
    resource,
    pathParameters: Object.keys(params).length > 0 ? params : null,
    queryStringParameters: Object.keys(queryParams).length > 0 ? queryParams : null,
    headers,
    body,
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${config.localServer.port}`);
  const method = req.method || 'GET';
  const pathname = url.pathname;

  console.log(`\n[${new Date().toISOString()}] ${method} ${pathname}`);

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    });
    res.end();
    return;
  }

  const matched = findRoute(method, pathname);
  if (!matched) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Rota não encontrada' }));
    return;
  }

  // Lê o body
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  // Monta query params
  const queryParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  // Monta headers
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers[key] = value;
  }

  try {
    const event = buildEvent(method, pathname, matched.params, headers, body || null, queryParams, matched.route.resource);
    const result = await matched.route.handler(event);

    res.writeHead(result.statusCode, result.headers as Record<string, string>);
    res.end(result.body);

    console.log(`  → ${result.statusCode}`);
  } catch (err) {
    console.error('  → ERROR:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Erro interno do servidor' }));
  }
});

server.listen(config.localServer.port, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║  🤖 Copiloto Corporativo — Backend Local         ║');
  console.log(`║  🌐 http://localhost:${config.localServer.port}                       ║`);
  console.log('║  📦 Modo: DEVELOPMENT (mocks ativos)             ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');
  console.log('Rotas disponíveis:');
  console.log('  POST   /auth/login');
  console.log('  POST   /auth/register');
  console.log('  CRUD   /admin/knowledge-bases/*');
  console.log('  POST   /admin/knowledge-bases/:id/files');
  console.log('  POST   /admin/knowledge-bases/:id/links');
  console.log('  POST   /admin/knowledge-bases/:id/retrain');
  console.log('  GET    /admin/logs');
  console.log('  POST   /chat/:slug');
  console.log('  GET    /conversations/:uid');
  console.log('  GET    /conversations/:uid/:conversationId');
  console.log('  GET    /knowledge-bases');
  console.log('  GET    /knowledge-bases/:slug');
  console.log('');
});
