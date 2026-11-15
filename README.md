# YeneSpot Platform

YeneSpot is an Ethiopian local business discovery platform.

## Applications
- apps/web — Next.js website
- apps/mobile — Expo mobile application
- packages/shared — Shared types and constants
- packages/config — Shared application configuration
- packages/supabase — Supabase package

## Initial Launch
Jimma, Ethiopia.

## Languages
- English
- Amharic

## Technology
- TypeScript
- Next.js
- React Native
- Expo
- pnpm
- Turborepo
- Supabase
- Tailwind CSS

## Installation
Run from the project root:

corepack pnpm install

## Start Website
corepack pnpm --filter @yenespot/web dev

Open http://localhost:3000.

## Start Mobile
corepack pnpm --filter @yenespot/mobile dev

Scan the QR code using Expo Go.

## Security
Never expose Supabase service-role credentials to client applications.
