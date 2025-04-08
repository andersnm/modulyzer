import { defineConfig, loadEnv } from 'vite'

// The application can be hosted in a subdirectory, but must be built specially for it.
// The Github Pages build uses "vite build --mode pages" and reads VITE_BASE from .env.pages.

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: env.VITE_BASE || '/',
  };
});
