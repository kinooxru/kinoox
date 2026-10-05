/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/design-system/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#06070A',
        abyss: '#0C0E14',
        surface: '#131620',
        frost: '#1C2030',
        flux: { from: '#FF3D6E', to: '#FF6B3D', DEFAULT: '#FF3D6E' },
        prism: { from: '#7C5CFF', to: '#5C8CFF', DEFAULT: '#7C5CFF' },
        aura: { from: '#00E5C7', to: '#00B8E5', DEFAULT: '#00E5C7' },
        'text-primary': '#F5F7FA',
        'text-secondary': '#8B92A8',
        'text-muted': '#4A5068',
      },
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '20px',
        panel: '28px',
      },
      boxShadow: {
        'glow-flux': '0 0 40px rgba(255,61,110,0.3)',
        'glow-prism': '0 0 40px rgba(124,92,255,0.25)',
        'glow-aura': '0 0 40px rgba(0,229,199,0.2)',
        card: '0 20px 48px rgba(0,0,0,0.65)',
        'card-hover':
          '0 20px 48px rgba(0,0,0,0.65), 0 0 40px rgba(255,61,110,0.18), 0 0 60px rgba(124,92,255,0.14)',
      },
      transitionTimingFunction: {
        flow: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backgroundImage: {
        'gradient-flux': 'linear-gradient(135deg, #FF3D6E 0%, #FF6B3D 100%)',
        'gradient-prism': 'linear-gradient(135deg, #7C5CFF 0%, #5C8CFF 100%)',
        'gradient-aura': 'linear-gradient(135deg, #00E5C7 0%, #00B8E5 100%)',
        'gradient-flux-prism': 'linear-gradient(90deg, #FF3D6E 0%, #7C5CFF 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'logo-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.82' },
          '50%': { transform: 'scale(1.06)', opacity: '1' },
        },
        'heart-burst': {
          '0%': { transform: 'scale(1)' },
          '35%': { transform: 'scale(1.35)' },
          '65%': { transform: 'scale(0.92)' },
          '85%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)' },
        },
        'screen-morph': {
          '0%': { opacity: '0', transform: 'translateY(24px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'player-enter': {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'platform-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.86' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        'float-particles': {
          '0%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '0.35' },
          '50%': { transform: 'translate3d(18px,-28px,0) scale(1.12)', opacity: '0.6' },
          '100%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '0.35' },
        },
      },
      animation: {
        shimmer: 'shimmer 1400ms linear infinite',
        'logo-pulse': 'logo-pulse 1800ms ease-in-out infinite',
        'heart-burst': 'heart-burst 520ms cubic-bezier(0.34,1.56,0.64,1)',
        'screen-morph': 'screen-morph 400ms cubic-bezier(0.16,1,0.3,1) both',
        'player-enter': 'player-enter 400ms cubic-bezier(0.16,1,0.3,1) both',
        'platform-pulse': 'platform-pulse 2400ms ease-in-out infinite',
        'float-particles': 'float-particles 12s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}