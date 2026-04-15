import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ── 간격 ──
      spacing: {
        '25': '100px',
      },

      // ── Width ──
      width: {
        '35p': '35%',
      },

      // ── Max-width (컨테이너 시스템) ──
      maxWidth: {
        'container-xl': '1200px',  // Resume 관련 페이지
        'container-lg': '1140px',  // JD 관련 페이지
        'container':    '1080px',  // 메인 컨테이너
        'container-md': '820px',   // Interview precheck
        'container-sm': '720px',   // JD analyzing
        'form':         '520px',   // 폼 카드
        'content':      '480px',   // 작은 컨테이너
        'text':         '440px',   // 텍스트 블록
        'button-group': '320px',   // 버튼 그룹
      },

      // ── 색상 토큰 ──
      colors: {
        mefit: {
          // 기본
          black:   '#0A0A0A',
          white:   '#FFFFFF',
          canvas:  '#FFFFFF',

          // 주 강조색
          primary:        '#0991B2',
          'primary-mid':  '#06B6D4',
          'primary-light':'#E6F7FA',
          'primary-ring': 'rgba(9,145,178,0.1)',
          'primary-border':'rgba(9,145,178,0.15)',
          'primary-border-md':'rgba(9,145,178,0.25)',

          // 시맨틱
          success:        '#059669',
          'success-light':'#F0FDF4',
          'success-border':'#BBF7D0',

          warning:        '#D97706',
          'warning-light':'#FFF7ED',
          'warning-border':'#FED7AA',

          danger:         '#DC2626',
          'danger-light': '#FEF2F2',
          'danger-border':'#FECACA',
          'danger-vivid': '#EF4444',
          'danger-rose':  '#E11D48',

          // 그레이 스케일
          gray: {
            50:  '#F9FAFB',
            100: '#F3F4F6',
            150: '#ECEEF0',  // 중간값 (E9EAEC 근사)
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827',
          },

          // 반투명 오버레이
          'overlay-white-92': 'rgba(255,255,255,0.92)',
          'overlay-white-95': 'rgba(255,255,255,0.95)',
          'overlay-black-35': 'rgba(0,0,0,0.35)',
          'overlay-black-40': 'rgba(0,0,0,0.40)',
        },
      },

      // ── 폰트 ──
      fontFamily: {
        'plex-sans-kr': ['IBM Plex Sans KR', 'sans-serif'],
      },

      // ── 폰트 크기 (자주 쓰이는 임의값 토큰화) ──
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.45' }],
        'xs':  ['12px', { lineHeight: '1.5'  }],
        'sm':  ['13px', { lineHeight: '1.5'  }],
        'base':['14px', { lineHeight: '1.55' }],
        'md':  ['15px', { lineHeight: '1.55' }],
        'lg':  ['16px', { lineHeight: '1.5'  }],
        'xl':  ['18px', { lineHeight: '1.4'  }],
        '2xl': ['20px', { lineHeight: '1.3'  }],
        '3xl': ['22px', { lineHeight: '1.3'  }],
        '4xl': ['24px', { lineHeight: '1.2'  }],
        '5xl': ['26px', { lineHeight: '1.2'  }],
      },

      // ── 박스 섀도우 ──
      boxShadow: {
        'card':       'var(--sc)',
        'card-hover': 'var(--sch)',
        'button':     'var(--sb)',
        'button-hover':'var(--sbh)',
        'widget':     'var(--sw)',
        'none-token': 'var(--sp)',
        // 자주 쓰이는 고정 그림자
        'xs':   '0 1px 2px rgba(0,0,0,0.05)',
        'sm':   '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        'md':   '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
        'lg':   '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
        'lift': '0 2px 8px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.08)',
        'primary-glow': '0 2px 8px rgba(9,145,178,0.3)',
        'toggle': '0 1px 4px rgba(0,0,0,0.15)',
        'ring-primary': '0 0 0 3px rgba(9,145,178,0.1)',
      },

      // ── 테두리 반경 ──
      borderRadius: {
        'xs':  '4px',
        'sm':  '6px',
        'md':  '8px',
        'lg':  '10px',
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },

      // ── 전환 ──
      transitionProperty: {
        'border-shadow': 'border-color, box-shadow',
      },

      // ── 애니메이션 (전역 통합) ──
      animation: {
        // 공통
        'fade-up':    'fadeUp 0.4s ease both',
        'fade-up-sm': 'fadeUpSm 0.3s ease both',
        'slide-up':   'slideUp 0.35s cubic-bezier(0.4,0,0.2,1)',
        'slide-down': 'slideDown 0.3s ease both',
        'spin-slow':  'spin 0.6s linear infinite',
        'spin-fast':  'spin 0.4s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer':    'shimmer 1.4s infinite',
        'shimmer-slow':'shimmer 1.8s infinite',
        'pop':        'pop 0.35s ease both',
        'bounce-y':   'bounceY 1.2s ease-in-out infinite',
        'blink':      'blink 1s step-end infinite',
        'breathe':    'breathe 2s ease-in-out infinite',
        'flicker':    'flicker 2s ease-in-out infinite',
        'fill-bar':   'fillBar 0.8s ease both',
        'live-dot':   'liveDot 1.2s ease-in-out infinite',
        'dot-pulse':  'dotPulse 1.2s ease-in-out infinite',
        'check-pulse':'checkPulse 0.4s ease both',
        'card-glow':  'cardGlow 2s ease-in-out infinite',
        'breathe-ring':'breatheRing 2s ease-in-out infinite',
        'analyze-bar':'analyzeBar 2s ease both',
      },

      keyframes: {
        // ── 진입 ──
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeUpSm: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%':   { transform: 'scale(0.85)', opacity: '0' },
          '70%':  { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },

        // ── 반복 ──
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        bounceY: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)',    opacity: '1' },
          '50%':      { transform: 'scale(1.08)', opacity: '0.85' },
        },
        liveDot: {
          '0%, 100%': { transform: 'scale(1)',   opacity: '1' },
          '50%':      { transform: 'scale(1.5)', opacity: '0.6' },
        },
        dotPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.5', transform: 'scale(0.8)' },
        },

        // ── 상태 전환 ──
        fillBar: {
          from: { width: '0' },
        },
        analyzeBar: {
          '0%':   { width: '0' },
          '100%': { width: '100%' },
        },
        checkPulse: {
          '0%':   { transform: 'scale(0.5)', opacity: '0' },
          '60%':  { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        cardGlow: {
          '0%, 100%': { boxShadow: '0 1px 2px rgba(0,0,0,.03), 0 2px 8px rgba(0,0,0,.05)' },
          '50%':      { boxShadow: '0 0 0 3px rgba(9,145,178,.15), 0 1px 2px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.06)' },
        },
        breatheRing: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(9,145,178,0)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(9,145,178,0.1)' },
        },
        skPop: {
          '0%':   { transform: 'scale(0.7)', opacity: '0' },
          '70%':  { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
      },
    },
  },

  plugins: [
    // ── webkit 자동 접두사 플러그인 ──
    // backdrop-filter 사용 시 -webkit-backdrop-filter 자동 추가
    plugin(({ addBase, addUtilities }) => {
      // 전역 베이스: 폰트 스무딩
      addBase({
        ':root': {
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
      })

      // backdrop-blur 유틸리티에 webkit 접두사 병행 적용
      const blurValues: Record<string, string> = {
        'none': '0',
        'sm':   '4px',
        'DEFAULT': '8px',
        'md':   '12px',
        'lg':   '16px',
        'xl':   '24px',
        '2xl':  '40px',
        '3xl':  '64px',
      }
      const backdropUtilities: Record<string, Record<string, string>> = {}
      Object.entries(blurValues).forEach(([key, val]) => {
        const cls = key === 'DEFAULT' ? '.backdrop-blur' : `.backdrop-blur-${key}`
        backdropUtilities[cls] = {
          'backdrop-filter':         `blur(${val})`,
          '-webkit-backdrop-filter': `blur(${val})`,
        }
      })
      addUtilities(backdropUtilities)

      // reveal 애니메이션 유틸리티 (JS 클래스 토글 방식)
      addUtilities({
        '.reveal': {
          opacity: '0',
          transform: 'translateY(18px)',
          transition: 'opacity 0.45s ease, transform 0.45s ease',
        },
        '.reveal-in': {
          opacity: '1',
          transform: 'translateY(0)',
        },
      })

      // skeleton 유틸리티
      addUtilities({
        '.skeleton-shimmer': {
          background: 'linear-gradient(90deg, rgba(9,145,178,0.05) 25%, rgba(9,145,178,0.12) 50%, rgba(9,145,178,0.05) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.8s infinite',
        },
        '.skeleton-gray': {
          background: 'linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
        },
      })
    }),
  ],
} satisfies Config
