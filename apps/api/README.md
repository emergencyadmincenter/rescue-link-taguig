# API

NestJS backend for Rescue Link Taguig.

## Development

```bash
npm install
npm run start:dev
```

## Scripts

- `npm run build` - compile the API for production
- `npm run start` - run the API once in the current environment
- `npm run start:dev` - run with watch mode
- `npm run start:prod` - run the compiled server from `dist`
- `npm run test` - run unit tests
- `npm run test:e2e` - run end-to-end tests from `test/`
- `npm run test:cov` - generate coverage output

## Structure

- `src/` - application source
- `src/generated/prisma/` - generated Prisma client output
- `prisma/` - Prisma schema and migrations
- `test/` - e2e test setup and specs

## Notes

- The `test/` folder is part of the API test setup and should stay if e2e tests remain enabled.
- Keep API secrets in local `.env` files only.
