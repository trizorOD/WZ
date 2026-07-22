# wz-api

Backend proxy for the WZ document mobile app.

## Setup

    npm install
    cp .env.example .env   # fill in WooCommerce keys and issuer details

Get a Postgres database and point `DATABASE_URL` in `.env` at it. Either:

    docker compose up -d          # local Postgres, or
    # ...point DATABASE_URL at an existing instance instead (e.g. Supabase) —
    # use the connection pooler host if the direct host doesn't resolve on
    # your network, and remember the password must be URL-encoded.

Tables are created in their own `wz` schema (not `public`), so this project
can share a database with unrelated data.

    npm run migrate
    node scripts/seedUser.js you@finespirits.pl "a-strong-password" "Your Name"
    npm start

`npm run migrate` is not idempotent (the SQL lacks `IF NOT EXISTS` on the
table statements), so re-running it against an already-migrated database
will fail.

## Manual smoke test

    TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"you@finespirits.pl","password":"a-strong-password"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

    curl -s http://localhost:3001/products?search=whisky \
      -H "Authorization: Bearer $TOKEN"

    curl -s http://localhost:3001/clients/lookup/1133105750 \
      -H "Authorization: Bearer $TOKEN"

## Tests

    npm test
