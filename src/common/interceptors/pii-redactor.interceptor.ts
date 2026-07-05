import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ConfigService } from '@nestjs/config';

const PII_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  /Bearer\s+[A-Za-z0-9._-]+/g,
];

function redactValue(value: any, depth = 0): any {
  if (depth > 10) return value;
  if (typeof value === 'string') {
    let result = value;
    for (const pattern of PII_PATTERNS) {
      result = result.replace(pattern, '***');
    }
    return result;
  }
  if (Array.isArray(value)) {
    return value.map((v) => redactValue(v, depth + 1));
  }
  if (value && typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = redactValue(v, depth + 1);
    }
    return result;
  }
  return value;
}

@Injectable()
export class PiiRedactorInterceptor implements NestInterceptor {
  private readonly isProduction: boolean;

  constructor(config: ConfigService) {
    this.isProduction = config.get('NODE_ENV') === 'production';
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.isProduction) return next.handle();

    return next.handle().pipe(map((data) => redactValue(data)));
  }
}
