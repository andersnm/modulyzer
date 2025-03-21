import { defineConfig } from 'vite'
import { fileURLToPath } from "url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  assetsInclude: ['./src/RecordWorklet.ts'],
  build: {
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL("./index.html", import.meta.url)),
        // dx7: fileURLToPath(new URL("./src/audio/dx7/Dx7Worklet.ts", import.meta.url))

      }
    }
  }
})
