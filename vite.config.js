import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import http from 'http'
import https from 'https'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    configureServer(server) {
      // Dynamic reverse-proxy mounted at /ha-proxy.
      // Connect strips the /ha-proxy prefix so req.url is already /api/...
      // The real HA base URL comes from the X-HA-URL request header.
      server.middlewares.use('/ha-proxy', (req, res) => {
        const haUrl = req.headers['x-ha-url']
        if (!haUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Missing X-HA-URL header' }))
          return
        }

        let target
        try {
          target = new URL(req.url, haUrl)
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid target URL' }))
          return
        }

        const lib = target.protocol === 'https:' ? https : http
        const headers = { ...req.headers, host: target.host }
        delete headers['x-ha-url']

        const proxyReq = lib.request(
          {
            hostname: target.hostname,
            port: target.port || (target.protocol === 'https:' ? 443 : 80),
            path: target.pathname + target.search,
            method: req.method,
            headers,
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers)
            proxyRes.pipe(res)
          }
        )

        proxyReq.on('error', (err) => {
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: err.message }))
          }
        })

        req.pipe(proxyReq)
      })
    },
  },
})
