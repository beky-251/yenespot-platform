# Deployment Plan

## Web
The Next.js application is intended for Vercel or compatible hosting.

## Mobile
The Expo application will use EAS Build for Android and iOS.

## Backend
Supabase will host the database, authentication, storage and server functions.

## Before Launch
- Configure production environment variables.
- Apply and verify database migrations.
- Review Row Level Security policies.
- Configure the production domain.
- Test authentication and authorization.
- Verify storage permissions.
- Test Android and iOS builds.
- Configure monitoring and backups.
