import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  Alert,
  TextField,
  MenuItem,
  Pagination,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useNavigate } from '@tanstack/react-router';
import { fetchAdminLogs, fetchConversationDetails, fetchAdminKnowledgeBases } from '../api/client';
import type { Conversation, KnowledgeBase, Message } from '../types';

const PAGE_SIZE = 10;

export const AdminLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [allLogs, setAllLogs] = useState<Conversation[]>([]);
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterSlug, setFilterSlug] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);

  // Lazy-loaded messages per conversation
  const [loadedMessages, setLoadedMessages] = useState<Record<string, Message[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([
      fetchAdminLogs().catch(() => []),
      fetchAdminKnowledgeBases().catch(() => []),
    ]).then(([logs, bases]) => {
      setAllLogs(Array.isArray(logs) ? logs : []);
      setKbs(Array.isArray(bases) ? bases : []);
    }).catch((err) => {
      console.error(err);
      setError('Falha ao carregar logs de conversas.');
    }).finally(() => setLoading(false));
  }, []);

  // Apply filters
  const filteredLogs = allLogs.filter((conv) => {
    if (filterSlug && conv.knowledgeBaseId) {
      const kb = kbs.find((k) => k.id === conv.knowledgeBaseId);
      if (kb && kb.slug !== filterSlug) return false;
      if (!kb) return false;
    }
    if (filterDateFrom) {
      const convDate = new Date(conv.updatedAt || conv.createdAt).toISOString().split('T')[0];
      if (convDate < filterDateFrom) return false;
    }
    if (filterDateTo) {
      const convDate = new Date(conv.updatedAt || conv.createdAt).toISOString().split('T')[0];
      if (convDate > filterDateTo) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAccordionChange = async (convId: string, expanded: boolean) => {
    if (expanded && !loadedMessages[convId]) {
      setLoadingMessages((prev) => ({ ...prev, [convId]: true }));
      try {
        const details = await fetchConversationDetails(convId);
        setLoadedMessages((prev) => ({ ...prev, [convId]: details.messages || [] }));
      } catch (err) {
        console.error('Erro ao carregar mensagens:', err);
        setLoadedMessages((prev) => ({ ...prev, [convId]: [] }));
      } finally {
        setLoadingMessages((prev) => ({ ...prev, [convId]: false }));
      }
    }
  };

  const getKbName = (conv: Conversation) => {
    const kb = kbs.find((k) => k.id === conv.knowledgeBaseId);
    return kb ? kb.name : conv.knowledgeBaseId || '-';
  };

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate({ to: '/admin' })} color="inherit">
          Voltar
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#F8FAFC' }}>
          Logs de Conversas
        </Typography>
        <Chip label={`${filteredLogs.length} conversas`} size="small" sx={{ ml: 'auto' }} />
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', backgroundColor: 'rgba(17,24,39,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            select
            size="small"
            label="Base de Conhecimento"
            value={filterSlug}
            onChange={(e) => { setFilterSlug(e.target.value); setPage(1); }}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Todas</MenuItem>
            {kbs.map((kb) => (
              <MenuItem key={kb.id} value={kb.slug}>{kb.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            type="date"
            size="small"
            label="Data inicio"
            value={filterDateFrom}
            onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            type="date"
            size="small"
            label="Data fim"
            value={filterDateTo}
            onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          {(filterSlug || filterDateFrom || filterDateTo) && (
            <Button size="small" onClick={() => { setFilterSlug(''); setFilterDateFrom(''); setFilterDateTo(''); setPage(1); }}>
              Limpar filtros
            </Button>
          )}
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.05)' }} />
      ) : paginatedLogs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'rgba(17,24,39,0.5)', borderRadius: '16px' }}>
          <Typography variant="body1" sx={{ color: '#94A3B8' }}>
            Nenhum log encontrado com os filtros atuais.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {paginatedLogs.map((conv) => (
            <Accordion
              key={conv.id}
              onChange={(_, expanded) => handleAccordionChange(conv.id, expanded)}
              sx={{
                mb: 1.5,
                borderRadius: '12px !important',
                backgroundColor: 'rgba(17, 24, 39, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundImage: 'none',
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94A3B8' }} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', flexWrap: 'wrap' }}>
                  <ChatIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontWeight: 600, flex: 1 }}>
                    {conv.title || 'Conversa sem titulo'}
                  </Typography>
                  <Chip size="small" label={getKbName(conv)} sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'rgba(6,182,212,0.15)', color: '#67E8F9' }} />
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    {new Date(conv.updatedAt || conv.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', pt: 2 }}>
                {loadingMessages[conv.id] ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (loadedMessages[conv.id] || []).length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                    Nenhuma mensagem registrada.
                  </Typography>
                ) : (
                  (loadedMessages[conv.id] || []).map((msg, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        mb: 1.5,
                        p: 1.5,
                        borderRadius: '8px',
                        backgroundColor: msg.sender === 'user' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        borderLeft: msg.sender === 'user' ? '3px solid #7C3AED' : '3px solid #06B6D4',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, color: msg.sender === 'user' ? '#A78BFA' : '#67E8F9', display: 'block', mb: 0.5 }}>
                        {msg.sender === 'user' ? 'USUARIO' : 'RESPOSTA BEDROCK'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#E2E8F0', whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </Typography>
                    </Box>
                  ))
                )}
              </AccordionDetails>
            </Accordion>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, v) => setPage(v)}
                color="primary"
                sx={{ '& .MuiPaginationItem-root': { color: '#CBD5E1' } }}
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
