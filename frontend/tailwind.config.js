/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#14213D',
          dark: '#0B1323',
          deep: '#0F1A30',
          light: '#1E325C',
          50: '#F0F4F8',
          100: '#D9E2EC',
          900: '#14213D',
        },
        ink: {
          DEFAULT: '#111827',
          soft: '#1F2937',
          muted: '#374151',
        },
        ivory: {
          DEFAULT: '#F8F7F3',
          warm: '#F4F2EC',
          subtle: '#FAF9F6',
          border: '#ECEAE4',
        },
        slate: {
          DEFAULT: '#53657D',
          muted: '#64748B',
          light: '#94A3B8',
          soft: '#F1F5F9',
        },
        saffron: {
          DEFAULT: '#FFB703',
          light: '#FFC83B',
          dark: '#E0A100',
        },
        orangeAccent: {
          DEFAULT: '#FB8500',
          hover: '#E07600',
        },
        civicGreen: {
          DEFAULT: '#15803D',
          light: '#DCFCE7',
          text: '#166534',
        },
        civicRed: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        },
        borderSoft: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Manrope', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(17, 24, 39, 0.04), 0 1px 2px rgba(17, 24, 39, 0.02)',
        'card': '0 4px 20px -2px rgba(20, 33, 61, 0.06), 0 2px 6px -1px rgba(20, 33, 61, 0.03)',
        'elevated': '0 12px 32px -4px rgba(20, 33, 61, 0.10), 0 4px 12px -2px rgba(20, 33, 61, 0.05)',
        'modal': '0 24px 48px -12px rgba(20, 33, 61, 0.18)',
      },
      borderRadius: {
        'pill': '9999px',
        'box': '10px',
      }
    },
  },
  plugins: [],
}
