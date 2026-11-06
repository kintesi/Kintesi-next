import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function dropshippingApiPlugin() {
  return {
    name: 'dropshipping-api-middleware',
    configureServer(server: any) {
      server.middlewares.use('/api/dropshipping-proxy', async (req: any, res: any) => {
        try {
          const parsedUrl = new URL(req.url, 'http://localhost:5173');
          const page = parsedUrl.searchParams.get('page') || '1';
          const upstreamUrl = `https://mohasagor.com.bd/api/reseller/product?page=${page}`;

          const upstreamRes = await fetch(upstreamUrl, {
            headers: {
              'api-key': 'A8niclztH9JtzS4t',
              'secret-key': '2ff380917a11d3a7c97bcf6dddfb8adf38194c7d6b726ab12c4d0d5fb136fef8',
              'Accept': 'application/json',
            },
          });

          const data = await upstreamRes.text();
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.statusCode = upstreamRes.status;
          res.end(data);
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.message || 'Proxy error' }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), dropshippingApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('/react/')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('canvas-confetti') || id.includes('sonner')) {
              return 'vendor-utils';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
