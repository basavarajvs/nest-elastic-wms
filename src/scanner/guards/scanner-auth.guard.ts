import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ScannerAuthService } from '../scanner-auth.service';

@Injectable()
export class ScannerAuthGuard implements CanActivate {
  constructor(private readonly scannerAuth: ScannerAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const deviceId = req.headers['x-scanner-device-id'] as string;
    const token = req.headers['authorization']?.replace('Bearer ', '') as string;

    if (!deviceId || !token) {
      throw new UnauthorizedException('Missing scanner credentials');
    }

    const session = await this.scannerAuth.validateToken(deviceId, token);
    if (!session) {
      throw new UnauthorizedException('Invalid or expired scanner token');
    }

    req.scannerSession = session;
    req.deviceId = deviceId;
    return true;
  }
}
