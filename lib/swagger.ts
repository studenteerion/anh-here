import { createSwaggerSpec } from 'next-swagger-doc';
import fs from 'node:fs';
import path from 'node:path';

const resolveApiFolder = () => {
  const candidates = [
    process.env.SWAGGER_API_FOLDER,
    path.join(process.cwd(), 'app', 'api'),
    path.join(process.cwd(), '..', 'app', 'api'),
    path.join(process.cwd(), '..', '..', 'app', 'api'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return 'app/api';
};

export const getApiDocs = async (options?: { baseUrl?: string }) => {
  const apiFolder = resolveApiFolder();
  const envApiUrl = process.env.API_URL || 'http://localhost:3000';
  const baseUrl = options?.baseUrl || envApiUrl;
  const servers = [
    {
      url: baseUrl,
      description:
        process.env.NODE_ENV === 'production'
          ? 'Production Server'
          : 'Current Server',
    },
  ];

  if (envApiUrl && envApiUrl !== baseUrl) {
    servers.push({
      url: envApiUrl,
      description: 'Configured Server (API_URL)',
    });
  }

  if (!servers.find((server) => server.url.includes('localhost'))) {
    servers.push({
      url: 'http://localhost:3000',
      description: 'Local Development Server',
    });
  }

  const spec = createSwaggerSpec({
    apiFolder,
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
      servers,
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
