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
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  UploadFile as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Autorenew as RetrainIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Replay as RetryIcon,
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

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

interface FileUploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  errorMessage?: string;
}

export const AdminFilesModal: React.FC<AdminFilesModalProps> = ({
  open,
  onClose,
  knowledgeBase,
  onRefresh,
}) => {
  const [uploadQueue, setUploadQueue] = useState<FileUploadItem[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [addingLink, setAddingLink] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!knowledgeBase) return null;

  const uploadSingleFile = async (item: FileUploadItem, kbId: string) => {
    setUploadQueue((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading' as UploadStatus } : f))
    );

    try {
      await uploadKnowledgeBaseFile(kbId, item.file);
      setUploadQueue((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'success' as UploadStatus } : f))
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Falha ao enviar arquivo.';
      setUploadQueue((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: 'error' as UploadStatus, errorMessage } : f
        )
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setMsg(null);

    // Cria items na fila para cada arquivo selecionado
    const newItems: FileUploadItem[] = Array.from(files).map((file, i) => ({
      id: `${Date.now()}-${i}-${file.name}`,
      file,
      status: 'pending' as UploadStatus,
    }));

    setUploadQueue((prev) => [...prev, ...newItems]);

    // Envia em batches de 3 para evitar throttling no S3/Lambda
    const BATCH_SIZE = 3;
    for (let i = 0; i < newItems.length; i += BATCH_SIZE) {
      const batch = newItems.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map((item) => uploadSingleFile(item, knowledgeBase.id))
      );
    }

    onRefresh();
    e.target.value = '';
  };

  const handleRetry = async (item: FileUploadItem) => {
    await uploadSingleFile(item, knowledgeBase.id);
    onRefresh();
  };

  const handleClearCompleted = () => {
    setUploadQueue((prev) => prev.filter((f) => f.status !== 'success'));
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
      setMsg({ type: 'success', text: 'Retreinamento concluido com sucesso!' });
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: 'Falha ao disparar retreinamento.' });
    } finally {
      setRetraining(false);
    }
  };

  const hasUploading = uploadQueue.some((f) => f.status === 'uploading');
  const hasCompleted = uploadQueue.some((f) => f.status === 'success');

  const getStatusChip = (status: UploadStatus, errorMessage?: string) => {
    switch (status) {
      case 'pending':
        return <Chip size="small" label="Aguardando" sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#94A3B8', height: 22, fontSize: '0.7rem' }} />;
      case 'uploading':
        return <Chip size="small" icon={<CircularProgress size={12} />} label="Enviando" sx={{ bgcolor: 'rgba(99,102,241,0.2)', color: '#818CF8', height: 22, fontSize: '0.7rem' }} />;
      case 'success':
        return <Chip size="small" icon={<SuccessIcon sx={{ fontSize: 14 }} />} label="Enviado" color="success" sx={{ height: 22, fontSize: '0.7rem' }} />;
      case 'error':
        return <Chip size="small" icon={<ErrorIcon sx={{ fontSize: 14 }} />} label={errorMessage || 'Erro'} color="error" sx={{ height: 22, fontSize: '0.7rem', maxWidth: 200 }} />;
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
            1. Enviar Arquivos (PDF, TXT, XLSX) — selecione um ou mais arquivos
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              component="label"
              variant="contained"
              color="primary"
              startIcon={hasUploading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
              disabled={hasUploading}
              sx={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)' }}
            >
              {hasUploading ? 'Enviando...' : 'Selecionar Arquivos'}
              <input type="file" hidden multiple accept=".pdf,.txt,.xlsx,.csv" onChange={handleFileUpload} />
            </Button>

            {hasCompleted && (
              <Button size="small" variant="text" color="inherit" onClick={handleClearCompleted} sx={{ color: '#64748B', fontSize: '0.75rem' }}>
                Limpar concluidos
              </Button>
            )}
          </Box>

          {/* Fila de Upload */}
          {uploadQueue.length > 0 && (
            <List sx={{ mt: 1 }}>
              {uploadQueue.map((item) => (
                <ListItem
                  key={item.id}
                  sx={{
                    borderRadius: '8px',
                    mb: 0.5,
                    backgroundColor: item.status === 'error'
                      ? 'rgba(239, 68, 68, 0.08)'
                      : item.status === 'success'
                      ? 'rgba(34, 197, 94, 0.08)'
                      : 'rgba(255, 255, 255, 0.03)',
                    pr: 1,
                  }}
                  secondaryAction={
                    item.status === 'error' ? (
                      <IconButton size="small" color="warning" onClick={() => handleRetry(item)} title="Tentar novamente">
                        <RetryIcon fontSize="small" />
                      </IconButton>
                    ) : undefined
                  }
                >
                  <ListItemIcon sx={{ minWidth: 36, color: '#06B6D4' }}>
                    <FileIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#F8FAFC', fontSize: '0.85rem' }}>
                          {item.file.name}
                        </Typography>
                        {getStatusChip(item.status, item.errorMessage)}
                      </Box>
                    }
                    secondary={`${(item.file.size / 1024).toFixed(1)} KB`}
                    slotProps={{
                      secondary: { sx: { fontSize: '0.7rem', color: '#64748B' } },
                    }}
                  />
                  {item.status === 'uploading' && (
                    <LinearProgress sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, borderRadius: '0 0 8px 8px' }} />
                  )}
                </ListItem>
              ))}
            </List>
          )}

          {/* Lista de Arquivos Existentes */}
          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 2, mb: 0.5, fontWeight: 600 }}>
            Arquivos na base:
          </Typography>
          <List>
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
            2. Adicionar Links Web para Coleta Automatica (JSON)
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
                    secondary={`Status: ${lnk.status} ${lnk.lastFetchedAt ? `• Ultimo fetch: ${new Date(lnk.lastFetchedAt).toLocaleString()}` : ''}`}
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
