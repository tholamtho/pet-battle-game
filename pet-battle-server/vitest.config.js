import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      DATABASE_URL: 'postgres://pets:pets@localhost:5432/pets_test',
      JWT_SECRET: 'test-secret-test-secret',
    },
  },
});
