# Discover Nashik

Mobile-first discovery platform for Nashik visitors, pilgrims, and residents. The first release focuses on trustworthy places, map discovery, search, and Kumbh-relevant filters.

## Architecture

```text
apps/web  → Next.js visitor website
apps/api  → Express REST API + MongoDB
```

The API is deliberately independent of the website so a future React Native/Expo app can reuse the same endpoints and database.

## Local setup

1. Install packages from this directory: `npm install`
2. Copy `apps/api/.env.example` to `apps/api/.env` and add your MongoDB connection string.
3. Copy `apps/web/.env.local.example` to `apps/web/.env.local`.
4. Add initial demonstration data: `npm run seed`
5. Start both services in separate terminals:

   ```text
   npm run dev:api
   npm run dev:web
   ```

The website runs at `http://localhost:3000`; the API runs at `http://localhost:4000`.

## Safety of visitor information

Seeded records have `verificationStatus: "community"`. Confirm a place's coordinates, opening times, contact information and facilities before changing it to `"verified"`. Do not publish emergency or crowd information without an official source.
