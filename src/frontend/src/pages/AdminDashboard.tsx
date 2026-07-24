import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  History as HistoryIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fetchAdminKnowledgeBases, deleteKnowledgeBase } from '../api/client';
import type { KnowledgeBase } from '../types';
import { AdminKBModal } from '../components/admin/AdminKBModal';
import { AdminFilesModal } from '../components/admin/AdminFilesModal';
import { removeAdminToken, isAdminAuthenticated } from '../utils/uid';
import { Logout as LogoutIcon } from '@mui/icons-material';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [kbModalOpen, setKbModalOpen] = useState(false);
  const [editingKb, setEditingKb] = useState<KnowledgeBase | null>(null);

  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [selectedKbForFiles, setSelectedKbForFiles] = useState<KnowledgeBase | null>(null);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminKnowledgeBases();
      setKbs(data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        navigate('/admin/login');
      } else {
        setError('Falha ao carregar bases de conhecimento.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a base "${name}"?`)) {
      try {
        await deleteKnowledgeBase(id);
        loadData();
      } catch (err: any) {
        alert('Erro ao excluir base.');
      }
    }
  };

  const handleOpenFilesModal = (kb: KnowledgeBase) => {
    setSelectedKbForFiles(kb);
    setFilesModalOpen(true);
  };

  const totalFiles = kbs.reduce((sum, kb) => sum + (kb.fileCount || 0), 0);

  return (
    <Box sx={{ py: 2 }}>
      {/* Header com ações principais */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#F8FAFC' }}>
            Painel de Administração
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>
            Gerencie bases de conhecimento, upload de arquivos, crawlers e guardrails do Bedrock.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<HistoryIcon />}
            onClick={() => navigate('/admin/logs')}
          >
            Logs de Conversas
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingKb(null);
              setKbModalOpen(true);
            }}
            sx={{ background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)' }}
          >
            Nova Base
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={() => {
              removeAdminToken();
              navigate('/admin/login');
            }}
          >
            Sair
          </Button>
        </Box>
      </Box>

      {/* Cards de Métricas */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        <Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(17,24,39,0.7)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                BASES ATIVAS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#7C3AED', mt: 0.5 }}>
                {kbs.length}
              </Typography>
            </Box>
            <StorageIcon sx={{ fontSize: 40, color: 'rgba(124, 58, 237, 0.4)' }} />
          </Box>
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(17,24,39,0.7)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                FONTES & ARQUIVOS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#06B6D4', mt: 0.5 }}>
                {totalFiles}
              </Typography>
            </Box>
            <FolderIcon sx={{ fontSize: 40, color: 'rgba(6, 182, 212, 0.4)' }} />
          </Box>
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(17,24,39,0.7)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                MODELO DE IA
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#A78BFA', mt: 0.5 }}>
                Gemma 3 4b-it
              </Typography>
            </Box>
            <Chip label="AWS Bedrock" size="small" color="primary" sx={{ fontWeight: 600 }} />
          </Box>
        </Paper>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Tabela de Bases */}
      <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(17,24,39,0.7)' }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <TableRow>
              <TableCell sx={{ color: '#94A3B8', fontWeight: 700 }}>NOME DA BASE</TableCell>
              <TableCell sx={{ color: '#94A3B8', fontWeight: 700 }}>SLUG / URL</TableCell>
              <TableCell sx={{ color: '#94A3B8', fontWeight: 700 }}>FONTES</TableCell>
              <TableCell sx={{ color: '#94A3B8', fontWeight: 700 }}>BEDROCK TEMP</TableCell>
              <TableCell sx={{ color: '#94A3B8', fontWeight: 700 }}>ÚLTIMO TREINO</TableCell>
              <TableCell align="right" sx={{ color: '#94A3B8', fontWeight: 700 }}>AÇÕES</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Skeleton variant="text" height={40} />
                </TableCell>
              </TableRow>
            ) : kbs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: '#64748B', py: 4 }}>
                  Nenhuma base de conhecimento cadastrada. Clique em "Nova Base" acima.
                </TableCell>
              </TableRow>
            ) : (
              kbs.map((kb) => (
                <TableRow key={kb.id} hover sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' } }}>
                  <TableCell sx={{ color: '#F8FAFC', fontWeight: 600 }}>{kb.name}</TableCell>
                  <TableCell sx={{ color: '#06B6D4' }}>/{kb.slug}/chat</TableCell>
                  <TableCell sx={{ color: '#CBD5E1' }}>
                    <Button
                      size="small"
                      startIcon={<FolderIcon fontSize="small" />}
                      onClick={() => handleOpenFilesModal(kb)}
                      sx={{ textTransform: 'none', color: '#67E8F9' }}
                    >
                      {kb.fileCount || 0} Arquivo(s)
                    </Button>
                  </TableCell>
                  <TableCell sx={{ color: '#CBD5E1' }}>
                    {kb.bedrockConfig?.temperature ?? 0.7}
                  </TableCell>
                  <TableCell sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                    {kb.lastTrainedAt ? new Date(kb.lastTrainedAt).toLocaleDateString() : 'Pendente'}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Gerenciar Arquivos & Retreinamento">
                      <IconButton color="secondary" size="small" onClick={() => handleOpenFilesModal(kb)}>
                        <FolderIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Editar Dados & Guardrails">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => {
                          setEditingKb(kb);
                          setKbModalOpen(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Excluir Base">
                      <IconButton color="error" size="small" onClick={() => handleDelete(kb.id, kb.name)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modals */}
      <AdminKBModal
        open={kbModalOpen}
        onClose={() => setKbModalOpen(false)}
        onSuccess={loadData}
        editingKb={editingKb}
      />

      <AdminFilesModal
        open={filesModalOpen}
        onClose={() => setFilesModalOpen(false)}
        knowledgeBase={selectedKbForFiles}
        onRefresh={loadData}
      />
    </Box>
  );
};
