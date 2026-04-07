import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import http from 'http'
import https from 'https'

// configureServer is a plugin hook, NOT a server config option.
// It must live inside a plugin object in the plugins array.
function haProxyPlugin() {
  return {
    name: 'ha-proxy',
    configureServer(server) {
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
          target = new URL(req.url || '/', haUrl)
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: `Invalid URL: ${e.message}` }))
          return
        }

        console.log(`[HA Proxy] ${req.method} ${target.href}`)

        const lib = target.protocol === 'https:' ? https : http

        // Strip browser-specific headers that confuse HA
        const skip = new Set(['host', 'x-ha-url', 'origin', 'referer',
          'sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site',
          'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform', 'transfer-encoding'])
        const headers = {}
        for (const [k, v] of Object.entries(req.headers)) {
          if (!skip.has(k.toLowerCase())) headers[k] = v
        }
        headers['host'] = target.host

        const proxyReq = lib.request(
          {
            hostname: target.hostname,
            port: target.port || (target.protocol === 'https:' ? 443 : 80),
            path: target.pathname + (target.search || ''),
            method: req.method,
            headers,
          },
          (proxyRes) => {
            console.log(`[HA Proxy] → ${proxyRes.statusCode}`)
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

        // GET/HEAD have no body — pipe() won't end the request automatically
        if (req.method === 'GET' || req.method === 'HEAD') {
          proxyReq.end()
        } else {
          req.pipe(proxyReq)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), haProxyPlugin()],
  server: {
    port: 3000,
    host: true,
  },
})
