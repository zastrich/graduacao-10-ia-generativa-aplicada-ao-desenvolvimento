import axios from 'axios';
import { getAdminToken, removeAdminToken, getUserUid } from '../utils/uid';
import type {
  KnowledgeBase,
  Conversation,
  AuthResponse,
  UserPublic,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de requisição — injeta JWT de admin se existir
apiClient.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de resposta — extrai .data do wrapper {success, data} e trata 401
apiClient.interceptors.response.use(
  (response) => {
    // A API retorna { success: boolean, data: T } — extrai o data para simplificar
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Remove token inválido e redireciona para login
      removeAdminToken();
      // Evita redirecionar se já estiver na página de login
      if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- Public Endpoints ---
export async function fetchPublicKnowledgeBases(): Promise<KnowledgeBase[]> {
  const res = await apiClient.get<KnowledgeBase[]>('/knowledge-bases');
  return res.data ?? [];
}

export async function fetchPublicKnowledgeBaseBySlug(slug: string): Promise<KnowledgeBase> {
  const res = await apiClient.get<KnowledgeBase>(`/knowledge-bases/${slug}`);
  return res.data;
}

export async function sendChatMessage(
  slug: string,
  message: string,
  conversationId?: string
): Promise<{ response: string; conversationId: string; title?: string }> {
  const userUid = getUserUid();
  const res = await apiClient.post(
    `/chat/${slug}`,
    {
      message,
      conversationId,
      userUid,
    }
  );
  // Backend retorna { conversationId, message: { content, role, ... } }
  const data = res.data as any;
  return {
    response: data.message?.content || data.response || '',
    conversationId: data.conversationId,
    title: data.title,
  };
}

export async function fetchUserConversations(): Promise<Conversation[]> {
  const userUid = getUserUid();
  const res = await apiClient.get<Conversation[]>(`/conversations/${userUid}`);
  return res.data;
}

export async function fetchConversationDetails(conversationId: string): Promise<Conversation> {
  const userUid = getUserUid();
  const res = await apiClient.get(`/conversations/${userUid}/${conversationId}`);
  const data = res.data as any;
  // Backend messages have {role, content, createdAt} - map to frontend {sender, content, timestamp, id}
  const messages = (data.messages || []).map((msg: any, i: number) => ({
    id: msg.id || `msg_${i}_${msg.createdAt}`,
    sender: msg.role || msg.sender || 'assistant',
    content: msg.content,
    timestamp: msg.createdAt || msg.timestamp,
  }));
  return { ...data, messages };
}

// --- Admin Auth Endpoints ---
export async function fetchAuthStatus(): Promise<{ isFirstRun: boolean }> {
  const res = await apiClient.get<{ isFirstRun: boolean }>('/auth/status');
  return res.data;
}

export async function adminLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  return res.data;
}

export async function adminRegister(email: string, password: string, name: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/register', { email, password, name });
  return res.data;
}

// --- Admin Knowledge Base Endpoints ---
export async function fetchAdminKnowledgeBases(): Promise<KnowledgeBase[]> {
  const res = await apiClient.get<KnowledgeBase[]>('/admin/knowledge-bases');
  return res.data;
}

export async function fetchAdminKnowledgeBaseById(id: string): Promise<KnowledgeBase> {
  const res = await apiClient.get<KnowledgeBase>(`/admin/knowledge-bases/${id}`);
  return res.data;
}

export async function createKnowledgeBase(data: Partial<KnowledgeBase>): Promise<KnowledgeBase> {
  const res = await apiClient.post<KnowledgeBase>('/admin/knowledge-bases', data);
  return res.data;
}

export async function updateKnowledgeBase(id: string, data: Partial<KnowledgeBase>): Promise<KnowledgeBase> {
  const res = await apiClient.put<KnowledgeBase>(`/admin/knowledge-bases/${id}`, data);
  return res.data;
}

export async function deleteKnowledgeBase(id: string): Promise<void> {
  await apiClient.delete(`/admin/knowledge-bases/${id}`);
}

export async function uploadKnowledgeBaseFile(
  kbId: string,
  file: File
): Promise<{ message: string; file: any }> {
  // Converte o arquivo para base64 (formato esperado pela Lambda)
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  const res = await apiClient.post(`/admin/knowledge-bases/${kbId}/files`, {
    fileName: file.name,
    fileContent: base64,
    contentType: file.type || 'application/octet-stream',
  });
  return res.data;
}

export async function deleteKnowledgeBaseFile(kbId: string, fileId: string): Promise<void> {
  await apiClient.delete(`/admin/knowledge-bases/${kbId}/files/${fileId}`);
}

export async function addKnowledgeBaseLink(
  kbId: string,
  url: string,
  autoRefreshIntervalHours?: number
): Promise<any> {
  const res = await apiClient.post(`/admin/knowledge-bases/${kbId}/links`, {
    url,
    autoRefreshIntervalHours,
  });
  return res.data;
}

export async function triggerRetrainKnowledgeBase(kbId: string): Promise<KnowledgeBase> {
  const res = await apiClient.post<KnowledgeBase>(`/admin/knowledge-bases/${kbId}/retrain`);
  return res.data;
}

export async function fetchAdminLogs(): Promise<Conversation[]> {
  const res = await apiClient.get<Conversation[]>('/admin/logs');
  return res.data;
}

export async function fetchAdminUsers(): Promise<UserPublic[]> {
  const res = await apiClient.get<UserPublic[]>('/admin/users');
  return res.data;
}
