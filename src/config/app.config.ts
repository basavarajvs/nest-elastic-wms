import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  API_PREFIX: Joi.string().default('api/v1/wms'),
  APP_URL: Joi.string().uri().default('http://localhost:3001'),
  LOG_LEVEL: Joi.string()
    .valid('debug', 'info', 'warn', 'error')
    .default('info'),

  DATABASE_URL: Joi.string()
    .pattern(/\?schema=multitenant/)
    .required()
    .messages({
      'string.pattern.base':
        'DATABASE_URL must include ?schema=multitenant query parameter',
    }),

  CORE_API_URL: Joi.string().uri().required(),
  CORE_API_TOKEN: Joi.string().min(32).required(),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
});
