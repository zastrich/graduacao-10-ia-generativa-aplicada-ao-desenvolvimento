import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  IconButton,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  Psychology as KnowledgeIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from '@tanstack/react-router';
import { fetchUserConversations, fetchPublicKnowledgeBases } from '../../api/client';
import type { Conversation, KnowledgeBase } from '../../types';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'persistent' | 'temporary';
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose, variant = 'temporary' }) => {
  const navigate = useNavigate();
  const { slug, uuid: activeConvId } = useParams({ strict: false }) as { slug?: string; uuid?: string };

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [convs, kbs] = await Promise.all([
        fetchUserConversations().catch(() => []),
        fetchPublicKnowledgeBases().catch(() => []),
      ]);
      setConversations(convs);
      setKnowledgeBases(kbs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, activeConvId]);

  const handleNewChat = (kbSlug?: string) => {
    const targetSlug = kbSlug || slug || knowledgeBases[0]?.slug;
    if (targetSlug) {
      navigate({ to: '/$slug/chat', params: { slug: targetSlug } });
    } else {
      navigate({ to: '/' });
    }
    if (variant === 'temporary') onClose();
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant={variant}
      slotProps={{
        paper: {
          sx: {
            width: 280,
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
          },
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: 1 }}>
          Navegação
        </Typography>
        {variant === 'temporary' && (
          <IconButton onClick={onClose} size="small" sx={{ color: '#94A3B8' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      <Box sx={{ px: 2, mb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleNewChat()}
          sx={{
            py: 1.2,
            background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
          }}
        >
          Nova Conversa
        </Button>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* Histórico de Conversas */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1, py: 1 }}>
        <Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: 'block', color: '#64748B', fontWeight: 600 }}>
          HISTÓRICO RECENTE
        </Typography>

        {loading ? (
          <Box sx={{ px: 1.5, py: 1 }}>
            <Skeleton variant="text" width="90%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            <Skeleton variant="text" width="70%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            <Skeleton variant="text" width="80%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
          </Box>
        ) : conversations.length === 0 ? (
          <Typography variant="caption" sx={{ px: 1.5, py: 1, display: 'block', color: '#475569', fontStyle: 'italic' }}>
            Nenhuma conversa iniciada ainda.
          </Typography>
        ) : (
          <List disablePadding>
            {conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              const kb = knowledgeBases.find((k) => k.id === conv.knowledgeBaseId);
              const kbSlug = kb ? kb.slug : slug || 'general';

              return (
                <ListItemButton
                  key={conv.id}
                  selected={isActive}
                  onClick={() => {
                    navigate({ to: '/$slug/chat/$uuid', params: { slug: kbSlug, uuid: conv.id } });
                    if (variant === 'temporary') onClose();
                  }}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    backgroundColor: isActive ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                    borderLeft: isActive ? '3px solid #7C3AED' : '3px solid transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: isActive ? '#A78BFA' : '#64748B' }}>
                    <ChatIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={conv.title || 'Conversa sem título'}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: '0.85rem',
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? '#F8FAFC' : '#CBD5E1',
                        },
                        noWrap: true,
                      },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}

        <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* Bases de Conhecimento */}
        <Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: 'block', color: '#64748B', fontWeight: 600 }}>
          BASES DISPONÍVEIS
        </Typography>

        <List disablePadding>
          {knowledgeBases.map((kb) => (
            <ListItemButton
              key={kb.id}
              onClick={() => handleNewChat(kb.slug)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: '#06B6D4' }}>
                <KnowledgeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={kb.name}
                secondary={`${kb.fileCount} fonte(s)`}
                slotProps={{
                  primary: { sx: { fontSize: '0.85rem', color: '#E2E8F0' }, noWrap: true },
                  secondary: { sx: { fontSize: '0.7rem', color: '#64748B' } },
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#475569' }}>
          Copiloto v1.0 • Local Mock
        </Typography>
        <Chip label="ONLINE" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem' }} />
      </Box>
    </Drawer>
  );
};
