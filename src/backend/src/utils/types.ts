// ============================================================
// Knowledge Base Types
// ============================================================
export interface KnowledgeBase {
  id: string;
  name: string;
  slug: string;
  description: string;
  fileCount: number;
  files: KnowledgeBaseFile[];
  links: KnowledgeBaseLink[];
  config: BedrockConfig;
  lastTrainedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeBaseFile {
  id: string;
  name: string;
  type: string;
  size: number;
  s3Key: string;
  uploadedAt: string;
}

/**
 * Conteúdo parseado de um arquivo, armazenado na tabela de chunks.
 * Separado da KB para manter os objetos leves.
 */
export interface ParsedChunk {
  knowledgeBaseId: string;
  fileId: string;
  fileName: string;
  content: string;
  parsedAt: string;
}

export interface KnowledgeBaseLink {
  id: string;
  url: string;
  refreshIntervalHours: number | null;
  lastFetchedAt: string | null;
  content: string | null;
  createdAt: string;
}

export interface BedrockConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number;
  systemPrompt: string;
  agentName: string;
}

export const DEFAULT_BEDROCK_CONFIG: BedrockConfig = {
  temperature: 0.3,
  topP: 0.85,
  topK: 30,
  maxTokens: 1024,
  agentName: '',
  systemPrompt:
    'Voce e um assistente de atendimento. Responda com base EXCLUSIVAMENTE no contexto fornecido.\n\n' +
    'Regras:\n' +
    '- Se a pergunta do usuario corresponder a MAIS DE UM servico/documento no contexto, liste todos os servicos encontrados de forma resumida (nome + breve descricao) e pergunte qual o usuario deseja saber mais.\n' +
    '- Se a pergunta corresponder a UM UNICO servico com alta certeza, responda diretamente com as informacoes detalhadas desse servico.\n' +
    '- Se nao encontrar nenhuma informacao relevante no contexto, diga: "Nao encontrei informacoes sobre esse assunto nos documentos disponiveis."\n' +
    '- NUNCA invente informacoes que nao estejam no contexto.\n' +
    '- Ignore tags HTML no contexto, extraia apenas o texto relevante.\n' +
    '- Seja objetivo e use linguagem acessivel.',
};

// ============================================================
// Conversation Types
// ============================================================
export interface Conversation {
  id: string;
  userUid: string;
  knowledgeBaseId: string;
  knowledgeBaseSlug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  conversationId: string;
  createdAt: string;
  role: 'user' | 'assistant';
  content: string;
}

// ============================================================
// User Types
// ============================================================
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// ============================================================
// API Request/Response Types
// ============================================================
export interface CreateKnowledgeBaseRequest {
  name: string;
  slug: string;
  description: string;
  config?: Partial<BedrockConfig>;
}

export interface UpdateKnowledgeBaseRequest {
  name?: string;
  slug?: string;
  description?: string;
  config?: Partial<BedrockConfig>;
}

export interface ChatRequest {
  message: string;
  userUid: string;
  conversationId?: string;
}

export interface ChatResponse {
  conversationId: string;
  message: Message;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
}

export interface AddLinkRequest {
  url: string;
  refreshIntervalHours?: number;
}
