import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('three') || id.includes('@react-three')) return 'vendor-three';
          if (id.includes('gsap') || id.includes('@gsap')) return 'vendor-gsap';
          if (id.includes('lenis')) return 'vendor-lenis';
          if (id.includes('lottie')) return 'vendor-lottie';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('@mediapipe')) return 'vendor-mediapipe';
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }
          return undefined;
        },
      },
    },
  },
})
