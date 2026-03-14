'use client';

import { useEffect, useState } from 'react';

export default function SwaggerUI() {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    const swaggerHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Anhere API Documentation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4/swagger-ui.css" />
        <style>
          body {
            margin: 0;
            padding: 0;
            background: #fafafa;
          }
          html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
          }
          *,
          *:before,
          *:after {
            box-sizing: inherit;
          }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = function() {
            const ui = SwaggerUIBundle({
              url: "/api/docs",
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: "StandaloneLayout",
              defaultModelsExpandDepth: 1,
              docExpansion: "list",
            });
            window.ui = ui;
          };
        </script>
      </body>
      </html>
    `;
    setHtml(swaggerHtml);
  }, []);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ width: '100%', height: '100vh' }}
    />
  );
}
