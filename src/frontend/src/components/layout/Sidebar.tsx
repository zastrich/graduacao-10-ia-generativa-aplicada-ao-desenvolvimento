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
  Drawer,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Add as AddIcon,
  Psychology as KnowledgeIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  Delete as DeleteIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from '@tanstack/react-router';
import { fetchUserConversations, fetchPublicKnowledgeBases, deleteConversation } from '../../api/client';
import { isAdminAuthenticated, removeAdminToken } from '../../utils/uid';
import type { Conversation, KnowledgeBase } from '../../types';

interface SidebarProps {
  mobile?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const SIDEBAR_WIDTH = 260;

export const Sidebar: React.FC<SidebarProps> = ({ mobile = false, mobileOpen = false, onMobileClose }) => {
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

  const closeMobile = () => { if (mobile && onMobileClose) onMobileClose(); };

  const handleNewChat = (kbSlug?: string) => {
    const targetSlug = kbSlug || slug || knowledgeBases[0]?.slug;
    if (targetSlug) {
      navigate({ to: '/$slug/chat', params: { slug: targetSlug } });
    } else {
      navigate({ to: '/' });
    }
    closeMobile();
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

  const content = (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        borderRight: mobile ? 'none' : '1px solid rgba(255,255,255,0.06)',
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
            py: 1,
            background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
            fontSize: '0.85rem',
          }}
        >
          Nova Conversa
        </Button>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* Content - scrollable */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1, py: 1 }}>
        <Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: 'block', color: '#64748B', fontWeight: 600, fontSize: '0.65rem' }}>
          HISTORICO RECENTE
        </Typography>

        {loading ? (
          <Box sx={{ px: 1.5, py: 1 }}>
            <Skeleton variant="text" width="90%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            <Skeleton variant="text" width="70%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
          </Box>
        ) : conversations.length === 0 ? (
          <Typography variant="caption" sx={{ px: 1.5, py: 1, display: 'block', color: '#475569', fontStyle: 'italic' }}>
            Nenhuma conversa ainda.
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
                    closeMobile();
                  }}
                  sx={{
                    borderRadius: 2,
                    mb: 0.3,
                    py: 0.6,
                    backgroundColor: isActive ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                    borderLeft: isActive ? '3px solid #7C3AED' : '3px solid transparent',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
                    '&:hover .delete-btn': { opacity: 1 },
                    pr: 1,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 28, color: isActive ? '#A78BFA' : '#64748B' }}>
                    <ChatIcon sx={{ fontSize: 16 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={conv.title || 'Conversa sem titulo'}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: '0.75rem',
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
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </Box>
                </ListItemButton>
              );
            })}
          </List>
        )}

        <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.06)' }} />

        <Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: 'block', color: '#64748B', fontWeight: 600, fontSize: '0.65rem' }}>
          BASES DISPONIVEIS
        </Typography>

        <List disablePadding>
          <ListItemButton
            onClick={() => { navigate({ to: '/' }); closeMobile(); }}
            sx={{ borderRadius: 2, mb: 0.3, py: 0.6, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.04)' } }}
          >
            <ListItemIcon sx={{ minWidth: 28, color: '#94A3B8' }}>
              <HomeIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText
              primary="Todas as bases"
              slotProps={{ primary: { sx: { fontSize: '0.75rem', color: '#CBD5E1' } } }}
            />
          </ListItemButton>

          {knowledgeBases.map((kb) => (
            <ListItemButton
              key={kb.id}
              onClick={() => handleNewChat(kb.slug)}
              sx={{ borderRadius: 2, mb: 0.3, py: 0.6, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.04)' } }}
            >
              <ListItemIcon sx={{ minWidth: 28, color: '#06B6D4' }}>
                <KnowledgeIcon sx={{ fontSize: 16 }} />
              </ListItemIcon>
              <ListItemText
                primary={kb.name}
                secondary={`${kb.fileCount} fonte(s)`}
                slotProps={{
                  primary: { sx: { fontSize: '0.75rem', color: '#E2E8F0' }, noWrap: true },
                  secondary: { sx: { fontSize: '0.65rem', color: '#64748B' } },
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)', p: 1.5 }}>
        <ListItemButton
          onClick={() => { navigate({ to: isAdmin ? '/admin' : '/admin/login' }); closeMobile(); }}
          sx={{ borderRadius: 2, mb: 0.3, py: 0.6 }}
        >
          <ListItemIcon sx={{ minWidth: 28, color: '#A78BFA' }}>
            <AdminIcon sx={{ fontSize: 16 }} />
          </ListItemIcon>
          <ListItemText
            primary="Area Admin"
            slotProps={{ primary: { sx: { fontSize: '0.75rem', color: '#CBD5E1' } } }}
          />
        </ListItemButton>

        {isAdmin && (
          <ListItemButton
            onClick={() => { removeAdminToken(); navigate({ to: '/' }); closeMobile(); }}
            sx={{ borderRadius: 2, mb: 0.3, py: 0.6 }}
          >
            <ListItemIcon sx={{ minWidth: 28, color: '#EF4444' }}>
              <LogoutIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText
              primary="Sair (Admin)"
              slotProps={{ primary: { sx: { fontSize: '0.75rem', color: '#94A3B8' } } }}
            />
          </ListItemButton>
        )}

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#475569', mt: 0.5, fontSize: '0.65rem' }}>
          Copiloto v1.0
        </Typography>
      </Box>
    </Box>
  );

  if (mobile) {
    return (
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={onMobileClose}
        slotProps={{
          paper: { sx: { width: SIDEBAR_WIDTH, backgroundColor: '#0F172A' } },
        }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Box sx={{ width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH, height: '100vh', position: 'sticky', top: 0 }}>
      {content}
    </Box>
  );
};
