import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Anhere - Sistema di Gestione Presenze',
        version: '1.0.0',
        description: 'API completa per la gestione del sistema di presenze, dipendenti, turni e permessi.',
        contact: {
          name: 'Anhere API Support',
          email: 'support@anhere.local',
        },
      },
      servers: [
        {
          url: process.env.API_URL || 'http://localhost:3000',
          description: 'Development Server',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT Token from /api/auth/login',
          },
        },
      },
      security: [
        {
          BearerAuth: [],
        },
      ],
    },
  });
  return spec;
};
