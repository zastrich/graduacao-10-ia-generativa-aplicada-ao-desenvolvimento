import axios from 'axios';
import { getAdminToken, getUserUid } from '../utils/uid';
import type {
  KnowledgeBase,
  Conversation,
  AuthResponse,
  UserPublic,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT se existir
apiClient.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Public Endpoints ---
export async function fetchPublicKnowledgeBases(): Promise<KnowledgeBase[]> {
  const res = await apiClient.get<KnowledgeBase[]>('/knowledge-bases');
  return res.data;
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
  const res = await apiClient.post<{ response: string; conversationId: string; title?: string }>(
    `/chat/${slug}`,
    {
      message,
      conversationId,
      userUid,
    }
  );
  return res.data;
}

export async function fetchUserConversations(): Promise<Conversation[]> {
  const userUid = getUserUid();
  const res = await apiClient.get<Conversation[]>(`/conversations/${userUid}`);
  return res.data;
}

export async function fetchConversationDetails(conversationId: string): Promise<Conversation> {
  const userUid = getUserUid();
  const res = await apiClient.get<Conversation>(`/conversations/${userUid}/${conversationId}`);
  return res.data;
}

// --- Admin Auth Endpoints ---
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
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post(`/admin/knowledge-bases/${kbId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
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
