/**
 * Chat Service — gerencia conversas e integra com Bedrock para inferência.
 */

import { v4 as uuid } from 'uuid';
import { config } from '../utils/config';
import { dynamoService } from './dynamoService';
import { bedrockService, ChatMessage } from './bedrockService';
import { knowledgeBaseService } from './knowledgeBaseService';
import { Conversation, Message, ChatRequest, ChatResponse } from '../utils/types';

const CONVERSATIONS_TABLE = config.tables.conversations;
const MESSAGES_TABLE = config.tables.messages;

export const chatService = {
  async sendMessage(slug: string, request: ChatRequest): Promise<ChatResponse> {
    // Busca a base de conhecimento pelo slug
    const kb = await knowledgeBaseService.getBySlug(slug);

    let conversationId = request.conversationId;
    let conversation: Conversation;

    if (conversationId) {
      // Continuar conversa existente
      const existing = await dynamoService.get(CONVERSATIONS_TABLE, { id: conversationId });
      if (!existing) throw { statusCode: 404, message: 'Conversa não encontrada' };
      conversation = existing as Conversation;
    } else {
      // Criar nova conversa
      conversationId = uuid();
      conversation = {
        id: conversationId,
        userUid: request.userUid,
        knowledgeBaseId: kb.id,
        knowledgeBaseSlug: kb.slug,
        title: request.message.substring(0, 100),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await dynamoService.put(CONVERSATIONS_TABLE, conversation);
    }

    // Salva mensagem do usuário
    const userMessage: Message = {
      conversationId,
      createdAt: new Date().toISOString(),
      role: 'user',
      content: request.message,
    };
    await dynamoService.put(MESSAGES_TABLE, userMessage);

    // Busca histórico recente da conversa (últimas 10 mensagens para contexto)
    const history = await dynamoService.query(MESSAGES_TABLE, { conversationId });
    const recentHistory = (history as Message[])
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-10);

    // Monta contexto RAG da base de conhecimento
    const ragContext = await knowledgeBaseService.buildContext(kb.id, request.message);

    // Monta histórico no formato de messages (exclui a mensagem atual que acabou de ser salva)
    const chatHistory: ChatMessage[] = recentHistory
      .filter((msg) => msg.createdAt !== userMessage.createdAt) // exclui a msg atual
      .map((msg) => ({ role: msg.role, content: msg.content }));

    // Invoca Bedrock com histórico completo
    const bedrockResponse = await bedrockService.invoke(request.message, ragContext, kb.config, chatHistory);

    // Salva resposta do assistente
    const assistantMessage: Message = {
      conversationId,
      createdAt: new Date().toISOString(),
      role: 'assistant',
      content: bedrockResponse.content,
    };
    await dynamoService.put(MESSAGES_TABLE, assistantMessage);

    // Atualiza timestamp da conversa
    await dynamoService.update(CONVERSATIONS_TABLE, { id: conversationId }, {
      updatedAt: new Date().toISOString(),
    });

    return {
      conversationId,
      message: assistantMessage,
    };
  },

  async getConversationsByUser(userUid: string): Promise<Conversation[]> {
    const conversations = await dynamoService.query(CONVERSATIONS_TABLE, { userUid }, 'userUid-index');
    return (conversations as Conversation[]).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getConversation(conversationId: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    const conversation = await dynamoService.get(CONVERSATIONS_TABLE, { id: conversationId });
    if (!conversation) throw { statusCode: 404, message: 'Conversa não encontrada' };

    const messages = await dynamoService.query(MESSAGES_TABLE, { conversationId });
    return {
      conversation: conversation as Conversation,
      messages: (messages as Message[]).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    };
  },

  async getLogsByKnowledgeBase(knowledgeBaseId: string): Promise<Conversation[]> {
    const conversations = await dynamoService.query(CONVERSATIONS_TABLE, { knowledgeBaseId }, 'knowledgeBase-index');
    return (conversations as Conversation[]).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getAllConversations(): Promise<Conversation[]> {
    const conversations = await dynamoService.scan(CONVERSATIONS_TABLE);
    return (conversations as Conversation[]).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },
};
