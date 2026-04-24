'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    SwaggerUIBundle: unknown;
    SwaggerUIStandalonePreset: unknown;
  }
}

export default function DocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initSwagger = () => {
      if (window.SwaggerUIBundle && containerRef.current) {
        try {
          const Swagger = window.SwaggerUIBundle as unknown as {
            (opts: Record<string, unknown>): void;
            presets: { apis: unknown };
            plugins: { DownloadUrl: unknown };
          };
          const Standalone = window.SwaggerUIStandalonePreset as unknown;
          Swagger({
            url: '/api/docs',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [Swagger.presets.apis, Standalone],
            plugins: [Swagger.plugins.DownloadUrl],
            layout: 'StandaloneLayout',
            defaultModelsExpandDepth: 1,
            docExpansion: 'list',
          });
        } catch (error) {
          console.error('Failed to initialize Swagger UI:', error);
        }
      }
    };

    // Attendi che gli script siano caricati
    const checkAndInit = () => {
      if (
        typeof window !== 'undefined' &&
        window.SwaggerUIBundle &&
        window.SwaggerUIStandalonePreset
      ) {
        initSwagger();
      } else {
        setTimeout(checkAndInit, 100);
      }
    };

    checkAndInit();
  }, []);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@4/swagger-ui.css"
        type="text/css"
      />
      <style>{`
        html {
          box-sizing: border-box;
          overflow: -moz-scrollbars-vertical;
          overflow-y: scroll;
          height: 100%;
        }
        *,
        *:before,
        *:after {
          box-sizing: inherit;
        }
        body {
          margin: 0;
          padding: 0;
          background: #fafafa;
          height: 100%;
          overflow: auto;
        }
        #swagger-ui {
          display: block;
        }
      `}</style>
      <div
        id="swagger-ui"
        ref={containerRef}
        style={{ width: '100%', minHeight: '100vh' }}
      />
      <Script
        src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-bundle.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-standalone-preset.js"
        strategy="afterInteractive"
      />
    </>
  );
}
