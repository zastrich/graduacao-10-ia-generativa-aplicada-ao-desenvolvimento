import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  Tab,
  Tabs,
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
  Download as DownloadIcon,
  OpenInNew as OpenIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  uploadKnowledgeBaseFile,
  deleteKnowledgeBaseFile,
  getFileDownloadUrl,
  addKnowledgeBaseLink,
  deleteKnowledgeBaseLink,
  importSitemap,
  triggerRetrainKnowledgeBase,
  cancelRetrainKnowledgeBase,
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
  const [tab, setTab] = useState(0);
  const [uploadQueue, setUploadQueue] = useState<FileUploadItem[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [addingLink, setAddingLink] = useState(false);
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [importingSitemap, setImportingSitemap] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [countdown, setCountdown] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTraining = (knowledgeBase as any).retrainStatus === 'training';

  // Auto-refresh every 30s while training
  useEffect(() => {
    if (!isTraining) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    setCountdown(30);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onRefresh();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTraining]);

  const handleManualRefresh = () => {
    onRefresh();
    setCountdown(30);
  };

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
      const errorMessage = err.response?.data?.error || err.message || 'Falha ao enviar.';
      setUploadQueue((prev) =>
        prev.map((f) => f.id === item.id ? { ...f, status: 'error' as UploadStatus, errorMessage } : f)
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setMsg(null);

    const newItems: FileUploadItem[] = Array.from(files).map((file, i) => ({
      id: `${Date.now()}-${i}-${file.name}`,
      file,
      status: 'pending' as UploadStatus,
    }));
    setUploadQueue((prev) => [...prev, ...newItems]);

    const BATCH_SIZE = 3;
    for (let i = 0; i < newItems.length; i += BATCH_SIZE) {
      const batch = newItems.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(batch.map((item) => uploadSingleFile(item, knowledgeBase.id)));
    }
    onRefresh();
    e.target.value = '';
  };

  const handleRetry = async (item: FileUploadItem) => {
    await uploadSingleFile(item, knowledgeBase.id);
    onRefresh();
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteKnowledgeBaseFile(knowledgeBase.id, fileId);
      setMsg({ type: 'success', text: 'Arquivo removido.' });
      onRefresh();
    } catch {
      setMsg({ type: 'error', text: 'Falha ao remover arquivo.' });
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      const url = await getFileDownloadUrl(knowledgeBase.id, fileId);
      window.open(url, '_blank');
    } catch {
      setMsg({ type: 'error', text: 'Falha ao gerar link de download.' });
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl) return;
    setAddingLink(true);
    setMsg(null);
    try {
      await addKnowledgeBaseLink(knowledgeBase.id, linkUrl);
      setMsg({ type: 'success', text: 'Link adicionado! Retreine a base para indexar o conteudo.' });
      setLinkUrl('');
      onRefresh();
    } catch {
      setMsg({ type: 'error', text: 'Falha ao adicionar link.' });
    } finally {
      setAddingLink(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteKnowledgeBaseLink(knowledgeBase.id, linkId);
      setMsg({ type: 'success', text: 'Link removido.' });
      onRefresh();
    } catch {
      setMsg({ type: 'error', text: 'Falha ao remover link.' });
    }
  };

  const handleImportSitemap = async () => {
    if (!sitemapUrl) return;
    setImportingSitemap(true);
    setMsg(null);
    try {
      const result = await importSitemap(knowledgeBase.id, sitemapUrl);
      setMsg({ type: 'success', text: `Sitemap importado: ${result.added} links adicionados, ${result.skipped} duplicados ignorados.` });
      setSitemapUrl('');
      onRefresh();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Falha ao importar sitemap.' });
    } finally {
      setImportingSitemap(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setMsg(null);
    try {
      const result = await triggerRetrainKnowledgeBase(knowledgeBase.id);
      setMsg({ type: 'success', text: result?.message || 'Retreinamento iniciado em background.' });
      onRefresh();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Falha ao retreinar.' });
    } finally {
      setRetraining(false);
    }
  };

  const handleCancelRetrain = async () => {
    try {
      await cancelRetrainKnowledgeBase(knowledgeBase.id);
      setMsg({ type: 'success', text: 'Cancelamento solicitado. O treino sera interrompido no proximo batch.' });
      onRefresh();
    } catch {
      setMsg({ type: 'error', text: 'Falha ao cancelar.' });
    }
  };

  const hasUploading = uploadQueue.some((f) => f.status === 'uploading');

  const getStatusChip = (status: UploadStatus, errorMessage?: string) => {
    switch (status) {
      case 'pending': return <Chip size="small" label="Aguardando" sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#94A3B8', height: 22, fontSize: '0.7rem' }} />;
      case 'uploading': return <Chip size="small" icon={<CircularProgress size={12} />} label="Enviando" sx={{ bgcolor: 'rgba(99,102,241,0.2)', color: '#818CF8', height: 22, fontSize: '0.7rem' }} />;
      case 'success': return <Chip size="small" icon={<SuccessIcon sx={{ fontSize: 14 }} />} label="OK" color="success" sx={{ height: 22, fontSize: '0.7rem' }} />;
      case 'error': return <Chip size="small" icon={<ErrorIcon sx={{ fontSize: 14 }} />} label={errorMessage || 'Erro'} color="error" sx={{ height: 22, fontSize: '0.7rem', maxWidth: 180 }} />;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: '20px', backgroundColor: '#111827' } } }}>
      <DialogTitle sx={{ fontWeight: 700, color: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{knowledgeBase.name}</span>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(knowledgeBase as any).retrainStatus === 'training' ? (
            <Button variant="outlined" color="warning" size="small" onClick={handleCancelRetrain}>
              Cancelar Treino
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={retraining ? <CircularProgress size={16} color="inherit" /> : <RetrainIcon />}
              onClick={handleRetrain}
              disabled={retraining || (knowledgeBase as any).retrainStatus === 'training'}
            >
              {retraining ? 'Iniciando...' : 'Retreinar Base'}
            </Button>
          )}
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)', p: 0 }}>
        {msg && (
          <Alert severity={msg.type} sx={{ mx: 2, mt: 2 }} onClose={() => setMsg(null)}>
            {msg.text}
          </Alert>
        )}

        {/* Retrain progress summary */}
        {isTraining && (knowledgeBase as any).retrainProgress && (
          <Box sx={{ mx: 2, mt: 2, p: 1.5, borderRadius: '8px', bgcolor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#A78BFA', fontWeight: 700 }}>
                Retreinamento em andamento
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
                  Atualiza em {countdown}s
                </Typography>
                <IconButton size="small" onClick={handleManualRefresh} sx={{ color: '#A78BFA', p: 0.3 }}>
                  <RefreshIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#CBD5E1' }}>
                Processados: {(knowledgeBase as any).retrainProgress.processed}/{(knowledgeBase as any).retrainProgress.total}
              </Typography>
              {(knowledgeBase as any).retrainProgress.errors > 0 && (
                <Typography variant="caption" sx={{ color: '#EF4444' }}>
                  Erros: {(knowledgeBase as any).retrainProgress.errors}
                </Typography>
              )}
            </Box>
            <LinearProgress
              variant="determinate"
              value={((knowledgeBase as any).retrainProgress.processed / Math.max((knowledgeBase as any).retrainProgress.total, 1)) * 100}
              sx={{ mt: 1, borderRadius: 1 }}
            />
          </Box>
        )}

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Tab label={`Arquivos (${knowledgeBase.files?.length || 0})`} />
          <Tab label={`Links (${knowledgeBase.links?.length || 0})`} />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {/* TAB 0: Arquivos */}
          {tab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={hasUploading ? <CircularProgress size={18} color="inherit" /> : <UploadIcon />}
                  disabled={hasUploading}
                  sx={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)' }}
                  size="small"
                >
                  {hasUploading ? 'Enviando...' : 'Selecionar Arquivos'}
                  <input type="file" hidden multiple accept=".pdf,.txt,.xlsx,.csv,.md,.json" onChange={handleFileUpload} />
                </Button>
                {uploadQueue.some((f) => f.status === 'success') && (
                  <Button size="small" color="inherit" onClick={() => setUploadQueue((q) => q.filter((f) => f.status !== 'success'))} sx={{ fontSize: '0.7rem', color: '#64748B' }}>
                    Limpar concluidos
                  </Button>
                )}
              </Box>

              {/* Upload queue */}
              {uploadQueue.length > 0 && (
                <List dense sx={{ mb: 2 }}>
                  {uploadQueue.map((item) => (
                    <ListItem key={item.id} sx={{ borderRadius: '8px', mb: 0.3, bgcolor: item.status === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)', pr: 1 }}
                      secondaryAction={item.status === 'error' ? <IconButton size="small" color="warning" onClick={() => handleRetry(item)}><RetryIcon fontSize="small" /></IconButton> : undefined}
                    >
                      <ListItemIcon sx={{ minWidth: 28 }}><FileIcon sx={{ fontSize: 16, color: '#06B6D4' }} /></ListItemIcon>
                      <ListItemText
                        primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#F8FAFC' }} noWrap>{item.file.name}</Typography>{getStatusChip(item.status, item.errorMessage)}</Box>}
                        secondary={`${(item.file.size / 1024).toFixed(1)} KB`}
                        slotProps={{ secondary: { sx: { fontSize: '0.65rem', color: '#64748B' } } }}
                      />
                      {item.status === 'uploading' && <LinearProgress sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 }} />}
                    </ListItem>
                  ))}
                </List>
              )}

              {/* Existing files */}
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, mb: 0.5, display: 'block' }}>
                Arquivos na base:
              </Typography>
              {(!knowledgeBase.files || knowledgeBase.files.length === 0) ? (
                <Typography variant="caption" sx={{ color: '#475569', fontStyle: 'italic' }}>Nenhum arquivo.</Typography>
              ) : (
                <List dense>
                  {knowledgeBase.files.map((file) => (
                    <ListItem key={file.id} sx={{ borderRadius: '8px', mb: 0.3, bgcolor: 'rgba(255,255,255,0.02)' }}
                      secondaryAction={
                        <Box>
                          <IconButton size="small" color="info" onClick={() => handleDownload(file.id)} title="Download"><DownloadIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteFile(file.id)} title="Excluir"><DeleteIcon fontSize="small" /></IconButton>
                        </Box>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 28 }}><FileIcon sx={{ fontSize: 16, color: '#06B6D4' }} /></ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#F8FAFC' }} noWrap>{file.name}</Typography>
                            {(file as any).status === 'error' && <Chip size="small" label={(file as any).statusMessage || 'Erro'} color="error" sx={{ height: 18, fontSize: '0.6rem' }} />}
                            {(file as any).status === 'pending' && <Chip size="small" label="Pendente" sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(255,255,255,0.08)', color: '#94A3B8' }} />}
                            {(file as any).status === 'success' && <Chip size="small" label="OK" color="success" sx={{ height: 18, fontSize: '0.6rem' }} />}
                          </Box>
                        }
                        secondary={`${(file.size / 1024).toFixed(1)} KB • ${new Date(file.uploadedAt).toLocaleDateString()}`}
                        slotProps={{
                          secondary: { sx: { fontSize: '0.65rem', color: '#64748B' } },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* TAB 1: Links */}
          {tab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="https://exemplo.com/documento"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<LinkIcon />}
                  onClick={handleAddLink}
                  disabled={addingLink || !linkUrl}
                  size="small"
                >
                  Adicionar
                </Button>
              </Box>

              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1 }}>
                Links sao indexados ao retreinar a base. O conteudo HTML e automaticamente convertido em texto.
              </Typography>

              {/* Sitemap import */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, p: 1.5, borderRadius: '8px', bgcolor: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="https://exemplo.com/sitemap.xml"
                  value={sitemapUrl}
                  onChange={(e) => setSitemapUrl(e.target.value)}
                  label="Importar Sitemap"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleImportSitemap}
                  disabled={importingSitemap || !sitemapUrl}
                  size="small"
                  sx={{ minWidth: 100 }}
                >
                  {importingSitemap ? <CircularProgress size={18} /> : 'Importar'}
                </Button>
              </Box>

              {(!knowledgeBase.links || knowledgeBase.links.length === 0) ? (
                <Typography variant="caption" sx={{ color: '#475569', fontStyle: 'italic' }}>Nenhum link configurado.</Typography>
              ) : (
                <List dense>
                  {knowledgeBase.links.map((lnk) => (
                    <ListItem key={lnk.id} sx={{ borderRadius: '8px', mb: 0.5, bgcolor: 'rgba(255,255,255,0.02)', flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <LinkIcon sx={{ fontSize: 16, color: '#A78BFA' }} />
                        <Typography
                          component="a"
                          href={lnk.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ fontSize: '0.8rem', color: '#67E8F9', textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, flex: 1 }}
                          noWrap
                        >
                          {lnk.url}
                        </Typography>
                        <IconButton size="small" component="a" href={lnk.url} target="_blank" rel="noopener noreferrer" sx={{ color: '#64748B' }}>
                          <OpenIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteLink(lnk.id)} sx={{ color: '#EF4444' }} title="Excluir link">
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748B', pl: 3.5, fontSize: '0.65rem' }}>
                        {lnk.status === 'error' && <span style={{ color: '#EF4444' }}>{(lnk as any).statusMessage || 'Erro'} • </span>}
                        {lnk.status === 'skipped' && <span style={{ color: '#F59E0B' }}>{(lnk as any).statusMessage || 'Pulado'} • </span>}
                        {lnk.status === 'success' && <span style={{ color: '#22C55E' }}>Indexado • </span>}
                        {lnk.status === 'pending' && <span style={{ color: '#94A3B8' }}>Pendente • </span>}
                        {lnk.lastFetchedAt
                          ? `Fetch: ${new Date(lnk.lastFetchedAt).toLocaleString()}`
                          : 'Nao indexado — retreine a base'}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};
