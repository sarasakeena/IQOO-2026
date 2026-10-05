/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        calm: {
          bg: '#FAF8FE',        // Ultra-soft ethereal lavender-white
          surface: '#FFFFFF',   // Pure white surface
          card: '#FFFFFF',      // Crisp card
          elevated: '#F6F2FD',  // Soft elevated lilac
          subtle: '#EFE9FA',    // Delicate lavender divider
          border: 'rgba(196, 181, 253, 0.35)', // Muted lilac border
          text: '#1C1635',      // Deep warm plum charcoal (never harsh black)
          muted: '#6E6787',     // Calming secondary slate
        },
        purple: {
          light: '#7C3AED',
          pastel: '#C4B5FD',
          soft: '#F4EEFD',      // Dreamy lavender wash
          mist: '#FAF6FE',
          DEFAULT: '#8B5CF6',
          deep: '#6D28D9',
          glow: 'rgba(139, 92, 246, 0.25)',
        },
        yellow: {
          pastel: '#FEF3C7',
          light: '#FDE68A',
          DEFAULT: '#F59E0B',
          warm: '#D97706',
          soft: '#FFFDF0',      // Soft butter cream
          glow: 'rgba(245, 158, 11, 0.25)',
        },
        accent: {
          DEFAULT: '#7C3AED',
          light: '#A78BFA',
          dark: '#5B21B6',
          glow: 'rgba(124, 58, 237, 0.25)',
        },
        danger: '#EF4444',
        success: '#10B981',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
        'breathe': 'breathe 5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.05)', opacity: '0.45' },
        },
        'breathe': {
          '0%, 100%': { transform: 'scale(0.98)', opacity: '0.7' },
          '50%': { transform: 'scale(1.03)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
