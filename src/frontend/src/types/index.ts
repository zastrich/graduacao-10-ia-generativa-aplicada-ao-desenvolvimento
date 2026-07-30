export interface BedrockConfig {
  temperature: number;
  top_p: number;
  top_k: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  systemPrompt?: string;
  agentName?: string;
}

export interface LinkConfig {
  id: string;
  url: string;
  lastFetchedAt?: string;
  status?: 'pending' | 'success' | 'error' | 'skipped';
  statusMessage?: string;
  createdAt: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  s3Key: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  slug: string;
  description: string;
  bedrockConfig: BedrockConfig;
  fileCount: number;
  files?: FileItem[];
  links?: LinkConfig[];
  createdAt: string;
  updatedAt: string;
  lastTrainedAt?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  knowledgeBaseId: string;
  userUid: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
}
