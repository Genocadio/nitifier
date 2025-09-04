require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { validateEnvironmentConfig } = require('./validators');

// Import routes
const emailRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting to work correctly behind reverse proxies
app.set('trust proxy', true);

// Validate environment configuration on startup
const envValidation = validateEnvironmentConfig();
if (!envValidation.isValid) {
    console.error('Environment configuration errors:');
    envValidation.errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
}

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400 // Only log errors in production
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (for development)
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Add request ID middleware for tracing
app.use((req, res, next) => {
    req.requestId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    res.set('X-Request-ID', req.requestId);
    next();
});

// Health check endpoint (before other routes)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/api', emailRoutes);

// Root endpoint with API information
app.get('/', (req, res) => {
    res.status(200).json({
        name: 'CES Email Service',
        version: process.env.npm_package_version || '1.0.0',
        description: 'Email service for Customer Experience Support system',
        endpoints: {
            health: 'GET /health',
            email: {
                send: 'POST /api/email/send',
                sendBulk: 'POST /api/email/send-bulk',
                templates: 'GET /api/email/templates',
                template: 'GET /api/email/template/:status/:language',
                validate: 'POST /api/email/validate',
                test: 'POST /api/email/test',
                health: 'GET /api/email/health'
            },
            sms: {
                send: 'POST /api/sms/send',
                sendBulk: 'POST /api/sms/send-bulk',
                templates: 'GET /api/sms/templates',
                template: 'GET /api/sms/template/:status/:language',
                validate: 'POST /api/sms/validate',
                test: 'POST /api/sms/test',
                health: 'GET /api/sms/health'
            }
        },
        documentation: {
            supportedStatuses: ['received', 'resolved', 'escalated', 'assigned', 'closed', 'in_progress', 'waiting_for_user_response', 'overdue', 'incomplete'],
            supportedLanguages: ['english', 'french', 'kinyarwanda'],
            rateLimit: '100 requests per 15 minutes per IP'
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Endpoint not found',
            code: 'NOT_FOUND',
            path: req.originalUrl,
            method: req.method
        }
    });
});

// Global error handling middleware
app.use((error, req, res, next) => {
    console.error(`Error ${req.requestId}:`, error);
    
    // Don't send stack trace in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.status(error.status || 500).json({
        success: false,
        error: {
            message: error.message || 'Internal server error',
            code: error.code || 'INTERNAL_ERROR',
            requestId: req.requestId,
            ...(isDevelopment && { stack: error.stack })
        }
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit in production, just log
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`
🚀 CES Email Service started successfully!
   
📧 Server running on: http://localhost:${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📝 API Documentation: http://localhost:${PORT}/
💊 Health Check: http://localhost:${PORT}/health

📋 Available Endpoints:
   Email:
   • POST /api/email/send - Send single email
   • POST /api/email/send-bulk - Send bulk emails
   • GET  /api/email/templates - Get available templates
   • GET  /api/email/template/:status/:language - Get specific template
   • POST /api/email/validate - Validate email request
   • POST /api/email/test - Test configuration
   • GET  /api/email/health - Service health check
   
   SMS:
   • POST /api/sms/send - Send single SMS
   • POST /api/sms/send-bulk - Send bulk SMS
   • GET  /api/sms/templates - Get available templates
   • GET  /api/sms/template/:status/:language - Get specific template
   • POST /api/sms/validate - Validate SMS request
   • POST /api/sms/test - Test configuration
   • GET  /api/sms/health - Service health check

🔧 Configuration:
   Email:
   • SendGrid API Key: ${process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Missing'}
   • From Email: ${process.env.FROM_EMAIL || '❌ Missing'}
   
   SMS:
   • SMS API Token: ${process.env.SMS_API_TOKEN ? '✅ Set' : '❌ Missing'}
   • SMS Sender ID: ${process.env.SMS_SENDER_ID || 'E-Notifier'}
   
   General:
   • CORS Origins: ${process.env.CORS_ORIGINS || 'All origins allowed'}
   • Rate Limit: 100 requests per 15 minutes per IP

📚 Supported:
   • Languages: english, french, kinyarwanda
   • Statuses: received, resolved, escalated, assigned, closed, in_progress, waiting_for_user_response, overdue, incomplete
    `);
});

module.exports = app;