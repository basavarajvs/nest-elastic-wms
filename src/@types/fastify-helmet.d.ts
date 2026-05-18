declare module 'fastify-helmet' {
  import { FastifyPluginCallback } from 'fastify';
  interface HelmetOptions {
    contentSecurityPolicy?: boolean | { directives?: Record<string, (string | boolean)[]> };
    frameguard?: boolean | { action?: string };
    hsts?: boolean | { maxAge?: number; includeSubDomains?: boolean; preload?: boolean };
    noSniff?: boolean;
    referrerPolicy?: boolean | { policy?: string };
    xssFilter?: boolean;
  }
  const helmet: FastifyPluginCallback<HelmetOptions>;
  export default helmet;
}
