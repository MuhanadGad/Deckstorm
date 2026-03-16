# test

This file provides context about the project for AI assistants.

## Project Overview

- **Ecosystem**: Typescript

## Tech Stack

- **Runtime**: node
- **Package Manager**: npm

### Frontend

- Framework: react-vite
- CSS: tailwind
- UI Library: shadcn-ui
- State: redux-toolkit

### Backend

- Framework: express
- Validation: zod

### Database

- Database: postgres
- ORM: prisma

### Authentication

- Provider: better-auth

### Additional Features

- AI: vercel-ai
- Email: nodemailer
- Logging: pino

## Project Structure

```
test/
├── apps/
│   ├── web/         # Frontend application
│   └── server/      # Backend API
├── packages/
│   ├── auth/        # Authentication
│   └── db/          # Database schema
```

## Common Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push database schema
- `npm run db:studio` - Open database UI

## Maintenance

Keep CLAUDE.md updated when:

- Adding/removing dependencies
- Changing project structure
- Adding new features or services
- Modifying build/dev workflows

AI assistants should suggest updates to this file when they notice relevant changes.
