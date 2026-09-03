set -e
set -x

npm ci
npm run lint:prettier
npm run lint:eslint
npx license-check --ignoreRegex "@nmshd/.*|pm2@7\\.*|@pm2/js-api@0.8\\.*"
npx better-npm-audit audit
npm run build
