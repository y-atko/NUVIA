import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// En desarrollo, el navegador puede llamar a "/api/..." en el mismo origen y Vite
// reenvía la petición al backend. Así se evitan problemas de CORS sin tocar el código.
// Define VITE_DEV_PROXY_TARGET (por ejemplo http://localhost:8000) para activarlo.
// Este proxy solo existe con `npm run dev`; en producción lo hace el servidor web/Docker.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET

  return {
    plugins: [react()],
    server: {
      host: true, // escucha en 0.0.0.0: necesario para acceder desde fuera de un contenedor
      port: 5173,
      proxy: proxyTarget
        ? { '/api': { target: proxyTarget, changeOrigin: true } }
        : undefined
    }
  }
})
