import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

// Dev-only middleware: save/load portfolio state as a JSON file in the repo
function portfolioSavePlugin() {
  const filePath = path.resolve(__dirname, 'public', 'portfolio-data.json')

  return {
    name: 'portfolio-save',
    configureServer(server: any) {
      server.middlewares.use('/api/save', (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }
        let body = ''
        req.on('data', (chunk: string) => { body += chunk })
        req.on('end', () => {
          try {
            // Validate it's real JSON before writing
            JSON.parse(body)
            fs.writeFileSync(filePath, body, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch {
            res.statusCode = 400
            res.end('Invalid JSON')
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), portfolioSavePlugin()],
})
