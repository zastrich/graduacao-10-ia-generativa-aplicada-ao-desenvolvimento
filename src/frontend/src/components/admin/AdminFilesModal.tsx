import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  TextField,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  UploadFile as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Autorenew as RetrainIcon,
} from '@mui/icons-material';
import {
  uploadKnowledgeBaseFile,
  deleteKnowledgeBaseFile,
  addKnowledgeBaseLink,
  triggerRetrainKnowledgeBase,
} from '../../api/client';
import type { KnowledgeBase } from '../../types';

interface AdminFilesModalProps {
  open: boolean;
  onClose: () => void;
  knowledgeBase: KnowledgeBase | null;
  onRefresh: () => void;
}

export const AdminFilesModal: React.FC<AdminFilesModalProps> = ({
  open,
  onClose,
  knowledgeBase,
  onRefresh,
}) => {
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [addingLink, setAddingLink] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!knowledgeBase) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setMsg(null);

    try {
      await uploadKnowledgeBaseFile(knowledgeBase.id, files[0]);
      setMsg({ type: 'success', text: `Arquivo "${files[0].name}" enviado e indexado com sucesso!` });
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.message || 'Falha ao enviar arquivo.' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteKnowledgeBaseFile(knowledgeBase.id, fileId);
      setMsg({ type: 'success', text: 'Arquivo removido com sucesso.' });
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: 'Falha ao remover arquivo.' });
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl) return;
    setAddingLink(true);
    setMsg(null);

    try {
      await addKnowledgeBaseLink(knowledgeBase.id, linkUrl, 24);
      setMsg({ type: 'success', text: 'Link adicionado para crawling!' });
      setLinkUrl('');
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: 'Falha ao adicionar link.' });
    } finally {
      setAddingLink(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setMsg(null);

    try {
      await triggerRetrainKnowledgeBase(knowledgeBase.id);
      setMsg({ type: 'success', text: 'Retreinamento concluído com sucesso!' });
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: 'Falha ao disparar retreinamento.' });
    } finally {
      setRetraining(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: '20px', backgroundColor: '#111827' } } }}>
      <DialogTitle sx={{ fontWeight: 700, color: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Gerenciar Fontes & Retreino — {knowledgeBase.name}</span>
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          startIcon={retraining ? <CircularProgress size={16} color="inherit" /> : <RetrainIcon />}
          onClick={handleRetrain}
          disabled={retraining}
        >
          {retraining ? 'Treinando...' : 'Retreinar Base'}
        </Button>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {msg && (
          <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg(null)}>
            {msg.text}
          </Alert>
        )}

        {/* Upload de Arquivos */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#A78BFA', mb: 1 }}>
            1. Enviar Arquivos (PDF, TXT, XLSX)
          </Typography>

          <Button
            component="label"
            variant="contained"
            color="primary"
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
            disabled={uploading}
            sx={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)' }}
          >
            {uploading ? 'Processando...' : 'Selecionar Arquivo'}
            <input type="file" hidden accept=".pdf,.txt,.xlsx,.csv" onChange={handleFileUpload} />
          </Button>

          {/* Lista de Arquivos Existentes */}
          <List sx={{ mt: 1 }}>
            {(!knowledgeBase.files || knowledgeBase.files.length === 0) ? (
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', py: 1 }}>
                Nenhum arquivo enviado ainda.
              </Typography>
            ) : (
              knowledgeBase.files.map((file) => (
                <ListItem
                  key={file.id}
                  secondaryAction={
                    <IconButton edge="end" color="error" onClick={() => handleDeleteFile(file.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                  sx={{
                    borderRadius: '8px',
                    mb: 0.5,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: '#06B6D4' }}>
                    <FileIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={`${(file.size / 1024).toFixed(1)} KB • ${new Date(file.uploadedAt).toLocaleDateString()}`}
                    slotProps={{
                      primary: { sx: { fontSize: '0.85rem', color: '#F8FAFC' } },
                      secondary: { sx: { fontSize: '0.75rem', color: '#64748B' } },
                    }}
                  />
                </ListItem>
              ))
            )}
          </List>
        </Box>

        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.08)' }} />

        {/* Links de Crawl */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#67E8F9', mb: 1 }}>
            2. Adicionar Links Web para Coleta Automática (JSON)
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="https://exemplo.com/documentacao"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            <Button
              variant="contained"
              color="secondary"
              startIcon={<LinkIcon />}
              onClick={handleAddLink}
              disabled={addingLink || !linkUrl}
            >
              Adicionar
            </Button>
          </Box>

          <List sx={{ mt: 1 }}>
            {(!knowledgeBase.links || knowledgeBase.links.length === 0) ? (
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', py: 1 }}>
                Nenhum link configurado.
              </Typography>
            ) : (
              knowledgeBase.links.map((lnk) => (
                <ListItem key={lnk.id} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', mb: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36, color: '#A78BFA' }}>
                    <LinkIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={lnk.url}
                    secondary={`Status: ${lnk.status} ${lnk.lastFetchedAt ? `• Último fetch: ${new Date(lnk.lastFetchedAt).toLocaleString()}` : ''}`}
                    slotProps={{
                      primary: { sx: { fontSize: '0.85rem', color: '#F8FAFC' } },
                      secondary: { sx: { fontSize: '0.75rem', color: '#64748B' } },
                    }}
                  />
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
