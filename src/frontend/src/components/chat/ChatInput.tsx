import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { KeyboardEvent } from 'react';
import { Box, TextField, IconButton, CircularProgress, Tooltip } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
}

export interface ChatInputHandle {
  focus: () => void;
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(({
  onSend,
  disabled = false,
  loading = false,
  placeholder = 'Pergunte qualquer coisa sobre esta base de conhecimento...',
}, ref) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = () => {
    if (text.trim() && !disabled && !loading) {
      onSend(text.trim());
      setText('');
      // Re-focus after send
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        p: 1.5,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || loading}
        variant="standard"
        inputRef={inputRef}
        slotProps={{
          input: {
            disableUnderline: true,
            sx: {
              color: '#F8FAFC',
              px: 1,
              fontSize: '0.95rem',
              '&::placeholder': { color: '#64748B', opacity: 1 },
            },
          },
        }}
      />

      <Tooltip title="Enviar mensagem (Enter)">
        <span>
          <IconButton
            onClick={handleSend}
            disabled={!text.trim() || disabled || loading}
            sx={{
              background: text.trim() && !loading
                ? 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              color: text.trim() && !loading ? '#FFF' : '#64748B',
              boxShadow: text.trim() && !loading ? '0 4px 14px rgba(124, 58, 237, 0.4)' : 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #6D28D9 0%, #0891B2 100%)',
              },
              '&.Mui-disabled': {
                color: '#475569',
                background: 'rgba(255, 255, 255, 0.03)',
              },
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
});
