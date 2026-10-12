# Module template

Copy this folder to `src/modules/<name>/`, rename files, then mount it in `src/modules/index.js`.

| File               | Responsibility                                                  | May import            |
| ------------------ | --------------------------------------------------------------- | --------------------- |
| `x.routes.js`      | HTTP only: auth, validation, call service, send response        | schema, service       |
| `x.schema.js`      | zod schemas for params/query/body                               | zod                   |
| `x.service.js`     | Business rules, transactions, permission checks                 | repo, other services  |
| `x.repo.js`        | SQL only. Takes optional `db` so callers can pass a transaction | `db/pool.js`          |

Rules: routes never touch SQL, repos never throw HTTP errors, services never see `req`/`res`.
