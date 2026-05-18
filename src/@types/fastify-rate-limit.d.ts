declare module '@fastify/rate-limit' {
  import { FastifyPluginCallback } from 'fastify';
  interface RateLimitOptions {
    global?: boolean;
    max?: number | ((req: any, key: string) => number);
    timeWindow?: string | number;
    cache?: number;
    hook?: string;
    redis?: { host: string; port: number; password?: string };
    keyGenerator?: (req: any) => string;
    errorResponseBuilder?: (req: any, context: any) => any;
  }
  const rateLimit: FastifyPluginCallback<RateLimitOptions>;
  export default rateLimit;
}
