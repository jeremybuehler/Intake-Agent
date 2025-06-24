# Meridian FSM - Maya Intake Agent

## Overview

This is a comprehensive AI-powered field service intake agent called "Maya" built for Meridian FSM. The system processes unstructured job requests from multiple channels (SMS/Twilio, webhooks, voice calls) and transforms them into enriched, structured job records using OpenAI GPT-4o. The application features a React-based dashboard for monitoring, configuration, and testing.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite with custom configuration

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js
- **Language**: TypeScript with ES Modules
- **API Design**: RESTful endpoints with comprehensive error handling
- **Middleware**: Custom logging, request parsing, and error handling

### Database Architecture
- **Database**: PostgreSQL with connection pooling
- **ORM**: Drizzle ORM with TypeScript-first schema definitions
- **Migrations**: Automated database migrations with Drizzle Kit
- **Tables**: Users, job records, Twilio configuration with proper indexing

## Key Components

### AI Processing Engine (Maya)
- **Primary Agent**: Maya (Meridian Analysis, Yield & Automation agent)
- **AI Model**: OpenAI GPT-4o for job enrichment and classification
- **Processing**: Service type classification, urgency assessment, parts prediction
- **Output**: Structured job records with confidence scores and metadata

### Multi-Channel Intake System
- **SMS Processing**: Twilio webhook integration with automatic job creation
- **Voice Handling**: Call recording, transcription, and job conversion
- **Webhook API**: Direct integration endpoint for web forms and external systems
- **Manual Entry**: Dashboard-based job creation and testing

### Workforce Integration (Future Migration)
- **Felix Agent**: Dispatch queue management and technician routing
- **Quinn Agent**: Quote generation and upselling intelligence
- **Routing Logic**: Intelligent job routing based on complexity and type

### Monitoring & Analytics
- **Real-time Metrics**: Job processing statistics, confidence scores, response times
- **System Health**: Database connectivity, API status, performance monitoring
- **Alerting**: Automated alert system for service degradation
- **Dashboard**: Comprehensive admin interface with multiple tabs

## Data Flow

1. **Input Reception**: Multi-channel job requests received via SMS, voice, or webhook
2. **Data Validation**: Input validation using Zod schemas
3. **AI Processing**: Maya analyzes and enriches job data using GPT-4o
4. **Database Storage**: Structured job records stored in PostgreSQL
5. **Response Generation**: Formatted responses sent back to requesters
6. **Monitoring**: Metrics collected and displayed in real-time dashboard

## External Dependencies

### Core Services
- **OpenAI API**: GPT-4o model for intelligent job processing
- **Twilio**: SMS and voice communication services
- **PostgreSQL**: Primary database for persistent storage
- **SendGrid**: Email service integration (configured but not fully implemented)

### Development & Deployment
- **Replit**: Primary development and hosting platform
- **Node.js**: Runtime environment with ES module support
- **NPM**: Package management and dependency resolution

## Deployment Strategy

### Production Environment
- **Platform**: Replit with auto-scaling deployment
- **Build Process**: Vite frontend build + esbuild backend compilation
- **Environment**: Production configuration with environment variables
- **Scaling**: Automatic scaling based on demand

### Configuration Management
- **Environment Variables**: Secure credential management
- **Dynamic Config**: Runtime configuration updates through dashboard
- **Health Checks**: Automated service monitoring and recovery

### Database Strategy
- **Connection Pooling**: Efficient database connection management
- **Migration System**: Automated schema updates with Drizzle
- **Backup Strategy**: Built on Replit's infrastructure reliability

## Changelog

```
Changelog:
- June 24, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```