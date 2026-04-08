import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import http from 'http'
import https from 'https'

function haProxyPlugin() {
  return {
    name: 'ha-proxy',
    configureServer(server) {
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

        // Collect entire request body FIRST, then forward.
        // This avoids pipe timing issues and lets us set Content-Length correctly.
        const bodyChunks = []
        req.on('data', chunk => bodyChunks.push(chunk))
        req.on('error', err => {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: err.message }))
        })
        req.on('end', () => {
          const body = Buffer.concat(bodyChunks)

          const skip = new Set(['host', 'x-ha-url', 'origin', 'referer',
            'sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site',
            'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform',
            'transfer-encoding', 'connection'])
          const headers = {}
          for (const [k, v] of Object.entries(req.headers)) {
            if (!skip.has(k.toLowerCase())) headers[k] = v
          }
          headers['host'] = target.host
          if (body.length > 0) {
            headers['content-length'] = String(body.length)
          } else {
            delete headers['content-length']
          }

          const lib = target.protocol === 'https:' ? https : http
          const options = {
            hostname: target.hostname,
            port: target.port || (target.protocol === 'https:' ? 443 : 80),
            path: target.pathname + (target.search || ''),
            method: req.method,
            headers,
          }

          console.log(`[HA Proxy] ${req.method} ${target.href}`)

          const proxyReq = lib.request(options, (proxyRes) => {
            console.log(`[HA Proxy] → ${proxyRes.statusCode}`)
            // Strip hop-by-hop headers from the response
            const resHeaders = {}
            const skipRes = new Set(['transfer-encoding', 'connection', 'keep-alive',
              'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'upgrade'])
            for (const [k, v] of Object.entries(proxyRes.headers)) {
              if (!skipRes.has(k.toLowerCase())) resHeaders[k] = v
            }
            res.writeHead(proxyRes.statusCode, resHeaders)
            proxyRes.pipe(res)
          })

          proxyReq.on('error', (err) => {
            console.error(`[HA Proxy] Error: ${err.message}`)
            if (!res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: `Cannot reach Home Assistant: ${err.message}` }))
            }
          })

          proxyReq.end(body)
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), haProxyPlugin()],
  server: { port: 3000, host: true },
})
