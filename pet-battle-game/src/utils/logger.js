import { env } from '@/config/env.js';

const noop = () => {};
export const logger = {
  debug: env.isDev ? console.debug.bind(console, '[debug]') : noop,
  info: console.info.bind(console, '[info]'),
  warn: console.warn.bind(console, '[warn]'),
  error: console.error.bind(console, '[error]'),
};
