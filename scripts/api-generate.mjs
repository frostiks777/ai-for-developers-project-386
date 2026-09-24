import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tspOutput = join(root, 'tsp-output')
const openApiSrc = join(tspOutput, '@typespec', 'openapi3', 'openapi.yaml')
const openApiDest = join(root, 'docs', 'openapi', 'openapi.yaml')
const clientSrc = join(tspOutput, '@typespec', 'http-client-js', 'src')
const clientDest = join(root, 'src', 'api', 'generated')

const tspBin = join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tsp.cmd' : 'tsp',
)

console.log('> tsp compile api/main.tsp')
const compile = spawnSync(tspBin, ['compile', 'api/main.tsp'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
if (compile.status !== 0) {
  console.error('tsp compile failed')
  process.exit(compile.status ?? 1)
}

if (!existsSync(openApiSrc)) {
  console.error(`OpenAPI output not found: ${openApiSrc}`)
  process.exit(1)
}
if (!existsSync(clientSrc)) {
  console.error(`Generated client not found: ${clientSrc}`)
  process.exit(1)
}

await mkdir(dirname(openApiDest), { recursive: true })
await cp(openApiSrc, openApiDest)
console.log(`> ${openApiDest}`)

await rm(clientDest, { recursive: true, force: true })
await mkdir(clientDest, { recursive: true })
await cp(clientSrc, clientDest, { recursive: true })
await writeFile(
  join(clientDest, 'README.md'),
  [
    '# Сгенерированный API-клиент',
    '',
    'Файлы в этой папке созданы командой `npm run api:generate` из `api/main.tsp`.',
    'Вручную не редактировать — правки затрёт следующая генерация.',
    '',
  ].join('\n'),
  'utf8',
)
console.log(`> ${clientDest}`)
