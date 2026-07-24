const isLocal = process.env.IS_LOCAL === 'true' || process.env.NODE_ENV === 'development';

/**
 * Retorna o JWT_SECRET de forma segura.
 * - Em produção: lança erro se a variável não estiver definida ou for o valor padrão inseguro.
 * - Em local: usa o valor padrão de dev com aviso no console.
 */
function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const insecureDefault = 'copiloto-jwt-secret-dev';

  if (!isLocal) {
    if (!secret) {
      throw new Error(
        '[SECURITY] JWT_SECRET não está definido. Defina a variável de ambiente antes de iniciar em produção.'
      );
    }
    if (secret === insecureDefault || secret === 'copiloto-jwt-secret-change-in-production') {
      throw new Error(
        '[SECURITY] JWT_SECRET está usando um valor padrão inseguro. Gere um segredo forte com: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
      );
    }
    return secret;
  }

  // Modo local: aceita valor padrão mas alerta
  if (!secret || secret === insecureDefault) {
    console.warn(
      '[WARN] JWT_SECRET não definido ou usando valor padrão de desenvolvimento. Nunca use em produção.'
    );
    return insecureDefault;
  }
  return secret;
}

export const config = {
  isLocal,
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    bedrockModelId: process.env.BEDROCK_MODEL_ID || 'google.gemma-3-4b-it',
  },
  tables: {
    knowledgeBases: process.env.KNOWLEDGE_BASES_TABLE || 'copiloto-knowledge-bases-dev',
    conversations: process.env.CONVERSATIONS_TABLE || 'copiloto-conversations-dev',
    messages: process.env.MESSAGES_TABLE || 'copiloto-messages-dev',
    users: process.env.USERS_TABLE || 'copiloto-users-dev',
  },
  s3: {
    knowledgeBucket: process.env.KNOWLEDGE_BUCKET || 'conhecimento-ia-generativa-dev',
  },
  auth: {
    jwtSecret: resolveJwtSecret(),
    bcryptRounds: 10,
  },
  localServer: {
    port: parseInt(process.env.PORT || '3001', 10),
  },
};
