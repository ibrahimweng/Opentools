// Builds the site into dist/: the page and its assets as they are, and the
// Sanity studio at dist/studio. Run by Vercel on every push.
//
// Each asset link in index.html carries ?v= with a hash of the file, so a
// browser holding an old copy fetches the new one as soon as it changes.
import {execSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

rmSync(dist, {recursive: true, force: true})
mkdirSync(dist)
for (const item of ['assets', 'media']) {
  if (existsSync(join(root, item))) cpSync(join(root, item), join(dist, item), {recursive: true})
}

const html = readFileSync(join(root, 'index.html'), 'utf8').replace(
  /(assets\/[\w./-]+\.(?:css|js))(?:\?v=[0-9a-f]+)?"/g,
  (_, path) => {
    const hash = createHash('sha1').update(readFileSync(join(root, path))).digest('hex').slice(0, 8)
    return `${path}?v=${hash}"`
  },
)
writeFileSync(join(dist, 'index.html'), html)

execSync('npx sanity build ../dist/studio --yes', {cwd: join(root, 'studio'), stdio: 'inherit'})
console.log('Built dist/ and dist/studio/')
