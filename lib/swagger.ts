import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'ANH-here - Sistema di Gestione Presenze',
        version: '1.0.0',
        description: 'Documentazione ufficiale delle API ANH-here. Login unico per utenti tenant e platform manager; per utenti multitenant può essere richiesta la selezione tenant tramite /api/auth/select-tenant prima dell’emissione JWT.',
        contact: {
          name: 'ANH-here API Support',
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
            description: 'JWT Token (fallback for API compatibility). Prefer using cookies.',
          },
          CookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'access_token',
            description: 'HttpOnly cookie containing JWT access token (recommended)',
          },
        },
      },
      security: [
        { CookieAuth: [] },
        { BearerAuth: [] },
      ],
    },
  });
  return spec;
};
