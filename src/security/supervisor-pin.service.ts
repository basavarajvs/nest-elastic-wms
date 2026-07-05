import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupervisorPinService {
  private readonly logger = new Logger(SupervisorPinService.name);

  constructor(private readonly prisma: PrismaService) {}

  private hashPin(pin: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = createHash('sha256').update(salt + pin).digest('hex');
    return `${salt}:${hash}`;
  }

  private verifyHash(pin: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const computed = createHash('sha256').update(salt + pin).digest('hex');
    return computed === hash;
  }

  async createPin(tenantId: string, userId: string, pin: string, expiryHours = 24) {
    const pinHash = this.hashPin(pin);
    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `INSERT INTO multitenant.supervisor_pins
         (tenant_id, user_id, pin_hash, is_active, expires_at)
       VALUES ($1::uuid, $2::uuid, $3, true, NOW() + INTERVAL '1 hour' * $4)
       ON CONFLICT (tenant_id, user_id) DO UPDATE
         SET pin_hash = $3, is_active = true, expires_at = NOW() + INTERVAL '1 hour' * $4, created_at = NOW()
       RETURNING *`,
      tenantId, userId, pinHash, expiryHours,
    );
    return { id: rows[0]?.id, userId: rows[0]?.user_id, expiresAt: rows[0]?.expires_at };
  }

  async verifyPin(tenantId: string, userId: string, pin: string) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM multitenant.supervisor_pins
       WHERE tenant_id = $1::uuid AND user_id = $2::uuid AND is_active = true
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY created_at DESC LIMIT 1`,
      tenantId, userId,
    );

    if (rows.length === 0) return { valid: false, reason: 'No active PIN found' };
    const stored = rows[0];
    const valid = this.verifyHash(pin, stored.pin_hash);
    if (!valid) return { valid: false, reason: 'PIN does not match' };

    return { valid: true, userId, verifiedAt: new Date().toISOString() };
  }

  async verifyPinById(tenantId: string, id: string, pin: string) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM multitenant.supervisor_pins
       WHERE tenant_id = $1::uuid AND id = $2::uuid AND is_active = true
         AND (expires_at IS NULL OR expires_at > NOW())`,
      tenantId, id,
    );
    if (rows.length === 0) return { valid: false, reason: 'PIN record not found or expired' };
    const stored = rows[0];
    const valid = this.verifyHash(pin, stored.pin_hash);
    if (!valid) return { valid: false, reason: 'PIN does not match' };
    return { valid: true, userId: stored.user_id, verifiedAt: new Date().toISOString() };
  }

  async deactivate(tenantId: string, id: string) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `UPDATE multitenant.supervisor_pins SET is_active = false
       WHERE tenant_id = $1::uuid AND id = $2::uuid
       RETURNING *`,
      tenantId, id,
    );
    return rows.length ? rows[0] : null;
  }

  async findActivePinForUser(tenantId: string, userId: string) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM multitenant.supervisor_pins
       WHERE tenant_id = $1::uuid AND user_id = $2::uuid AND is_active = true
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY created_at DESC LIMIT 1`,
      tenantId, userId,
    );
    return rows.length ? rows[0] : null;
  }
}
