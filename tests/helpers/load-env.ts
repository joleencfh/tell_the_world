// Minimal stand-in for `loadEnvConfig` from '@next/env'. That package is
// overridden by @varlock/nextjs-integration (see package.json), and calling it
// under Node on Windows crashes varlock with a libuv assertion. Tests only need
// the raw values from .env.local, so parse the file directly. Like Next, values
// already present in process.env win.
import * as fs from 'fs'
import * as path from 'path'

export function loadEnvConfig(dir: string) {
  const file = path.join(dir, '.env.local')
  if (!fs.existsSync(file)) return

  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (!match) continue
    const [, key, raw] = match
    const quoted = raw.match(/^(['"])(.*)\1$/)
    const value = quoted ? quoted[2] : raw.replace(/\s+#.*$/, '')
    if (process.env[key] === undefined) process.env[key] = value
  }
}
