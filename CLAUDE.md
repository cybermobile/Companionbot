# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bytebot is an open-source AI desktop agent that provides a complete virtual desktop environment for AI to perform complex tasks. The system consists of multiple packages in a monorepo structure.

## Architecture

### Package Structure
- **bytebot-ui**: Next.js web interface for task management and desktop viewing
- **bytebot-agent**: NestJS service that handles AI processing and task coordination  
- **bytebot-agent-cc**: Alternative agent implementation with Claude Code integration
- **bytebotd**: NestJS daemon that controls the virtual desktop environment
- **shared**: Shared TypeScript types and utilities across packages

### Key Services
- **Agent Layer**: Processes natural language tasks using AI providers (Anthropic, OpenAI, Google)
- **Desktop Control**: Uses nut.js and computer vision for screen interaction
- **Task Management**: Persistent task storage with Prisma/SQLite
- **Real-time Communication**: WebSocket connections for live updates

## Development Commands

### Build Commands
```bash
# Build all packages
npm run build --prefix packages/bytebot-ui
npm run build --prefix packages/bytebot-agent  
npm run build --prefix packages/bytebotd
npm run build --prefix packages/shared

# The shared package must be built first as other packages depend on it
```

### Development
```bash
# Start UI in development mode
cd packages/bytebot-ui && npm run dev

# Start agent in development mode  
cd packages/bytebot-agent && npm run start:dev

# Start desktop daemon in development mode
cd packages/bytebotd && npm run start:dev
```

### Testing
```bash
# Run tests for each package
cd packages/bytebot-agent && npm test
cd packages/bytebotd && npm test

# Run with coverage
npm run test:cov
```

### Linting
```bash
# Lint individual packages
cd packages/bytebot-ui && npm run lint
cd packages/bytebot-agent && npm run lint
cd packages/bytebotd && npm run lint
cd packages/shared && npm run lint
```

### Database Operations
```bash
# Development database setup
cd packages/bytebot-agent && npm run prisma:dev

# Production database deployment
cd packages/bytebot-agent && npm run prisma:prod
```

## Docker Deployment

The project uses Docker Compose with multiple configuration files:
- `docker/docker-compose.yml`: Main production setup
- `docker/docker-compose.development.yml`: Development environment
- `docker/docker-compose-claude-code.yml`: Claude Code specific configuration
- `docker/docker-compose.core.yml`: Core services only

## Key Dependencies

### AI Providers
- `@anthropic-ai/sdk`: Anthropic Claude integration
- `openai`: OpenAI API client
- `@google/genai`: Google Gemini integration

### Desktop Control  
- `@nut-tree-fork/nut-js`: Cross-platform desktop automation
- `sharp`: Image processing for screenshots
- `uiohook-napi`: Global input capture

### Framework Stack
- NestJS for backend services with modular architecture
- Next.js for frontend with React 19
- Prisma for database ORM
- Socket.io for real-time communication

## Development Notes

### Shared Package Dependency
All packages depend on the shared package which must be built before other packages. The build scripts automatically handle this with `npm run build --prefix ../shared`.

### Database Schema
The agent packages use Prisma with SQLite for task persistence. Run migrations during development and deployment.

### Environment Variables
Required environment variables include AI provider API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY) configured in docker/.env for containerized deployments.