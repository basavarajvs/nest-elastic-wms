import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RfSessionService {
  private readonly logger = new Logger(RfSessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async validateSession(sessionId: string, tenantId: string) {
    const session = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT id, tenant_id, user_id, facility_id, device_id, workflow_type,
              payload_json, state_json, status, started_at, last_activity_at, expires_at
       FROM multitenant.db_rf_sessions
       WHERE id = $1::uuid AND tenant_id = $2::uuid
         AND status = 'ACTIVE' AND (expires_at IS NULL OR expires_at > NOW())`,
      sessionId,
      tenantId,
    );

    if (!session || session.length === 0) {
      throw new UnauthorizedException('Invalid or expired RF session');
    }

    // Update last activity timestamp
    await this.prisma.$executeRawUnsafe(
      `UPDATE multitenant.db_rf_sessions SET last_activity_at = NOW() WHERE id = $1::uuid`,
      sessionId,
    );

    return session[0];
  }

  async createSession(params: {
    tenantId: string;
    userId: string;
    facilityId: string;
    deviceId?: string;
    workflowType?: string;
    payload?: Record<string, any>;
    expiryMinutes?: number;
  }) {
    const expiryMinutes = params.expiryMinutes || 480;
    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `INSERT INTO multitenant.db_rf_sessions
         (tenant_id, user_id, facility_id, device_id, session_token, workflow_type,
          payload_json, status, expires_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4,
               encode(gen_random_bytes(32), 'hex'), $5,
               $6::jsonb, 'ACTIVE',
               NOW() + INTERVAL '1 minute' * $7)
       RETURNING id, session_token, expires_at, workflow_type`,
      params.tenantId,
      params.userId,
      params.facilityId,
      params.deviceId || null,
      params.workflowType || null,
      params.payload ? JSON.stringify(params.payload) : null,
      expiryMinutes,
    );
    return rows[0];
  }

  async heartbeat(sessionId: string, tenantId: string) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `UPDATE multitenant.db_rf_sessions
       SET last_activity_at = NOW(), expires_at = NOW() + INTERVAL '8 hours'
       WHERE id = $1::uuid AND tenant_id = $2::uuid AND status = 'ACTIVE'
       RETURNING id, expires_at`,
      sessionId,
      tenantId,
    );
    if (rows.length === 0) throw new UnauthorizedException('Session not found or expired');
    return rows[0];
  }

  async endSession(sessionId: string, tenantId: string) {
    await this.prisma.$executeRawUnsafe(
      `UPDATE multitenant.db_rf_sessions
       SET status = 'ENDED', last_activity_at = NOW()
       WHERE id = $1::uuid AND tenant_id = $2::uuid`,
      sessionId,
      tenantId,
    );
  }

  async updateSessionState(sessionId: string, tenantId: string, state: Record<string, any>, payload?: Record<string, any>) {
    await this.prisma.$executeRawUnsafe(
      `UPDATE multitenant.db_rf_sessions
       SET state_json = $1::jsonb,
           payload_json = COALESCE($2::jsonb, payload_json),
           last_activity_at = NOW()
       WHERE id = $3::uuid AND tenant_id = $4::uuid`,
      JSON.stringify(state),
      payload ? JSON.stringify(payload) : null,
      sessionId,
      tenantId,
    );
  }

  async getActiveSessions(tenantId: string, facilityId?: string) {
    const facilityClause = facilityId ? `AND facility_id = $2::uuid` : '';
    const params: any[] = [tenantId];
    if (facilityId) params.push(facilityId);
    return this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT id, user_id, facility_id, device_id, workflow_type, status,
              started_at, last_activity_at, expires_at
       FROM multitenant.db_rf_sessions
       WHERE tenant_id = $1::uuid AND status = 'ACTIVE' AND (expires_at IS NULL OR expires_at > NOW())
       ${facilityClause}
       ORDER BY last_activity_at DESC`,
      ...params,
    );
  }
}
