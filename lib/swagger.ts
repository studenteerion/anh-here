import { createSwaggerSpec } from 'next-swagger-doc';
import fs from 'node:fs';
import path from 'node:path';

let resolvedApiFolder: string | null = null;

const hasSwaggerAnnotations = (folder: string): boolean => {
  if (!fs.existsSync(folder)) {
    return false;
  }

  const entries = fs.readdirSync(folder, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      if (hasSwaggerAnnotations(fullPath)) {
        return true;
      }
      continue;
    }

    if (!/route\.(ts|tsx|js|jsx)$/i.test(entry.name)) {
      continue;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('@swagger')) {
        return true;
      }
    } catch {
      // ignore unreadable files and keep scanning
    }
  }

  return false;
};

const resolveApiFolder = () => {
  if (resolvedApiFolder) {
    return resolvedApiFolder;
  }

  const cwd = process.cwd();
  const candidates = [
    process.env.SWAGGER_API_FOLDER,
    path.join(cwd, 'app', 'api'),
    path.join(cwd, '.next', 'standalone', 'app', 'api'),
    path.join(cwd, '.next', 'server', 'app', 'api'),
    path.join(cwd, '..', 'app', 'api'),
    path.join(cwd, '..', '..', 'app', 'api'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (hasSwaggerAnnotations(candidate)) {
      resolvedApiFolder = candidate;
      return candidate;
    }
  }

  resolvedApiFolder = 'app/api';
  return resolvedApiFolder;
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
