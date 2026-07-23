import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Skeleton,
  Paper,
  InputAdornment,
  TextField,
} from '@mui/material';
import {
  Search as SearchIcon,
  Folder as FolderIcon,
  Update as UpdateIcon,
  SmartToy as BotIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fetchPublicKnowledgeBases } from '../api/client';
import type { KnowledgeBase } from '../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPublicKnowledgeBases()
      .then((data) => setKnowledgeBases(data))
      .catch((err) => console.error('Erro ao carregar bases:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = knowledgeBases.filter(
    (kb) =>
      kb.name.toLowerCase().includes(search.toLowerCase()) ||
      kb.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      {/* Hero Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          mb: 4,
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
          }}
        >
          <BotIcon sx={{ color: '#FFF', fontSize: 36 }} />
        </Box>

        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: '#F8FAFC' }}>
          Copiloto Corporativo com IA
        </Typography>

        <Typography variant="subtitle1" sx={{ maxWidth: '700px', mx: 'auto', mb: 3, color: '#94A3B8' }}>
          Consulte bases de conhecimento corporativas em tempo real utilizando o modelo <strong>AWS Bedrock (Google Gemma 3 4b-it)</strong>. Selecione uma base abaixo e inicie uma conversa.
        </Typography>

        <Box sx={{ maxWidth: '500px', mx: 'auto' }}>
          <TextField
            fullWidth
            placeholder="Pesquisar base de conhecimento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#64748B' }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(11, 15, 25, 0.8)',
                  color: '#FFF',
                },
              },
            }}
          />
        </Box>
      </Paper>

      {/* Seção de Cards de Bases */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#F8FAFC' }}>
        Bases de Conhecimento Disponíveis ({filtered.length})
      </Typography>

      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={220} sx={{ borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.05)' }} />
          ))}
        </Box>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'rgba(17,24,39,0.5)', borderRadius: '16px' }}>
          <Typography variant="body1" sx={{ color: '#94A3B8' }}>
            Nenhuma base de conhecimento encontrada.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
          {filtered.map((kb) => (
            <Card
              key={kb.id}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                borderRadius: '16px',
                p: 1,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Chip
                    size="small"
                    icon={<FolderIcon sx={{ fontSize: 14 }} />}
                    label={`${kb.fileCount || 0} Fonte(s)`}
                    color="primary"
                    variant="outlined"
                    sx={{ height: 24 }}
                  />
                  <Chip
                    size="small"
                    icon={<UpdateIcon sx={{ fontSize: 14 }} />}
                    label={kb.lastTrainedAt ? new Date(kb.lastTrainedAt).toLocaleDateString() : 'Atualizada'}
                    sx={{ height: 24, backgroundColor: 'rgba(255,255,255,0.05)', color: '#94A3B8' }}
                  />
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 700, color: '#F8FAFC', mb: 1 }}>
                  {kb.name}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: '#94A3B8',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    mb: 2,
                    minHeight: 60,
                  }}
                >
                  {kb.description || 'Sem descrição cadastrada.'}
                </Typography>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(`/${kb.slug}/chat`)}
                  sx={{
                    py: 1.2,
                    background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                  }}
                >
                  Iniciar Chat
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};
