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
      // 커스텀 width (skeleton 로딩용)
      width: {
        '35p': '35%',  // Tailwind 기본에 없는 35%만 추가
      },
      // 커스텀 max-width (자주 사용되는 컨테이너 너비)
      maxWidth: {
        'container-xl': '1200px',  // Resume 관련 페이지
        'container-lg': '1140px',  // JD 관련 페이지
        'container': '1080px',     // 메인 컨테이너 (landing, onboarding 등)
        'container-md': '820px',   // Interview precheck
        'container-sm': '720px',   // JD analyzing
        'form': '520px',           // 폼 카드
        'content': '480px',        // 작은 컨테이너
        'text': '440px',           // 텍스트 블록
        'button-group': '320px',   // 버튼 그룹
      },
      // 커스텀 색상 (CSS 변수 + 디자인 시스템 토큰)
      colors: {
        'mefit-accent': 'var(--accent)',
        'mefit-fg': 'var(--fg)',
        'mefit-muted': 'var(--muted)',
        // ── 디자인 시스템 시맨틱 토큰 ──
        mefit: {
          black: '#0A0A0A',           // 기본 텍스트, 버튼 배경
          primary: '#0991B2',         // 주 강조색 (cyan-600 계열)
          'primary-light': '#E6F7FA', // 주 강조 배경
          'primary-border': 'rgba(9,145,178,.15)',
          success: '#059669',         // 성공, 강점
          'success-light': '#F0FDF4',
          'success-border': '#BBF7D0',
          warning: '#D97706',         // 경고, 개선
          'warning-light': '#FFF7ED',
          'warning-border': '#FED7AA',
          danger: '#DC2626',          // 에러
          'danger-light': '#FEF2F2',
          'danger-border': '#FECACA',
          'danger-vivid': '#EF4444',
          'danger-rose': '#E11D48',
          gray: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827',
          },
        },
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
