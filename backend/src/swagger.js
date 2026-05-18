const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Football Manager API',
      version: '1.0.0',
      description:
        'Информационная система для автоматизации процессов управления футбольными лигами, составами команд и отслеживания статистики. ' +
        'Интеграция с football-data.org для отображения таблиц ТОП-лиг.',
      contact: {
        name: 'Хворостянко Владислав',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'MANAGER', 'ADMIN'] }
          }
        },
        LoginRequest: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            password: { type: 'string' }
          },
          required: ['email', 'password']
        }
      }
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = { swaggerUi, swaggerDocs };