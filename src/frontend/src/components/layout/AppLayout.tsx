import { useState } from 'react';
import { Box, IconButton, useMediaQuery } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Outlet } from '@tanstack/react-router';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  const isMobile = useMediaQuery('(max-width:768px)');
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0B0F19' }}>
      <Sidebar
        mobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Mobile header with menu button */}
        {isMobile && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              backgroundColor: '#0F172A',
            }}
          >
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{ color: '#94A3B8' }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        )}

        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 1.5, md: 3 },
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
