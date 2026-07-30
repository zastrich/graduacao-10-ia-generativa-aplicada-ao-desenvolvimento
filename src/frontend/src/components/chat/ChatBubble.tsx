import React from 'react';
import { Box, Typography, Avatar, Paper } from '@mui/material';
import { SmartToy as BotIcon, Person as UserIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../../types';

interface ChatBubbleProps {
  message: Message;
  agentName?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, agentName }) => {
  const isUser = message.sender === 'user';
  const displayName = isUser ? 'Voce' : (agentName || 'Copiloto AWS Bedrock');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 1.5,
        mb: 2.5,
      }}
    >
      <Avatar
        sx={{
          width: 36,
          height: 36,
          bgcolor: isUser ? '#7C3AED' : '#06B6D4',
          boxShadow: isUser
            ? '0 4px 12px rgba(124, 58, 237, 0.4)'
            : '0 4px 12px rgba(6, 182, 212, 0.4)',
        }}
      >
        {isUser ? <UserIcon sx={{ fontSize: 20 }} /> : <BotIcon sx={{ fontSize: 20 }} />}
      </Avatar>

      <Box sx={{ maxWidth: '80%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: isUser ? '#A78BFA' : '#67E8F9' }}>
            {displayName}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
            {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
            backgroundColor: isUser ? 'rgba(124, 58, 237, 0.25)' : 'rgba(30, 41, 59, 0.8)',
            border: isUser
              ? '1px solid rgba(124, 58, 237, 0.4)'
              : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(8px)',
            // Markdown styles
            '& p': { margin: '0 0 0.5em 0', '&:last-child': { mb: 0 } },
            '& ul, & ol': { pl: 2.5, my: 0.5 },
            '& li': { mb: 0.3 },
            '& strong': { color: '#F8FAFC' },
            '& a': { color: '#67E8F9', textDecoration: 'underline', '&:hover': { color: '#A5F3FC' } },
            '& code': { backgroundColor: 'rgba(255,255,255,0.1)', px: 0.5, borderRadius: '4px', fontSize: '0.85em' },
            '& pre': { backgroundColor: 'rgba(0,0,0,0.3)', p: 1.5, borderRadius: '8px', overflow: 'auto', my: 1 },
            '& pre code': { backgroundColor: 'transparent', p: 0 },
            '& h1, & h2, & h3, & h4': { mt: 1, mb: 0.5, color: '#F8FAFC' },
            '& blockquote': { borderLeft: '3px solid #7C3AED', pl: 1.5, ml: 0, color: '#94A3B8' },
          }}
        >
          {isUser ? (
            <Typography
              variant="body1"
              sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#F8FAFC', fontSize: '0.95rem', lineHeight: 1.6 }}
            >
              {message.content}
            </Typography>
          ) : (
            <Box sx={{ color: '#E2E8F0', fontSize: '0.95rem', lineHeight: 1.6, wordBreak: 'break-word' }}>
              <ReactMarkdown
                components={{
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};
