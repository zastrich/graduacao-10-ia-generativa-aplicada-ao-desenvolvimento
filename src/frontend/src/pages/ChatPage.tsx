import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatInput } from '../components/chat/ChatInput';
import {
  fetchPublicKnowledgeBaseBySlug,
  fetchConversationDetails,
  sendChatMessage,
} from '../api/client';
import type { KnowledgeBase, Message } from '../types';

export const ChatPage: React.FC = () => {
  const { slug, uuid: convId } = useParams<{ slug: string; uuid?: string }>();
  const navigate = useNavigate();

  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | undefined>(convId);
  const [loadingKb, setLoadingKb] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Carrega a base de conhecimento
  useEffect(() => {
    if (!slug) return;
    setLoadingKb(true);
    setError(null);
    fetchPublicKnowledgeBaseBySlug(slug)
      .then((data) => {
        setKb(data);
      })
      .catch((err) => {
        console.error(err);
        setError('Base de conhecimento não encontrada ou inacessível.');
      })
      .finally(() => setLoadingKb(false));
  }, [slug]);

  // Carrega histórico de conversa se convId estiver na URL
  useEffect(() => {
    setActiveConvId(convId);
    if (convId) {
      setLoadingMessages(true);
      fetchConversationDetails(convId)
        .then((conv) => {
          setMessages(conv.messages || []);
        })
        .catch((err) => {
          console.error(err);
          // Se falhar a conversa, limpa para nova conversa
          setMessages([]);
        })
        .finally(() => setLoadingMessages(false));
    } else {
      setMessages([]);
    }
  }, [convId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!slug || sending) return;

    // Adiciona mensagem do usuário optimistamente
    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await sendChatMessage(slug, text, activeConvId);

      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        content: res.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Se foi iniciada uma nova conversa, atualiza a URL sem recarregar a página
      if (!activeConvId && res.conversationId) {
        setActiveConvId(res.conversationId);
        navigate(`/${slug}/chat/${res.conversationId}`, { replace: true });
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        content: 'Desculpe, ocorreu um erro ao consultar o Bedrock. Por favor, tente novamente.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  if (loadingKb) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !kb) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Base de conhecimento não encontrada.'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>
          Voltar para Home
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Informações da Base */}
      <ChatHeader knowledgeBase={kb} />

      {/* Áreas de Mensagens do Chat */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          p: 3,
          mb: 2,
          borderRadius: '16px',
          backgroundColor: 'rgba(11, 15, 25, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 && !loadingMessages ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              color: '#64748B',
            }}
          >
            <Typography variant="h6" sx={{ color: '#94A3B8', mb: 1 }}>
              Como posso ajudar você hoje?
            </Typography>
            <Typography variant="body2" sx={{ maxWidth: 450 }}>
              Esta conversa está configurada para consultar exclusivamente a base <strong>{kb.name}</strong>. Faça perguntas sobre planilhas, documentos ou conteúdos indexados.
            </Typography>
          </Box>
        ) : (
          messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)
        )}

        {sending && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 1, px: 2 }}>
            <CircularProgress size={18} color="secondary" />
            <Typography variant="caption" sx={{ color: '#06B6D4', fontWeight: 600 }}>
              Bedrock (Gemma 3) processando resposta...
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Paper>

      {/* Campo de Entrada de Mensagem */}
      <ChatInput onSend={handleSendMessage} loading={sending} />
    </Box>
  );
};
