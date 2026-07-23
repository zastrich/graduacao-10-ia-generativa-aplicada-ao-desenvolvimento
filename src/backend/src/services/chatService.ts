/**
 * Chat Service — gerencia conversas e integra com Bedrock para inferência.
 */

import { v4 as uuid } from 'uuid';
import { config } from '../utils/config';
import { dynamoService } from './dynamoService';
import { bedrockService } from './bedrockService';
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
    const recentHistory = history.slice(-10) as Message[];

    // Monta contexto RAG da base de conhecimento
    const ragContext = await knowledgeBaseService.buildContext(kb.id, request.message);

    // Monta prompt com histórico
    let fullPrompt = '';
    if (recentHistory.length > 1) {
      fullPrompt += 'Histórico da conversa:\n';
      for (const msg of recentHistory.slice(0, -1)) { // exclui a última (que é a atual)
        fullPrompt += `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}\n`;
      }
      fullPrompt += '\n';
    }
    fullPrompt += `Pergunta atual: ${request.message}`;

    // Invoca Bedrock
    const bedrockResponse = await bedrockService.invoke(fullPrompt, ragContext, kb.config);

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
