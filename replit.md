# JiveAI FSM Intake Agent - Project Documentation

## Overview
JiveAI is a headless AI-powered Field Service Management (FSM) intake system that processes unstructured service requests from multiple channels and uses OpenAI GPT-4o to create FSM-compliant job records with intelligent routing to autonomous agents Felix and Quinn.

**Current Status:** Production Ready - SMS intake fully operational with autonomous AI processing and workforce routing.

## Recent Changes

### December 24, 2025 - Complete JiveAI Rebranding
- Successfully reverted all Noetis branding back to JiveAI throughout the entire system
- Updated frontend components: dashboard header, workforce dashboard, and navigation
- Fixed TypeScript interfaces and schema references across all server files
- Corrected AI processing function names and variable references
- System now running successfully with consistent JiveAI branding
- All API endpoints responding properly with Felix and Quinn agent integration active

### Previous Milestones
- Implemented SMS intake with Twilio webhook integration
- Deployed Ava AI processing engine with GPT-4o
- Integrated Felix Agent for emergency dispatch operations
- Integrated Quinn Agent for quote generation and sales opportunities
- Built real-time monitoring dashboard with live metrics

## Project Architecture

### Core Components
- **Ava (AI Intake Agent):** Primary AI processor using OpenAI GPT-4o
- **Felix Agent:** Field Execution & Logistics Integration eXpert for dispatch
- **Quinn Agent:** Quote & Upselling Intelligence Network Navigator
- **Workforce Dashboard:** Real-time monitoring and system status

### Technology Stack
- **Backend:** Node.js + TypeScript + Express.js + Drizzle ORM
- **Frontend:** React + TypeScript + Vite + TanStack Query + shadcn/ui
- **Database:** PostgreSQL (Replit built-in)
- **AI:** OpenAI GPT-4o API
- **Communications:** Twilio (SMS/Voice), SendGrid (Email - planned)

### Current Capabilities
- SMS intake with automatic job creation and routing
- AI-powered service request analysis and classification
- Autonomous routing to Felix (dispatch) or Quinn (quotes) agents
- Real-time performance monitoring and metrics collection
- Database persistence with audit trails

## WHAC Integration Analysis

### Compatibility Assessment
The current JiveAI system architecture provides a solid foundation for WHAC requirements but needs workflow modifications:

**Current:** AI-first autonomous routing
**WHAC Needs:** Human-supervised intake with manual review

### Required Additions for WHAC
1. **Email Integration:** SendGrid webhook for jobs@whac.com
2. **Voice System:** Twilio Voice with IVR and call forwarding
3. **Manual Entry Interface:** Office manager job creation form
4. **Review Queue:** Human approval workflow before job completion
5. **Table Interface:** Jobs list view with filtering and bulk actions
6. **Export Functionality:** CSV export for Excel integration

### Implementation Strategy
- Dual-mode operation supporting both autonomous and supervised workflows
- Configuration-driven routing (auto vs manual review)
- Backward compatibility with existing Felix/Quinn agent integration
- Gradual feature rollout maintaining current system stability

## User Preferences
- Maintain JiveAI branding consistency across all components
- Prioritize system stability and production readiness
- Focus on clear, technical documentation for developer handoffs
- Preserve existing SMS workflow while adding new channels
- Support both autonomous and human-supervised operational modes

## Technical Decisions

### Database Strategy
- Using Replit built-in PostgreSQL for simplicity and reliability
- Drizzle ORM provides type safety and migration management
- Schema designed for FSM compliance with audit capabilities

### AI Processing Architecture
- OpenAI GPT-4o for primary job analysis and classification
- Structured JSON output with Zod validation
- Confidence scoring for routing decisions
- Fallback handling for processing errors

### Frontend Architecture
- React with TypeScript for type safety
- TanStack Query for API state management
- shadcn/ui components for consistent design system
- Responsive design supporting desktop and tablet interfaces

### API Design
- RESTful endpoints with clear resource naming
- Webhook compatibility for external service integration
- Comprehensive error handling and status codes
- Real-time updates via polling (WebSocket upgrade planned)

## Development Guidelines

### Code Quality Standards
- TypeScript strict mode for all components
- Zod schemas for all data validation
- Error boundary components for graceful failure handling
- Comprehensive logging for debugging and monitoring

### Security Practices
- Environment variables for all sensitive configuration
- Input validation on all API endpoints
- Webhook signature verification for external services
- Database connection encryption and pooling

### Performance Considerations
- Database query optimization with proper indexing
- API response caching where appropriate
- OpenAI rate limiting and retry logic
- Frontend bundle optimization with code splitting

## Deployment Configuration

### Environment Requirements
- **Database:** PostgreSQL with Drizzle schema
- **Secrets:** OpenAI API key, Twilio credentials, SendGrid API key
- **Compute:** Node.js 20.x runtime with TypeScript support
- **Networking:** HTTPS endpoints for webhook integration

### Monitoring Setup
- Real-time performance metrics collection
- Error logging with stack trace capture
- API response time tracking
- Database connection health monitoring

## Next Development Priorities

### Immediate (Current Sprint)
1. Complete system documentation and developer handoff materials
2. Validate all existing functionality remains stable
3. Prepare architecture for WHAC integration requirements

### Short Term (Next 2-4 weeks)
1. Email intake implementation with SendGrid
2. Manual job entry interface for office manager use
3. Review queue workflow for human-supervised operations

### Medium Term (1-2 months)
1. Twilio Voice integration with IVR system
2. Call forwarding hierarchy implementation
3. Advanced reporting and analytics dashboard

### Long Term (3+ months)
1. Multi-tenant support for additional clients
2. Advanced AI features (sentiment analysis, priority scoring)
3. Mobile application for field technician access

## Troubleshooting Guide

### Common Issues
- **SMS Processing Delays:** Check OpenAI API response times and Twilio webhook timeouts
- **Database Connection Errors:** Verify environment variables and connection pooling
- **AI Processing Failures:** Monitor confidence scores and implement fallback logic
- **Frontend Loading Issues:** Check API endpoint availability and CORS configuration

### Debugging Tools
- Built-in API tester component for endpoint validation
- Real-time metrics dashboard for performance monitoring
- Database query execution tool for data analysis
- Comprehensive logging with request/response tracking

---

**Maintained by:** Replit Agent  
**Last Updated:** December 24, 2025  
**Version:** 2.0 (Post-JiveAI Rebranding)