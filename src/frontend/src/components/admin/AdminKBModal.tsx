import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Slider,
  Typography,
  Box,
  Alert,
  Divider,
} from '@mui/material';
import { Tune as TuneIcon } from '@mui/icons-material';
import { createKnowledgeBase, updateKnowledgeBase } from '../../api/client';
import type { KnowledgeBase } from '../../types';

interface AdminKBModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingKb?: KnowledgeBase | null;
}

const DEFAULT_SYSTEM_PROMPT = 'Voce e um assistente corporativo inteligente. Responda as perguntas do usuario com base no contexto fornecido. Se nao tiver informacao suficiente, diga que nao encontrou a resposta nos documentos disponiveis.';

export const AdminKBModal: React.FC<AdminKBModalProps> = ({
  open,
  onClose,
  onSuccess,
  editingKb,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [topK, setTopK] = useState(50);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingKb) {
      setName(editingKb.name || '');
      setSlug(editingKb.slug || '');
      setDescription(editingKb.description || '');
      // Backend stores as 'config', frontend type shows as 'bedrockConfig'
      const cfg = (editingKb as any).config || editingKb.bedrockConfig || {};
      setTemperature(cfg.temperature ?? 0.7);
      setTopP(cfg.topP ?? cfg.top_p ?? 0.9);
      setTopK(cfg.topK ?? cfg.top_k ?? 50);
      setMaxTokens(cfg.maxTokens ?? 2048);
      setSystemPrompt(cfg.systemPrompt || DEFAULT_SYSTEM_PROMPT);
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setTemperature(0.7);
      setTopP(0.9);
      setTopK(50);
      setMaxTokens(2048);
      setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    }
    setError(null);
  }, [editingKb, open]);

  // Auto gera slug ao digitar nome (se for nova base)
  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingKb) {
      const generatedSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;

    setLoading(true);
    setError(null);

    const payload = {
      name,
      slug,
      description,
      config: {
        temperature,
        topP,
        topK,
        maxTokens,
        systemPrompt,
      },
    };

    try {
      if (editingKb) {
        await updateKnowledgeBase(editingKb.id, payload);
      } else {
        await createKnowledgeBase(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Falha ao salvar base de conhecimento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: '20px', backgroundColor: '#111827' } } }}>
      <DialogTitle sx={{ fontWeight: 700, color: '#F8FAFC' }}>
        {editingKb ? 'Editar Base de Conhecimento' : 'Nova Base de Conhecimento'}
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Nome da Base"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />

              <TextField
                fullWidth
                label="Slug da URL (ex: politicas-hr)"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                helperText={`URL: /${slug || 'slug'}/chat`}
              />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Descricao / Objetivo da Base"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.08)' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TuneIcon color="secondary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#67E8F9' }}>
                Configuracao do Modelo & Guardrails
              </Typography>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="System Prompt (instrucoes para o modelo)"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              helperText="Define o comportamento e personalidade do assistente. Use para guardrails de seguranca."
              slotProps={{
                input: { sx: { fontSize: '0.85rem', fontFamily: 'monospace' } },
              }}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  Temperatura ({temperature}) — criatividade das respostas
                </Typography>
                <Slider
                  value={temperature}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(_, v) => setTemperature(v as number)}
                  valueLabelDisplay="auto"
                  color="secondary"
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  Top P ({topP}) — diversidade de tokens
                </Typography>
                <Slider
                  value={topP}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(_, v) => setTopP(v as number)}
                  valueLabelDisplay="auto"
                  color="secondary"
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  Top K ({topK}) — candidatos por token
                </Typography>
                <Slider
                  value={topK}
                  min={1}
                  max={100}
                  step={1}
                  onChange={(_, v) => setTopK(v as number)}
                  valueLabelDisplay="auto"
                  color="secondary"
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  Max Tokens ({maxTokens}) — tamanho maximo da resposta
                </Typography>
                <Slider
                  value={maxTokens}
                  min={256}
                  max={8192}
                  step={256}
                  onChange={(_, v) => setMaxTokens(v as number)}
                  valueLabelDisplay="auto"
                  color="secondary"
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} color="inherit">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)' }}
          >
            {loading ? 'Salvando...' : 'Salvar Base'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
