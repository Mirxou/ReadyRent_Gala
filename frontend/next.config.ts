import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === 'production';

let config: NextConfig;

if (isProduction) {
  // Import production config
  config = require('./next.config.prod.ts').default;
} else {
  // Import development config
  config = require('./next.config.dev.ts').default;
}

export default config;
