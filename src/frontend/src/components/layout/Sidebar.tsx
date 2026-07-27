import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Skeleton,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Add as AddIcon,
  Psychology as KnowledgeIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from '@tanstack/react-router';
import { fetchUserConversations, fetchPublicKnowledgeBases, deleteConversation } from '../../api/client';
import { isAdminAuthenticated, removeAdminToken } from '../../utils/uid';
import type { Conversation, KnowledgeBase } from '../../types';

export const Sidebar: React.FC = () => {
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
      setConversations(Array.isArray(convs) ? convs : []);
      setKnowledgeBases(Array.isArray(kbs) ? kbs : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeConvId]);

  const handleNewChat = (kbSlug?: string) => {
    const targetSlug = kbSlug || slug || knowledgeBases[0]?.slug;
    if (targetSlug) {
      navigate({ to: '/$slug/chat', params: { slug: targetSlug } });
    } else {
      navigate({ to: '/' });
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Excluir esta conversa?')) return;
    try {
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) {
        navigate({ to: '/' });
      }
    } catch (err) {
      console.error('Erro ao excluir conversa:', err);
    }
  };

  const isAdmin = isAdminAuthenticated();

  return (
    <Box
      sx={{
        width: 260,
        minWidth: 260,
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        overflowY: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, pt: 2.5 }}>
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

      {/* Content - scrollable */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1, py: 1 }}>
        <Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: 'block', color: '#64748B', fontWeight: 600 }}>
          HISTORICO RECENTE
        </Typography>

        {loading ? (
          <Box sx={{ px: 1.5, py: 1 }}>
            <Skeleton variant="text" width="90%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            <Skeleton variant="text" width="70%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
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
                  }}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    backgroundColor: isActive ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                    borderLeft: isActive ? '3px solid #7C3AED' : '3px solid transparent',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
                    '&:hover .delete-btn': { opacity: 1 },
                    pr: 1,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: isActive ? '#A78BFA' : '#64748B' }}>
                    <ChatIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={conv.title || 'Conversa sem titulo'}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: '0.8rem',
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? '#F8FAFC' : '#CBD5E1',
                        },
                        noWrap: true,
                      },
                    }}
                  />
                  <Box
                    className="delete-btn"
                    component="span"
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    sx={{ opacity: 0, cursor: 'pointer', color: '#EF4444', display: 'flex', transition: 'opacity 0.2s' }}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </Box>
                </ListItemButton>
              );
            })}
          </List>
        )}

        <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.06)' }} />

        <Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: 'block', color: '#64748B', fontWeight: 600 }}>
          BASES DISPONIVEIS
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
                  primary: { sx: { fontSize: '0.8rem', color: '#E2E8F0' }, noWrap: true },
                  secondary: { sx: { fontSize: '0.7rem', color: '#64748B' } },
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* Footer - admin + version */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)', p: 1.5 }}>
        <ListItemButton
          onClick={() => navigate({ to: isAdmin ? '/admin' : '/admin/login' })}
          sx={{ borderRadius: 2, mb: 0.5, py: 0.8 }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: '#A78BFA' }}>
            <AdminIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Area Admin"
            slotProps={{ primary: { sx: { fontSize: '0.8rem', color: '#CBD5E1' } } }}
          />
        </ListItemButton>

        {isAdmin && (
          <ListItemButton
            onClick={() => { removeAdminToken(); navigate({ to: '/' }); }}
            sx={{ borderRadius: 2, mb: 0.5, py: 0.8 }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: '#EF4444' }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Sair (Admin)"
              slotProps={{ primary: { sx: { fontSize: '0.8rem', color: '#94A3B8' } } }}
            />
          </ListItemButton>
        )}

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#475569', mt: 1 }}>
          Copiloto v1.0
        </Typography>
      </Box>
    </Box>
  );
};
