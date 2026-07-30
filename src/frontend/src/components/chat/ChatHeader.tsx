import React from 'react';
import { Box, Typography, Chip, Tooltip, Paper } from '@mui/material';
import {
  Folder as FolderIcon,
  Update as UpdateIcon,
  CheckCircle as TrainedIcon,
} from '@mui/icons-material';
import type { KnowledgeBase } from '../../types';

interface ChatHeaderProps {
  knowledgeBase: KnowledgeBase;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ knowledgeBase }) => {
  const formattedDate = knowledgeBase.lastTrainedAt || knowledgeBase.updatedAt
    ? new Date(knowledgeBase.lastTrainedAt || knowledgeBase.updatedAt).toLocaleDateString()
    : 'Não informado';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: '16px',
        backgroundColor: 'rgba(17, 24, 39, 0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', md: 'center' },
        gap: 2,
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#F8FAFC' }}>
            {knowledgeBase.name}
          </Typography>
          <Chip
            size="small"
            icon={<TrainedIcon sx={{ fontSize: 14 }} />}
            label="Base Treinada"
            color="success"
            variant="outlined"
            sx={{ height: 22, fontSize: '0.7rem' }}
          />
        </Box>
        <Typography variant="body2" sx={{ color: '#94A3B8', maxWidth: '700px' }}>
          {knowledgeBase.description || 'Base de conhecimento corporativa para consulta inteligente em linguagem natural.'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Tooltip title="Arquivos e links processados como fontes de consulta">
          <Chip
            icon={<FolderIcon sx={{ fontSize: 16 }} />}
            label={`${(knowledgeBase as any).sourceCount || knowledgeBase.fileCount || 0} Fonte(s)`}
            sx={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#67E8F9', border: '1px solid rgba(6, 182, 212, 0.3)' }}
          />
        </Tooltip>

        <Tooltip title="Data do ultimo treinamento / atualizacao dos dados">
          <Chip
            icon={<UpdateIcon sx={{ fontSize: 16 }} />}
            label={formattedDate}
            sx={{ backgroundColor: 'rgba(124, 58, 237, 0.15)', color: '#A78BFA', border: '1px solid rgba(124, 58, 237, 0.3)' }}
          />
        </Tooltip>
      </Box>
    </Paper>
  );
};
