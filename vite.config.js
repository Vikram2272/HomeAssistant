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
      // Dynamic reverse-proxy at /ha-proxy.
      // Connect strips the prefix so req.url is already /api/...
      // The real HA base URL is sent in the X-HA-URL request header.
      server.middlewares.use('/ha-proxy', (req, res) => {
        const haUrl = req.headers['x-ha-url']
        if (!haUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Missing X-HA-URL header' }))
          return
        }

        let target
        try {
          target = new URL(req.url || '/', haUrl)
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: `Invalid URL: ${e.message}` }))
          return
        }

        console.log(`[HA Proxy] ${req.method} ${target.href}`)

        const lib = target.protocol === 'https:' ? https : http

        // Pass auth + content headers; drop browser-specific ones that confuse HA
        const headers = {}
        const skip = new Set(['host', 'x-ha-url', 'origin', 'referer',
          'sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site', 'sec-ch-ua',
          'sec-ch-ua-mobile', 'sec-ch-ua-platform'])
        for (const [k, v] of Object.entries(req.headers)) {
          if (!skip.has(k.toLowerCase())) headers[k] = v
        }
        headers['host'] = target.host
        // Remove transfer-encoding to avoid double-chunking
        delete headers['transfer-encoding']

        const proxyReq = lib.request(
          {
            hostname: target.hostname,
            port: target.port || (target.protocol === 'https:' ? 443 : 80),
            path: target.pathname + (target.search || ''),
            method: req.method,
            headers,
          },
          (proxyRes) => {
            console.log(`[HA Proxy] Response: ${proxyRes.statusCode}`)
            res.writeHead(proxyRes.statusCode, proxyRes.headers)
            proxyRes.pipe(res)
          }
        )

        proxyReq.on('error', (err) => {
          console.error(`[HA Proxy] Error: ${err.message}`)
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: `Cannot reach Home Assistant: ${err.message}` }))
          }
        })

        // GET / HEAD have no body — must call end() explicitly, not pipe()
        if (req.method === 'GET' || req.method === 'HEAD') {
          proxyReq.end()
        } else {
          req.pipe(proxyReq)
        }
      })
    },
  },
})
