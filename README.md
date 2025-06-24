
# Meridian FSM - Maya Intake Agent

A headless AI-powered intake agent for field service automation that processes unstructured job data from multiple channels and returns enriched JobRecords using OpenAI GPT-4o.

## Features

### Multi-Channel Intake
- **SMS Processing**: Automatic job creation from text messages via Twilio
- **Voice Call Handling**: Phone call recording and transcription to job records
- **Webhook API**: Direct API integration for web forms and FSM systems
- **Email Processing**: Email-to-job conversion (coming soon)
- **Manual Upload**: Direct data entry through dashboard

### AI-Powered Enrichment with Maya
- **Service Type Classification**: AC Repair, Install, Maintenance, Heating, Other
- **Urgency Assessment**: Low, Medium, High priority classification
- **Issue Type Identification**: Specific problem categorization
- **Parts Prediction**: Potential required parts list generation
- **Smart Summaries**: AI-generated job summaries and customer insights

### Enterprise Features
- **Real-time Monitoring**: System health, performance metrics, and alerting
- **PostgreSQL Database**: Secure data persistence with job history
- **Twilio Integration**: Complete SMS and voice call processing
- **Configuration Management**: Dynamic system configuration and webhook setup
- **Performance Analytics**: Processing time, confidence scores, and throughput metrics

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- OpenAI API key
- Twilio account (for SMS/Voice features)

### Environment Variables
```bash
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

### Installation
```bash
npm install
npm run dev
```

## API Endpoints

### Job Intake
```bash
POST /api/intake
Content-Type: application/json

{
  "customer_name": "John Smith",
  "customer_phone": "+1234567890",
  "customer_email": "john@example.com",
  "address": "123 Main St, Anytown USA",
  "description": "AC unit not cooling properly, making loud noises",
  "preferred_time": "Tomorrow morning",
  "source": "SMS"
}
```

### Twilio Webhooks
- `POST /api/twilio/webhook` - SMS message processing
- `POST /api/twilio/voice` - Voice call handling
- `POST /api/twilio/transcription` - Voice transcription processing

### System Management
- `GET /api/system/health` - System health check
- `GET /api/metrics` - Performance metrics
- `GET /api/jobs` - Job records list

## Response Format

```json
{
  "job_id": "job_2025_816523",
  "customer": {
    "name": "John Smith",
    "phone": "+1234567890",
    "email": "john@example.com",
    "address": "123 Main St, Anytown USA"
  },
  "service_type": "AC Repair",
  "description": "AC unit not cooling properly, making loud noises",
  "ai_summary": "Customer's AC unit requires repair due to cooling failure and noise issues",
  "issue_type": "HVAC_COOLING_FAILURE",
  "urgency": "high",
  "potential_parts": ["Compressor", "Condenser Fan Motor", "Refrigerant"],
  "preferred_time": "Tomorrow morning",
  "source": "SMS",
  "submitted_at": "2025-06-11T18:00:19.046Z",
  "status": "pending_intake",
  "ai_confidence": 85,
  "processing_time_ms": 2522
}
```

## Dashboard Features

- **Job Management**: View and manage all intake requests
- **System Monitoring**: Real-time health and performance metrics
- **Twilio Configuration**: SMS and voice service setup
- **API Testing**: Built-in testing tools for integration validation

## Deployment

The application is designed for Replit deployment with automatic scaling and built-in PostgreSQL database support.

1. Set up environment variables in Replit Secrets
2. Deploy using Replit's one-click deployment
3. Configure Twilio webhooks to point to your deployed endpoints

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Processing**: OpenAI GPT-4o API (Maya Agent)
- **Communication**: Twilio SMS and Voice APIs
- **Monitoring**: Built-in metrics collection and alerting

## Maya - The AI Intake Agent

Maya is Meridian FSM's intelligent intake agent that:
- Analyzes unstructured customer requests
- Classifies service types and urgency levels
- Routes jobs to appropriate workforce systems
- Provides intelligent field service routing decisions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please open an issue in the GitHub repository.
