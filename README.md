# CES Notifier Service

A Node.js email and SMS notification service for the Customer Experience Support (CES) system with multilingual templates and SendGrid integration.

> **Note**: This service was created as a separate microservice because DigitalOcean broke SMTP ports, making it impossible to send emails directly from the main application. The SMS functionality is deployed via Mist.io on Render for reliable delivery.

## Features

- 🌍 **Multilingual Support**: English, French, and Kinyarwanda
- 📧 **SendGrid Integration**: Reliable email delivery
- 📱 **SMS Notifications**: SMS support via Mist.io API
- 📋 **Template System**: Pre-built templates for different issue statuses
- 🚀 **RESTful API**: Easy integration with existing systems
- 🛡️ **Security**: Rate limiting, CORS, and input validation
- 📊 **Monitoring**: Health checks and logging
- 🔄 **Bulk Operations**: Send multiple emails and SMS in batches

## Supported Issue Statuses

- `received` - Issue has been received
- `resolved` - Issue has been resolved
- `escalated` - Issue has been escalated to higher level
- `assigned` - Issue has been assigned to a specialist
- `closed` - Issue has been closed
- `in_progress` - Issue is currently being processed

## Supported Languages

- `english` (en)
- `french` (fr, français)
- `kinyarwanda` (rw, kin)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ces-email-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your SendGrid API key and configuration
   ```

4. **Validate Configuration**
   ```bash
   npm run validate-env
   ```

5. **Start the Service**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SENDGRID_API_KEY` | Yes | SendGrid API key | `SG.xyz...` |
| `FROM_EMAIL` | Yes | Sender email address | `support@company.com` |
| `SMS_API_TOKEN` | Yes | Mist.io SMS API token | `785|abc123...` |
| `SMS_SENDER_ID` | Yes | SMS sender identifier | `E-Notifier` |
| `PORT` | No | Server port (default: 3000) | `3000` |
| `NODE_ENV` | No | Environment mode | `development` |
| `CORS_ORIGINS` | No | Allowed origins (comma-separated) | `http://localhost:3000` |
| `TEST_EMAIL` | No | Email for testing configuration | `test@company.com` |

## API Endpoints

### Send Single Email
```http
POST /api/email/send
Content-Type: application/json

{
  "email": "user@example.com",
  "ticketId": "TICKET-123",
  "name": "John Doe",
  "language": "english",
  "subject": "received",
  "issueTitle": "Login Issue",
  "assignedTo": "Support Agent",
  "escalatedTo": "Senior Agent",
  "responseMessage": "We have received your issue."
}
```

### Send Bulk Emails
```http
POST /api/email/send-bulk
Content-Type: application/json

{
  "emails": [
    {
      "email": "user1@example.com",
      "ticketId": "TICKET-123",
      "name": "John Doe",
      "language": "english",
      "subject": "received"
    },
    {
      "email": "user2@example.com",
      "ticketId": "TICKET-124",
      "name": "Jane Smith",
      "language": "french",
      "subject": "resolved"
    }
  ]
}
```

### Send Single SMS
```http
POST /api/sms/send
Content-Type: application/json

{
  "phoneNumber": "+250788123456",
  "ticketId": "TICKET-123",
  "name": "John Doe",
  "language": "english",
  "subject": "received",
  "issueTitle": "Login Issue",
  "assignedTo": "Support Agent",
  "escalatedTo": "Senior Agent",
  "responseMessage": "We have received your issue."
}
```

### Send Bulk SMS
```http
POST /api/sms/send-bulk
Content-Type: application/json

{
  "sms": [
    {
      "phoneNumber": "+250788123456",
      "ticketId": "TICKET-123",
      "name": "John Doe",
      "language": "english",
      "subject": "received"
    },
    {
      "phoneNumber": "+250788789012",
      "ticketId": "TICKET-124",
      "name": "Jane Smith",
      "language": "french",
      "subject": "resolved"
    }
  ]
}
```

### Get Available Templates
```http
GET /api/email/templates
GET /api/sms/templates
```

### Get Specific Template
```http
GET /api/email/template/received/english
GET /api/sms/template/received/english
```

### Validate Email Request
```http
POST /api/email/validate
Content-Type: application/json

{
  "email": "user@example.com",
  "ticketId": "TICKET-123",
  "name": "John Doe",
  "language": "english",
  "subject": "received"
}
```

### Validate SMS Request
```http
POST /api/sms/validate
Content-Type: application/json

{
  "phoneNumber": "+250788123456",
  "ticketId": "TICKET-123",
  "name": "John Doe",
  "language": "english",
  "subject": "received"
}
```

### Test Configuration
```http
POST /api/email/test
Content-Type: application/json

{
  "testEmail": "test@example.com"
}
```

### Test SMS Configuration
```http
POST /api/sms/test
Content-Type: application/json

{
  "testPhoneNumber": "+250788123456"
}
```

### Health Check
```http
GET /health
GET /api/email/health
GET /api/sms/health
```

## Request Parameters

### Required Parameters

**For Email:**
- `email`: Recipient email address
- `ticketId`: Unique ticket identifier
- `name`: Recipient name
- `language`: Language preference (english, french, kinyarwanda)
- `subject`: Issue status (received, resolved, escalated, assigned, closed, in_progress)

