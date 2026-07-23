const isLocal = process.env.IS_LOCAL === 'true' || process.env.NODE_ENV === 'development';

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
    jwtSecret: process.env.JWT_SECRET || 'copiloto-jwt-secret-dev',
    bcryptRounds: 10,
  },
  localServer: {
    port: parseInt(process.env.PORT || '3001', 10),
  },
};
