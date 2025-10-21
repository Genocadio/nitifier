# Trip Notifications API

This document describes the trip notification endpoints that allow sending trip-related emails and SMS messages.

## Overview

The trip notification system supports two types of notifications:
- **Trip Remaining Time**: Notifies travelers about remaining time to destination
- **Trip Arrival Notice**: Notifies travelers when they have arrived at their destination

## Endpoints

### 1. Send Trip Notification

**POST** `/api/trip/send`

Send a single trip notification via email and/or SMS.

#### Request Body

```json
{
  "email": "traveler@example.com",           // Optional - Recipient email
  "phoneNumber": "250788606765",             // Optional - Recipient phone (without + or 00)
  "name": "John Doe",                        // Required - Recipient name
  "language": "english",                     // Required - Language (english, french, kinyarwanda)
  "notificationType": "trip_remaining_time", // Required - trip_remaining_time or trip_arrival_notice
  "destinationName": "Kigali Airport",       // Required - Destination name
  "remainingTime": "2 hours",               // Required for trip_remaining_time
  "tripId": "TRIP123"                       // Optional - Trip ID
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "destinationName": "Kigali Airport",
    "notificationType": "trip_remaining_time",
    "tripId": "TRIP123",
    "results": {
      "email": {
        "success": true,
        "messageId": "abc123",
        "status": "sent",
        "message": "Trip email sent successfully"
      },
      "sms": {
        "success": true,
        "status": "sent",
        "message": "Trip SMS sent successfully",
        "phoneNumber": "250788606765"
      }
    }
  }
}
```

### 2. Send Bulk Trip Notifications

**POST** `/api/trip/send-bulk`

Send multiple trip notifications in batch (max 20 per request).

#### Request Body

```json
{
  "trips": [
    {
      "email": "traveler1@example.com",
      "phoneNumber": "250788606765",
      "name": "John Doe",
      "language": "english",
      "notificationType": "trip_remaining_time",
      "destinationName": "Kigali Airport",
      "remainingTime": "2 hours",
      "tripId": "TRIP123"
    },
    {
      "email": "traveler2@example.com",
      "name": "Jane Smith",
      "language": "french",
      "notificationType": "trip_arrival_notice",
      "destinationName": "Paris Airport",
      "tripId": "TRIP124"
    }
  ]
}
```

### 3. Validate Trip Request

**POST** `/api/trip/validate`

Validate trip notification request without sending.

#### Request Body

Same as `/api/trip/send` endpoint.

#### Response

```json
{
  "success": true,
  "data": {
    "isValid": true,
    "message": "Trip notification request is valid"
  }
}
```

### 4. Get Trip Templates

**GET** `/api/trip/templates`

Get available trip notification templates.

#### Response

```json
{
  "success": true,
  "data": {
    "availableNotificationTypes": ["trip_remaining_time", "trip_arrival_notice"],
    "availableLanguages": ["english", "french", "kinyarwanda"],
    "emailTemplates": [
      {
        "status": "trip_remaining_time",
        "languages": ["english", "french", "kinyarwanda"]
      },
      {
        "status": "trip_arrival_notice",
        "languages": ["english", "french", "kinyarwanda"]
      }
    ],
    "smsTemplates": [
      {
        "status": "trip_remaining_time",
        "languages": ["english", "french", "kinyarwanda"]
      },
      {
        "status": "trip_arrival_notice",
        "languages": ["english", "french", "kinyarwanda"]
      }
    ]
  }
}
```

### 5. Get Specific Trip Template

**GET** `/api/trip/template/:type/:language`

Get specific trip template by notification type and language.

#### Parameters

- `type`: Notification type (trip_remaining_time, trip_arrival_notice)
- `language`: Language (english, french, kinyarwanda)

#### Response

```json
{
  "success": true,
  "data": {
    "notificationType": "trip_remaining_time",
    "language": "english",
    "emailTemplate": {
      "subject": "Trip Update - {destinationName}",
      "body": "Hello {name},...",
      "hasHtml": true
    },
    "smsTemplate": {
      "message": "Hi {name}, your trip to {destinationName} is on track. ETA: {remainingTime}. Safe travels!",
      "characterCount": 95,
      "parts": 1,
      "isMultiPart": false
    }
  }
}
```

## Validation Rules

### Required Fields
- `name`: Recipient name (1-100 characters, letters, spaces, hyphens, apostrophes only)
- `language`: Language preference (english, french, kinyarwanda)
- `notificationType`: Trip notification type (trip_remaining_time, trip_arrival_notice)
- `destinationName`: Destination name (1-100 characters, letters, spaces, hyphens, apostrophes, common punctuation)

### Contact Methods
- At least one of `email` or `phoneNumber` must be provided
- `email`: Valid email address format
- `phoneNumber`: 7-15 digits (non-digit characters will be removed)

### Conditional Fields
- `remainingTime`: Required for `trip_remaining_time` notifications
  - Format: "2 hours", "30 minutes", "1 hour 30 minutes", etc.

### Optional Fields
- `tripId`: Trip identifier (max 50 characters)

## Notification Types

### trip_remaining_time
Notifies travelers about remaining time to their destination.

**Required fields**: `remainingTime`

**Example**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "language": "english",
  "notificationType": "trip_remaining_time",
  "destinationName": "Kigali Airport",
  "remainingTime": "2 hours"
}
```

### trip_arrival_notice
Notifies travelers when they have arrived at their destination.

**Example**:
```json
{
  "name": "Jane Smith",
  "phoneNumber": "250788606765",
  "language": "french",
  "notificationType": "trip_arrival_notice",
  "destinationName": "Paris Airport"
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_FAILED",
    "details": [
      "Either email or phoneNumber is required",
      "remainingTime is required for trip_remaining_time notifications"
    ]
  }
}
```

### Template Not Found (404)
```json
{
  "success": false,
  "error": {
    "message": "Template not found for notification type 'invalid_type' and language 'english'",
    "code": "TEMPLATE_NOT_FOUND"
  }
}
```

### Internal Server Error (500)
```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "code": "INTERNAL_ERROR"
  }
}
```

## Rate Limiting

Trip notification endpoints are subject to the same rate limiting as other email endpoints:
- 100 requests per 15 minutes per IP address

## Examples

### Send Email Only
```bash
curl -X POST http://localhost:3000/api/trip/send \
  -H "Content-Type: application/json" \
  -d '{
    "email": "traveler@example.com",
    "name": "John Doe",
    "language": "english",
    "notificationType": "trip_remaining_time",
    "destinationName": "Kigali Airport",
    "remainingTime": "2 hours"
  }'
```

### Send SMS Only
```bash
curl -X POST http://localhost:3000/api/trip/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "250788606765",
    "name": "Jane Smith",
    "language": "french",
    "notificationType": "trip_arrival_notice",
    "destinationName": "Paris Airport"
  }'
```

### Send Both Email and SMS
```bash
curl -X POST http://localhost:3000/api/trip/send \
  -H "Content-Type: application/json" \
  -d '{
    "email": "traveler@example.com",
    "phoneNumber": "250788606765",
    "name": "John Doe",
    "language": "english",
    "notificationType": "trip_remaining_time",
    "destinationName": "Kigali Airport",
    "remainingTime": "2 hours",
    "tripId": "TRIP123"
  }'
```