**For SMS:**
- `phoneNumber`: Recipient phone number (with country code, e.g., +250788123456)
- `ticketId`: Unique ticket identifier
- `name`: Recipient name
- `language`: Language preference (english, french, kinyarwanda)
- `subject`: Issue status (received, resolved, escalated, assigned, closed, in_progress)

### Optional Parameters
- `assignedTo`: Name of assigned person (required for 'assigned' status)
- `escalatedTo`: Name of escalated person (required for 'escalated' status)
- `issueTitle`: Title of the issue
- `responseMessage`: Additional response message

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "messageId": "abc123",
    "status": "sent",
    "message": "Email sent successfully",
    "ticketId": "TICKET-123",
    "recipient": "user@example.com"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_FAILED",
    "details": ["email is required", "ticketId is invalid"]
  }
}
```

## Email Templates

The service uses predefined templates for each status and language combination. Templates include:

- **Subject Line**: Dynamic with ticket ID and status-specific information
- **Plain Text Body**: Clean, readable format
- **HTML Body**: Styled email with proper formatting

### Template Placeholders

Templates support the following placeholders:
- `{name}`: Recipient name
- `{ticketId}`: Ticket ID
- `{issueTitle}`: Issue title
- `{assignedTo}`: Assigned person name
- `{escalatedTo}`: Escalated person name
- `{responseMessage}`: Custom response message
- `{currentDate}`: Current date and time

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP address
- **Bulk Limit**: Maximum 50 emails/SMS per batch request
- **Headers**: Rate limit information included in response headers
- **SMS Rate Limit**: Subject to Mist.io API rate limits (deployed on Render)

## Error Handling

The service includes comprehensive error handling:

- **Validation Errors**: Invalid input data
- **SendGrid Errors**: Email delivery failures
- **Mist.io SMS Errors**: SMS delivery failures
- **Rate Limit Errors**: Too many requests
- **Configuration Errors**: Missing or invalid environment variables

## Logging

- **Development**: Detailed request/response logging
- **Production**: Error-only logging with request IDs for tracing
- **Health Checks**: Regular monitoring endpoints

## Security Features

- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers
- **Rate Limiting**: Request throttling
- **Input Validation**: Comprehensive data validation
- **Error Sanitization**: No sensitive data in error responses

## Development

### Available Scripts
```bash
npm run dev          # Start with nodemon (auto-restart)
npm run start        # Start production server
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Check code style
npm run lint:fix     # Fix code style issues
```

### Testing the Service

1. **Test Configuration**
   ```bash
   curl -X POST http://localhost:3000/api/email/test \
     -H "Content-Type: application/json" \
     -d '{"testEmail": "your-test@email.com"}'
   ```

2. **Send Test Email**
   ```bash
   curl -X POST http://localhost:3000/api/email/send \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "ticketId": "TEST-123",
       "name": "Test User",
       "language": "english",
       "subject": "received",
       "issueTitle": "Test Issue"
     }'
   ```

3. **Send Test SMS**
   ```bash
   curl -X POST http://localhost:3000/api/sms/send \
     -H "Content-Type: application/json" \
     -d '{
       "phoneNumber": "+250788123456",
       "ticketId": "TEST-123",
       "name": "Test User",
       "language": "english",
       "subject": "received",
       "issueTitle": "Test Issue"
     }'
   ```

4. **Health Check**
   ```bash
   curl http://localhost:3000/health
   ```

## Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
```bash
NODE_ENV=production
SENDGRID_API_KEY=your_production_key
FROM_EMAIL=support@yourcompany.com
SMS_API_TOKEN=your_mist_io_token
SMS_SENDER_ID=E-Notifier
CORS_ORIGINS=https://yourdomain.com
PORT=3000
```

### Deployment Architecture
- **Email Service**: Deployed on your preferred platform (DigitalOcean, AWS, etc.)
- **SMS Service**: Deployed via Mist.io on Render for reliable SMS delivery
- **Why Separate Services**: DigitalOcean broke SMTP ports, necessitating this microservice architecture

## Monitoring

### Health Check Endpoints
- `GET /health` - Basic health check
- `GET /api/email/health` - Email service specific health check
- `GET /api/sms/health` - SMS service specific health check

### Metrics Available
- Service uptime
- Configuration status
- SendGrid connectivity
- Mist.io SMS connectivity (via Render)
- Rate limiting status

## Troubleshooting

### Common Issues

1. **SendGrid API Key Issues**
    - Ensure API key starts with "SG."
    - Verify API key has mail send permissions
    - Check SendGrid account status

2. **Email Not Received**
    - Check spam folder
    - Verify recipient email address
    - Check SendGrid activity dashboard

3. **SMS Not Received**
    - Verify phone number format (include country code)
    - Check Mist.io account status and balance
    - Verify SMS service is deployed on Render
    - Check SMS delivery logs

4. **Template Not Found**
    - Verify status name matches supported statuses
    - Check language code format
    - Use `GET /api/email/templates` or `GET /api/sms/templates` to see available options

5. **Rate Limiting**
    - Implement exponential backoff
    - Consider bulk endpoints for multiple emails/SMS
    - Monitor rate limit headers
    - Check Mist.io API rate limits for SMS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request



## Support

For issues and questions:
- Create an issue in the repository
- Contact the CES development team
- Check the health endpoints for service status
