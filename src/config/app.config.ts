import * as Joi from 'joi';

export const appValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  API_PREFIX: Joi.string().default('api/v1/wms'),
  APP_URL: Joi.string().default('http://localhost:3001'),
  LOG_LEVEL: Joi.string().default('info'),

  DATABASE_URL: Joi.string().required(),
  PGBOUNCER_ENABLED: Joi.boolean().default(false),
  DB_POOL_LIMIT: Joi.number().default(20),

  JWT_ACCESS_SECRET: Joi.string().min(8).required(),
  JWT_REFRESH_SECRET: Joi.string().min(8).required(),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
  JWT_ACCESS_SECRET_OLD: Joi.string().optional().allow(''),

  CORE_API_URL: Joi.string().uri().required(),
  CORE_API_TOKEN: Joi.string().min(8).required(),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_MAXMEMORY: Joi.string().default('512mb'),
  REDIS_MAXMEMORY_POLICY: Joi.string().default('allkeys-lru'),

  OTLP_ENDPOINT: Joi.string().uri().optional(),
  METRICS_PATH: Joi.string().default('/metrics'),

  SWAGGER_ENABLED: Joi.string().default('true'),
  CORS_ORIGINS: Joi.string().default('*'),
  RATE_LIMIT_GLOBAL_TTL: Joi.number().default(60000),
  RATE_LIMIT_GLOBAL_LIMIT: Joi.number().default(100),
  SHUTDOWN_TIMEOUT_MS: Joi.number().default(15000),
  IDEMPOTENCY_TTL_MS: Joi.number().default(300000),
  DEPLOYMENT_MODE: Joi.string()
    .valid('rolling', 'blue-green', 'standalone')
    .default('standalone'),
  HEAP_WARNING_THRESHOLD_MB: Joi.number().default(1200),
});
