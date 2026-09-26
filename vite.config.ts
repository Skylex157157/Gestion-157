import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa para poder publicarla en cualquier subcarpeta (p. ej. GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [react()],
});
