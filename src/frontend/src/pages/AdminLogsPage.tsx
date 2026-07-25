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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useNavigate } from '@tanstack/react-router';
import { fetchAdminLogs } from '../api/client';
import type { Conversation } from '../types';

export const AdminLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminLogs()
      .then((data) => setLogs(data))
      .catch((err) => {
        console.error(err);
        setError('Falha ao carregar logs de conversas. Certifique-se de estar autenticado.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate({ to: '/admin' })} color="inherit">
          Voltar
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#F8FAFC' }}>
          Logs de Conversas Realizadas
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.05)' }} />
      ) : logs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'rgba(17,24,39,0.5)', borderRadius: '16px' }}>
          <Typography variant="body1" sx={{ color: '#94A3B8' }}>
            Nenhum log de conversa registrado até o momento.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {logs.map((conv) => (
            <Accordion
              key={conv.id}
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
                  <Chip
                    size="small"
                    icon={<ChatIcon sx={{ fontSize: 14 }} />}
                    label={`${conv.messages?.length || 0} msgs`}
                    color="primary"
                    sx={{ height: 24 }}
                  />
                  <Typography variant="subtitle2" sx={{ color: '#F8FAFC', fontWeight: 600 }}>
                    {conv.title || 'Conversa sem título'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', ml: 'auto', mr: 2 }}>
                    User UID: {conv.userUid} • {new Date(conv.updatedAt || conv.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', pt: 2 }}>
                {conv.messages?.map((msg) => (
                  <Box
                    key={msg.id}
                    sx={{
                      mb: 1.5,
                      p: 1.5,
                      borderRadius: '8px',
                      backgroundColor: msg.sender === 'user' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      borderLeft: msg.sender === 'user' ? '3px solid #7C3AED' : '3px solid #06B6D4',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: msg.sender === 'user' ? '#A78BFA' : '#67E8F9', display: 'block', mb: 0.5 }}>
                      {msg.sender === 'user' ? 'USUÁRIO' : 'RESPOSTA BEDROCK'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#E2E8F0', whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </Typography>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
};
