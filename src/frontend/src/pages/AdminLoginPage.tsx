import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminLogin, adminRegister, fetchAuthStatus } from '../api/client';
import { setAdminToken } from '../utils/uid';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();

  // isFirstRun: null = carregando, true = banco vazio, false = já tem admin
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Consulta o status da plataforma ao montar o componente
  useEffect(() => {
    fetchAuthStatus()
      .then((status) => setIsFirstRun(status.isFirstRun))
      .catch(() => setIsFirstRun(false)); // em caso de erro, assume que já existe admin
  }, []);

  const isRegister = isFirstRun === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      let res;
      if (isRegister) {
        res = await adminRegister(email, password, name || 'Admin');
      } else {
        res = await adminLogin(email, password);
      }

      setAdminToken(res.token);
      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Falha na autenticação. Verifique suas credenciais.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Tela de carregamento enquanto verifica o status
  if (isFirstRun === null) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: '100%',
          p: 2,
          borderRadius: '24px',
          backgroundColor: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
              }}
            >
              <AdminIcon sx={{ color: '#FFF', fontSize: 30 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#F8FAFC' }}>
              {isRegister ? 'Configuração Inicial' : 'Acesso Administrativo'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5 }}>
              {isRegister
                ? 'Crie o primeiro administrador da plataforma.'
                : 'Área protegida por senha para gestão de bases e guardrails.'}
            </Typography>
          </Box>

          {isRegister && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: '12px' }}>
              Nenhum administrador cadastrado. Crie o primeiro agora.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {isRegister && (
              <TextField
                fullWidth
                label="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                required
                variant="outlined"
              />
            )}

            <TextField
              fullWidth
              label="E-mail admin"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              helperText={isRegister ? 'Mínimo 12 caracteres' : undefined}
              variant="outlined"
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.4,
                background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isRegister ? (
                'Criar Administrador'
              ) : (
                'Entrar no Painel'
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
