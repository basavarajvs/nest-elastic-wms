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

  OTLP_ENDPOINT: Joi.string().uri().optional(),
  METRICS_PATH: Joi.string().default('/metrics'),
  SHUTDOWN_TIMEOUT_MS: Joi.number().default(15000),
  DB_POOL_LIMIT: Joi.number().default(20),
  HEAP_WARNING_THRESHOLD_MB: Joi.number().default(1200),

  DEPLOYMENT_MODE: Joi.string()
    .valid('rolling', 'blue-green', 'standalone')
    .default('rolling'),
  MIGRATION_LOCK_TIMEOUT_MS: Joi.number().default(300000),
  JWT_ACCESS_SECRET_OLD: Joi.string().min(32).optional(),
  PGBOUNCER_ENABLED: Joi.boolean().default(false),

  CORS_ORIGINS: Joi.string().optional(),
  RATE_LIMIT_GLOBAL_TTL: Joi.number().default(60000),
  RATE_LIMIT_GLOBAL_LIMIT: Joi.number().default(100),
  SWAGGER_ENABLED: Joi.boolean().default(false),

  // ── Prompt 25: Production validation tooling ──
  E2E_TEST_DB_URL: Joi.string().uri().optional(),
  LOAD_TEST_DURATION: Joi.string().default('5m'),
  MIGRATION_BATCH_SIZE: Joi.number().default(100),
  CUTOVER_TIMEOUT_MS: Joi.number().default(300000),
  SMOKE_TEST_RH_TOKEN: Joi.string().optional(),
  IDEMPOTENCY_TTL_MS: Joi.number().default(300000),
  WARMUP_BARCODE_COUNT: Joi.number().default(1000),
  WARMUP_CONCURRENCY: Joi.number().default(50),
  WARMUP_CACHE_TTL_S: Joi.number().default(900),      // 15 min warm-up TTL
  STEADY_CACHE_TTL_S: Joi.number().default(7200),      // 2h steady TTL
  REDIS_MAXMEMORY: Joi.string().default('512mb'),
  REDIS_MAXMEMORY_POLICY: Joi.string().default('allkeys-lru'),
});
