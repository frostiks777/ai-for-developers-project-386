import { spawn } from 'node:child_process'

const jobs = [
  { name: 'web', cmd: 'npm run dev', color: '\x1b[36m' },
  { name: 'api', cmd: 'npm run server:dev', color: '\x1b[35m' },
]

const reset = '\x1b[0m'
const children = []

function log(name, color, data) {
  for (const line of String(data).split(/\r?\n/)) {
    if (line.trim() === '') continue
    process.stdout.write(`${color}[${name}]${reset} ${line}\n`)
  }
}

for (const { name, cmd, color } of jobs) {
  const child = spawn(cmd, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] })
  children.push(child)
  child.stdout.on('data', (d) => log(name, color, d))
  child.stderr.on('data', (d) => log(name, color, d))
  child.on('exit', (code, signal) => {
    console.log(`[${name}] exit code=${code} signal=${signal}`)
    if (code !== 0 && code !== null) {
      for (const c of children) c.kill()
      process.exit(code)
    }
  })
}

console.log('web: http://127.0.0.1:5173  api: http://127.0.0.1:3000  (Ctrl+C — остановить оба)')

const shutdown = () => {
  for (const c of children) c.kill('SIGINT')
}
process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
