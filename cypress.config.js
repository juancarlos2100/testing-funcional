require('dotenv').config();

const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: 'o4imww',
  allowCypressEnv: false,
  env: {
    LOGIN_URL: process.env.LOGIN_URL,
    VALID_USER: process.env.VALID_USER,
    VALID_PASSWORD: process.env.VALID_PASSWORD,
    INVALID_USER: process.env.INVALID_USER,
    INVALID_PASSWORD: process.env.INVALID_PASSWORD,
  },

  e2e: {
    setupNodeEvents(on, config) {
      return config;
    },
  },
});
