import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  SmartToy as BotIcon,
  AdminPanelSettings as AdminIcon,
  Home as HomeIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAdminToken, removeAdminToken } from '../../utils/uid';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminLoggedIn = !!getAdminToken();

  const handleLogout = () => {
    removeAdminToken();
    navigate('/admin/login');
  };

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {onToggleSidebar && (
            <IconButton color="inherit" onClick={onToggleSidebar} edge="start" sx={{ mr: 0.5 }}>
              <MenuIcon />
            </IconButton>
          )}

          <Box
            onClick={() => navigate('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
              }}
            >
              <BotIcon sx={{ color: '#FFF', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #FFF 0%, #9CA3AF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Copiloto Corporativo
              </Typography>
              <Typography variant="caption" sx={{ color: '#06B6D4', fontWeight: 600, display: 'block', mt: '-4px' }}>
                AWS Bedrock • Gemma 3
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{ opacity: location.pathname === '/' ? 1 : 0.7 }}
          >
            Bases
          </Button>

          {isAdminLoggedIn ? (
            <>
              <Button
                variant={location.pathname.startsWith('/admin') && location.pathname !== '/admin/login' ? 'contained' : 'outlined'}
                color="primary"
                startIcon={<AdminIcon />}
                onClick={() => navigate('/admin')}
                size="small"
              >
                Painel Admin
              </Button>
              <Tooltip title="Sair do Admin">
                <IconButton color="error" onClick={handleLogout} size="small">
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AdminIcon />}
              onClick={() => navigate('/admin/login')}
              size="small"
            >
              Área Admin
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
