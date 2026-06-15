import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const DATA_DIR = path.resolve(__dirname, 'data')
const IMAGES_DIR = path.resolve(DATA_DIR, 'images')
const DATA_FILE = path.resolve(DATA_DIR, 'portfolio-data.json')

/** Map an image mime subtype to a file extension */
function mimeToExt(mime: string): string {
  const subtype = (mime.split('/')[1] || 'png').toLowerCase()
  if (subtype === 'jpeg') return 'jpg'
  if (subtype === 'svg+xml') return 'svg'
  // Strip any "+suffix" (e.g. future "image/foo+bar") and any params
  return subtype.replace(/\+.*$/, '')
}

/** Extract base64 data URIs from any JSON value, save as files, replace with paths */
function extractImages(obj: any): any {
  if (typeof obj === 'string' && obj.startsWith('data:image')) {
    // Capture the FULL mime type (e.g. image/svg+xml) and the base64 payload.
    // Note: subtypes can contain non-word chars like "+xml", so match up to ";base64,".
    const m = obj.match(/^data:([^;,]+);base64,(.*)$/s)
    if (!m) return obj // not a base64 data URI we can extract — leave untouched
    const mime = m[1]
    const base64 = m[2]
    // Hash the full original string for a stable filename (unchanged across runs)
    const hash = crypto.createHash('md5').update(obj).digest('hex').slice(0, 12)
    const ext = mimeToExt(mime)
    const filename = `${hash}.${ext}`
    const filePath = path.join(IMAGES_DIR, filename)

    // Write the file if it doesn't already exist
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, Buffer.from(base64, 'base64'))
    }

    return `/data/images/${filename}`
  }
  if (Array.isArray(obj)) return obj.map(extractImages)
  if (obj && typeof obj === 'object') {
    const out: any = {}
    for (const [k, v] of Object.entries(obj)) out[k] = extractImages(v)
    return out
  }
  return obj
}

// Dev-only middleware: save/load portfolio state as a JSON file in the repo
function portfolioSavePlugin() {
  return {
    name: 'portfolio-save',
    configureServer(server: any) {
      // Serve data/ directory (portfolio-data.json + images/) without triggering HMR
      server.middlewares.use('/data', (req: any, res: any, next: any) => {
        const filePath = path.join(DATA_DIR, decodeURIComponent(req.url || ''))
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          res.setHeader('Cache-Control', 'no-cache')
          const ext = path.extname(filePath).toLowerCase()
          const mimeMap: Record<string, string> = { '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml' }
          if (mimeMap[ext]) res.setHeader('Content-Type', mimeMap[ext])
          fs.createReadStream(filePath).pipe(res)
        } else {
          next()
        }
      })

      server.middlewares.use('/api/save', (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        // Accumulate body chunks (can be large with base64 images)
        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => { chunks.push(chunk) })
        req.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString('utf-8')
            const data = JSON.parse(body)

            // Ensure images directory exists
            fs.mkdirSync(IMAGES_DIR, { recursive: true })

            // Extract base64 images to files, replace with paths
            const cleaned = extractImages(data)

            fs.writeFileSync(DATA_FILE, JSON.stringify(cleaned, null, 2), 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch (err: any) {
            res.statusCode = 400
            res.end(`Save failed: ${err.message}`)
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), portfolioSavePlugin()],
})
