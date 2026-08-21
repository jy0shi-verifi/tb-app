// Build and deploy the in-progress rebuild to its OWN Cloudflare Pages project.
//
//   npm run deploy:v2   ->  https://tb2.joshua-birch.co.uk
//
// This never touches the live app (project `tb-app`, tb.joshua-birch.co.uk).
// APP_VARIANT=v2 renames the PWA to "Tactical Barbell v2" so two installed
// copies are tellable apart on the home screen; the two sites are separate
// origins, so their IndexedDB training data is isolated from each other.
import { execFileSync } from 'node:child_process'

const PROJECT = 'tb-app-v2'
const env = { ...process.env, APP_VARIANT: 'v2' }

const run = (cmd, args) =>
  execFileSync(cmd, args, { stdio: 'inherit', env, shell: process.platform === 'win32' })

console.log('\n▸ Building the v2 bundle…')
run('npx', ['tsc', '-b'])
run('npx', ['vite', 'build'])

console.log(`\n▸ Deploying to Pages project "${PROJECT}"…`)
run('npx', ['wrangler', 'pages', 'deploy', 'dist', '--project-name', PROJECT, '--branch', 'main'])

console.log('\n✅ Live at https://tb2.joshua-birch.co.uk (and https://tb-app-v2.pages.dev)\n')
