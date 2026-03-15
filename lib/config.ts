/**
 * Application configuration from environment variables
 * Centralized configuration management for the API
 */

export const config = {
  // API Configuration
  apiUrl: process.env.API_URL || 'http://localhost:3000',

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'anhere_db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },

  // Security Configuration
  security: {
    jwtKey: process.env.JWT_KEY || 'default-secret-key',
    pepper: process.env.PEPPER || 'default-pepper',
  },

  // Environment
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

// Validate critical configuration on startup
if (!process.env.JWT_KEY) {
  console.warn(
    '⚠️  JWT_KEY is not set. Using default value (insecure for production)'
  );
}

if (!process.env.PEPPER) {
  console.warn(
    '⚠️  PEPPER is not set. Using default value (insecure for production)'
  );
}

if (config.isProduction) {
  if (!process.env.DB_PASSWORD) {
    throw new Error('DB_PASSWORD must be set in production environment');
  }
  if (process.env.JWT_KEY === undefined) {
    throw new Error('JWT_KEY must be set in production environment');
  }
}

export default config;
