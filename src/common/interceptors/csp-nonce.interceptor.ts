import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomBytes } from 'crypto';

@Injectable()
export class CspNonceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse();
    const nonce = randomBytes(16).toString('base64');
    res.__nonce = nonce;

    const csp = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://cdn.jsdelivr.net`,
      `style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net`,
      'img-src * data:',
      'font-src \'self\' data:',
      'connect-src \'self\'',
    ].join('; ');

    res.header('Content-Security-Policy', csp);
    return next.handle();
  }
}
