// jest.setup.js
import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.JWT_KEY = 'test-jwt-secret-key'
process.env.PEPPER = 'test-pepper'
process.env.NODE_ENV = 'test'
