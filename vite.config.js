import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createProxyMiddleware } from 'http-proxy-middleware'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    configureServer(server) {
      // Dynamic reverse-proxy: forwards /ha-proxy/* to the HA instance.
      // The client sends the real HA base URL in the X-HA-URL header so we
      // can proxy to whatever IP the user configured without restarting Vite.
      server.middlewares.use('/ha-proxy', (req, res, next) => {
        const targetUrl = req.headers['x-ha-url']
        if (!targetUrl) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Missing X-HA-URL header' }))
          return
        }

        const proxy = createProxyMiddleware({
          target: targetUrl,
          changeOrigin: true,
          pathRewrite: { '^/ha-proxy': '' },
          on: {
            error(err, _req, res) {
              res.writeHead(502, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: err.message }))
            },
          },
        })

        proxy(req, res, next)
      })
    },
  },
})
