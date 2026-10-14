export const sharedTheme = {
  white: '#FFFFFF',
  success: '#44D995',
  warning: '#F0B86B',
  error: '#FF6B7A',
  radius: { sm: 8, md: 14, lg: 20, xl: 24 },
  motion: { fast: 160, normal: 220 },
};

export const roleThemes = {
  mentee: {
    name: 'aurora',
    background: '#07111F',
    surface: '#122239',
    surfaceElevated: '#192B47',
    surfaceMuted: '#10213A',
    primary: '#2F6BFF',
    primaryPressed: '#1746C7',
    secondary: '#8B7CFF',
    accent: '#4FD6E5',
    reward: '#F0B86B',
    text: '#F4F7FF',
    textSecondary: '#9FB0CF',
    textMuted: '#7184A5',
    border: 'rgba(137,180,255,0.18)',
    tint: 'rgba(47,107,255,0.14)',
    nav: 'rgba(13,28,48,0.96)',
    glow: '#2F6BFF',
  },
  mentor: {
    name: 'midnight',
    background: '#0A1020',
    surface: '#141D32',
    surfaceElevated: '#1A2540',
    surfaceMuted: '#111A2D',
    primary: '#4F7CFF',
    primaryPressed: '#315CD6',
    secondary: '#21C7C7',
    accent: '#21C7C7',
    reward: '#F7C873',
    text: '#F7F9FF',
    textSecondary: '#98A6C2',
    textMuted: '#75829E',
    border: '#293755',
    tint: 'rgba(79,124,255,0.13)',
    nav: '#11192B',
    glow: '#21C7C7',
  },
};

export const getRoleTheme = role => roleThemes[role === 'mentor' ? 'mentor' : 'mentee'];

let activeRole = 'mentee';
export const setActiveRole = role => { activeRole = role === 'mentor' ? 'mentor' : 'mentee'; };
export const getActiveRole = () => activeRole;
