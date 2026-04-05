import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 커스텀 간격
      spacing: {
        '25': '100px',
      },
      // 커스텀 색상 (CSS 변수 사용)
      colors: {
        'mefit-accent': 'var(--accent)',
        'mefit-fg': 'var(--fg)',
        'mefit-muted': 'var(--muted)',
      },
      // 커스텀 폰트
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      // 커스텀 박스 섀도우
      boxShadow: {
        'card': 'var(--sc)',
        'card-hover': 'var(--sch)',
        'button': 'var(--sb)',
      },
      // 커스텀 애니메이션
      animation: {
        'fadeUp': 'fadeUp 0.4s ease both',
        'shimmer': 'shimmer 1.4s infinite',
      },
      keyframes: {
        fadeUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
