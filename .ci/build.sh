set -e
set -x

npm ci
npm run lint:prettier
npm run lint:eslint
npx license-check --ignoreRegex pm2
npx better-npm-audit audit
npm run build
