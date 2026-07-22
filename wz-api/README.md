# wz-api

Backend proxy for the WZ document mobile app.

## Setup

    npm install
    cp .env.example .env   # fill in WooCommerce keys and issuer details
    docker compose up -d
    npm run migrate
    node scripts/seedUser.js you@finespirits.pl "a-strong-password" "Your Name"
    npm start

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
