// Servidor que imita a Vercel nos testes: entrega o build do app (ou do site) com os
// MESMOS cabeçalhos do vercel.json (incluindo a CSP), devolve index.html para as rotas
// do app e encaminha /api para a API local. Assim os testes pegam qualquer coisa que a
// CSP de produção bloquearia.
//
// Uso: node servidor-producao.mjs <pasta-do-build> <vercel.json> <porta> [url-da-api]
import { createServer, request as httpRequest } from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const [dist, vercelPath, port, apiUrl] = process.argv.slice(2)
const vercel = JSON.parse(readFileSync(vercelPath, 'utf8'))

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.woff2': 'font/woff2',
}

// "source" do vercel.json (ex.: "/(.*)", "/assets/(.*)") vira expressão regular
const rules = (vercel.headers ?? []).map((rule) => ({
  regex: new RegExp(`^${rule.source}$`),
  headers: rule.headers,
}))

const applyHeaders = (path, res) => {
  for (const rule of rules) {
    if (!rule.regex.test(path)) continue
    for (const { key, value } of rule.headers) {
      // Aqui é http (sem cadeado): "upgrade-insecure-requests" e HSTS só valem em https
      const v = key.toLowerCase() === 'content-security-policy'
        ? value.replace(/;\s*upgrade-insecure-requests/, '')
        : value
      if (key.toLowerCase() !== 'strict-transport-security') res.setHeader(key, v)
    }
  }
}

const fileFor = (path) => {
  const file = normalize(join(dist, decodeURIComponent(path)))
  if (!file.startsWith(normalize(dist))) return null
  try {
    return statSync(file).isFile() ? file : null
  } catch {
    return null
  }
}

createServer((req, res) => {
  const path = new URL(req.url, 'http://x').pathname

  if (apiUrl && path.startsWith('/api')) {
    const target = new URL(req.url, apiUrl)
    const proxy = httpRequest(target, { method: req.method, headers: { ...req.headers, host: target.host } }, (upstream) => {
      res.writeHead(upstream.statusCode, upstream.headers)
      upstream.pipe(res)
    })
    proxy.on('error', () => {
      res.writeHead(502)
      res.end()
    })
    req.pipe(proxy)
    return
  }

  const file = fileFor(path) ?? join(dist, 'index.html')
  applyHeaders(path, res)
  res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream')
  res.end(readFileSync(file))
}).listen(Number(port), () => console.log(`Servindo ${dist} em http://localhost:${port}`))
