import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from '@tanstack/react-router';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0B0F19' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          maxWidth: '1200px',
          width: '100%',
          overflowY: 'auto',
          height: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
