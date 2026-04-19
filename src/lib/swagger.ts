/**
 * OpenAPI 3.0 specification for the VMS API.
 * Served at /api/docs via Swagger UI.
 */
export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Smart Campus VMS API",
    version: "1.0.0",
    description:
      "Intelligent Visitor Management System — RESTful API for managing campus visitor entry, exit, and security.",
    contact: {
      name: "CIMAGE Team",
    },
  },
  servers: [
    {
      url: process.env.NEXTAUTH_URL || "http://localhost:3000",
      description: "Development Server",
    },
  ],
  tags: [
    { name: "Visitors", description: "Visitor registration and pass management" },
    { name: "Visits", description: "Check-in, check-out, and status tracking" },
    { name: "Blacklist", description: "Visitor blacklist management" },
    { name: "System", description: "Health check and system status" },
    { name: "Hosts", description: "Host management" },
  ],
  paths: {
    "/api/visitors/register": {
      post: {
        tags: ["Visitors"],
        summary: "Register a new visitor",
        description:
          "Creates or reuses a visitor record, generates QR token and OTP, creates a visit with PENDING status, stores OTP in Redis with 5-minute TTL, sends OTP via Gmail.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VisitorRegisterRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Visitor registered successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VisitorRegisterResponse" },
              },
            },
          },
          "403": {
            description: "Visitor is blacklisted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Active visit already exists for this email today",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "422": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" },
              },
            },
          },
        },
      },
    },
    "/api/visits/checkin": {
      post: {
        tags: ["Visits"],
        summary: "Check-in visitor via QR token or OTP",
        description:
          "Finds visit by QR token or OTP, validates blacklist and schedule window (±2 hours), updates status to CHECKED_IN, adds to Redis active set.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CheckinRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Checked in successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CheckinResponse" },
              },
            },
          },
          "403": { description: "Visitor is blacklisted" },
          "404": { description: "Visit not found" },
          "409": { description: "Already checked in" },
        },
      },
    },
    "/api/visits/checkout": {
      post: {
        tags: ["Visits"],
        summary: "Check-out visitor",
        description:
          "Updates status to CHECKED_OUT, calculates duration, removes from Redis active set.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CheckoutRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Checked out successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CheckoutResponse" },
              },
            },
          },
          "404": { description: "Visit not found" },
        },
      },
    },
    "/api/visits/active": {
      get: {
        tags: ["Visits"],
        summary: "Get all active visitors",
        description:
          "Fetches active visitor IDs from Redis set, queries full visit data from PostgreSQL, sorted by checkedInAt descending.",
        responses: {
          "200": {
            description: "Active visitors list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    activeVisitors: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ActiveVisit" },
                    },
                    count: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/visitors/{id}/pass": {
      get: {
        tags: ["Visitors"],
        summary: "Get visitor's QR pass and OTP",
        description:
          "Returns QR code as base64 data URL, OTP, and visit details for the visitor's latest visit.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Visit ID",
          },
        ],
        responses: {
          "200": {
            description: "Pass details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PassResponse" },
              },
            },
          },
          "404": { description: "Visit not found" },
        },
      },
    },
    "/api/visitors/{id}/history": {
      get: {
        tags: ["Visitors"],
        summary: "Get visitor's visit history",
        description:
          "Paginated visit history with audit log entries. Supports page, limit, and status filter.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Visitor ID",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "PENDING",
                "APPROVED",
                "CHECKED_IN",
                "CHECKED_OUT",
                "OVERSTAYED",
                "DENIED",
              ],
            },
          },
        ],
        responses: {
          "200": {
            description: "Paginated visit history",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HistoryResponse" },
              },
            },
          },
        },
      },
    },
    "/api/blacklist": {
      post: {
        tags: ["Blacklist"],
        summary: "Blacklist a visitor",
        description:
          "Creates blacklist record, sets isBlacklisted on visitor, adds to Redis blacklist cache.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BlacklistRequest" },
            },
          },
        },
        responses: {
          "201": { description: "Visitor blacklisted" },
          "404": { description: "Visitor not found" },
          "409": { description: "Already blacklisted" },
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        description:
          "Returns system status including database connectivity, Redis connectivity, and active visitor count.",
        responses: {
          "200": {
            description: "System healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/api/hosts": {
      get: {
        tags: ["Hosts"],
        summary: "List all hosts",
        description: "Returns all campus hosts for the registration form dropdown.",
        responses: {
          "200": {
            description: "Hosts list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    hosts: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Host" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      VisitorRegisterRequest: {
        type: "object",
        required: [
          "fullName",
          "email",
          "phone",
          "hostId",
          "purpose",
          "scheduledAt",
          "expectedDuration",
        ],
        properties: {
          fullName: { type: "string", example: "Rahul Verma" },
          email: {
            type: "string",
            format: "email",
            example: "rahul@gmail.com",
          },
          phone: { type: "string", example: "+91-9123456780" },
          hostId: { type: "string", format: "uuid" },
          purpose: { type: "string", example: "Project Discussion" },
          scheduledAt: {
            type: "string",
            format: "date-time",
            example: "2026-04-20T10:00:00.000Z",
          },
          expectedDuration: {
            type: "number",
            description: "Expected duration in minutes",
            example: 120,
          },
        },
      },
      VisitorRegisterResponse: {
        type: "object",
        properties: {
          visitId: { type: "string", format: "uuid" },
          visitorId: { type: "string", format: "uuid" },
          qrToken: { type: "string" },
          otp: { type: "string", example: "482913" },
          scheduledAt: { type: "string", format: "date-time" },
          hostName: { type: "string" },
          status: { type: "string", example: "PENDING" },
        },
      },
      CheckinRequest: {
        type: "object",
        required: ["token"],
        properties: {
          token: {
            type: "string",
            description: "QR token (UUID) or 6-digit OTP",
          },
        },
      },
      CheckinResponse: {
        type: "object",
        properties: {
          visitId: { type: "string" },
          visitorName: { type: "string" },
          hostName: { type: "string" },
          checkedInAt: { type: "string", format: "date-time" },
          expectedOut: { type: "string", format: "date-time" },
        },
      },
      CheckoutRequest: {
        type: "object",
        required: ["visitId"],
        properties: {
          visitId: { type: "string", format: "uuid" },
        },
      },
      CheckoutResponse: {
        type: "object",
        properties: {
          visitId: { type: "string" },
          duration: { type: "string", example: "2h 30m" },
          checkedOutAt: { type: "string", format: "date-time" },
          message: { type: "string" },
        },
      },
      ActiveVisit: {
        type: "object",
        properties: {
          visitId: { type: "string" },
          visitorName: { type: "string" },
          hostName: { type: "string" },
          checkedInAt: { type: "string", format: "date-time" },
          expectedOut: { type: "string", format: "date-time" },
          isOverstayed: { type: "boolean" },
        },
      },
      PassResponse: {
        type: "object",
        properties: {
          visitId: { type: "string" },
          qrDataUrl: { type: "string", description: "Base64 QR code image" },
          otp: { type: "string" },
          status: { type: "string" },
          visitorName: { type: "string" },
          hostName: { type: "string" },
          scheduledAt: { type: "string", format: "date-time" },
          purpose: { type: "string" },
        },
      },
      HistoryResponse: {
        type: "object",
        properties: {
          visits: { type: "array", items: { type: "object" } },
          pagination: {
            type: "object",
            properties: {
              page: { type: "number" },
              limit: { type: "number" },
              total: { type: "number" },
              totalPages: { type: "number" },
            },
          },
        },
      },
      BlacklistRequest: {
        type: "object",
        required: ["visitorId", "reason", "addedBy"],
        properties: {
          visitorId: { type: "string", format: "uuid" },
          reason: { type: "string" },
          addedBy: { type: "string" },
          expiresAt: { type: "string", format: "date-time" },
        },
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          dbConnected: { type: "boolean" },
          redisConnected: { type: "boolean" },
          timestamp: { type: "string", format: "date-time" },
          activeVisitorCount: { type: "number" },
        },
      },
      Host: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          department: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" },
        },
      },
      ValidationError: {
        type: "object",
        properties: {
          error: { type: "string", example: "Validation failed" },
          details: { type: "array", items: { type: "object" } },
        },
      },
    },
  },
};
