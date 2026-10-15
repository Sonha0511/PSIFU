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
    background: '#F7F5FF',
    surface: '#FFFFFF',
    surfaceElevated: '#FFF9FC',
    surfaceMuted: '#F0EDFF',
    primary: '#7047F5',
    primaryPressed: '#5731D8',
    secondary: '#FF6B8A',
    accent: '#10BFA6',
    reward: '#F2A83B',
    text: '#221B37',
    textSecondary: '#655D78',
    textMuted: '#938BA6',
    border: 'rgba(112,71,245,0.16)',
    tint: 'rgba(112,71,245,0.10)',
    nav: 'rgba(250,248,255,0.96)',
    glow: '#8B68FF',
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
