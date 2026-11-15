# YeneSpot Architecture

YeneSpot uses a TypeScript monorepo managed by pnpm and Turborepo.

## Applications
- Web: Next.js in apps/web.
- Mobile: Expo and React Native in apps/mobile.

## Shared Packages
- shared: common types and business categories.
- config: application and brand settings.
- supabase: shared Supabase utilities and types.

## Backend
Supabase will provide PostgreSQL, authentication, storage, Row Level Security and Edge Functions.

## Security
Authorization must be enforced on the server and database.
Privileged roles cannot be assigned by ordinary users.
