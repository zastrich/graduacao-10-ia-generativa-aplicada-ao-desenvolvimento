import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0B0F19' }}>
      <Header onToggleSidebar={handleToggleSidebar} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} variant="temporary" />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
