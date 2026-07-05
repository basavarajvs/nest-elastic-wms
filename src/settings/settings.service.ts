import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Manhattan WMS has well-known setting keys that control warehouse behavior
export const WELL_KNOWN_SETTINGS = {
  PUTAWAY_STRATEGY: { key: 'putaway_strategy', type: 'string', default: 'LOCATION_TYPE', description: 'Default putaway strategy: LOCATION_TYPE, PRODUCT_FIXED, ZONE, FEFO' },
  PICKING_METHOD: { key: 'picking_method', type: 'string', default: 'DEFAULT', description: 'Picking method: DEFAULT, ZONE, BATCH, CLUSTER, WAVE' },
  CYCLE_COUNT_FREQUENCY: { key: 'cycle_count_frequency', type: 'string', default: 'ABC_DRIVEN', description: 'Cycle count frequency: ABC_DRIVEN, PERIODIC, CONTINUOUS' },
  LABEL_FORMAT: { key: 'label_format', type: 'string', default: 'ZPL', description: 'Default label format: ZPL, EPL, PDF' },
  AUTO_APPROVE_ADJUSTMENTS: { key: 'auto_approve_adjustments', type: 'boolean', default: 'true', description: 'Auto-approve inventory adjustments below threshold' },
  ENFORCE_LPN_TRACKING: { key: 'enforce_lpn_tracking', type: 'boolean', default: 'true', description: 'Enforce LPN tracking for all inventory movements' },
  DEFAULT_STORAGE_LOCATION_TYPE: { key: 'default_storage_location_type', type: 'string', default: 'PALLET', description: 'Default storage location type for new locations' },
  QC_SAMPLING_RATE: { key: 'qc_sampling_rate', type: 'number', default: '10', description: 'Percentage of receipts requiring QC inspection' },
  MAX_PICK_TASKS_PER_WAVE: { key: 'max_pick_tasks_per_wave', type: 'number', default: '50', description: 'Maximum pick tasks per wave' },
} as const;

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async get(tenantId: string, settingKey: string) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM multitenant.system_settings WHERE tenant_id = $1::uuid AND setting_key = $2`,
      tenantId,
      settingKey,
    );
    if (rows.length > 0) return rows[0];
    const known = WELL_KNOWN_SETTINGS[settingKey.toUpperCase() as keyof typeof WELL_KNOWN_SETTINGS];
    if (known) return { setting_key: known.key, value: known.default, is_active: true };
    return null;
  }

  async set(tenantId: string, settingKey: string, value: string, userId: string, description?: string) {
    const existing = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM multitenant.system_settings WHERE tenant_id = $1::uuid AND setting_key = $2`,
      tenantId,
      settingKey,
    );

    const oldValueJson = existing.length > 0 ? existing[0].value : null;
    const tenantIdParam = tenantId;

    if (existing.length > 0) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE multitenant.system_settings
         SET value = $1::jsonb, description = COALESCE($2, description), updated_by = $3::uuid, updated_at = NOW()
         WHERE tenant_id = $4::uuid AND setting_key = $5`,
        JSON.stringify(value),
        description || null,
        userId,
        tenantIdParam,
        settingKey,
      );
    } else {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO multitenant.system_settings (tenant_id, setting_key, value, description, is_active, created_by, updated_by)
         VALUES ($1::uuid, $2, $3::jsonb, $4, true, $5::uuid, $5::uuid)`,
        tenantIdParam,
        settingKey,
        JSON.stringify(value),
        description || null,
        userId,
      );
    }

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO multitenant.system_setting_histories (tenant_id, setting_key, old_value, new_value, changed_by)
       VALUES ($1::uuid, $2, $3::jsonb, $4::jsonb, $5::uuid)`,
      tenantIdParam,
      settingKey,
      oldValueJson || JSON.stringify(null),
      JSON.stringify(value),
      userId,
    );

    return this.get(tenantIdParam, settingKey);
  }

  async delete(tenantId: string, settingKey: string) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM multitenant.system_settings WHERE tenant_id = $1::uuid AND setting_key = $2`,
      tenantId, settingKey,
    );
    return { message: 'Setting deleted successfully' };
  }

  async validateAndSet(tenantId: string, settingKey: string, value: string, userId: string) {
    const known = WELL_KNOWN_SETTINGS[settingKey.toUpperCase() as keyof typeof WELL_KNOWN_SETTINGS];
    if (known?.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) throw new BadRequestException(`Setting ${settingKey} must be a number`);
    }
    if (known?.type === 'boolean') {
      if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
        throw new BadRequestException(`Setting ${settingKey} must be true/false`);
      }
    }
    return this.set(tenantId, settingKey, value, userId);
  }

  async findAll(tenantId: string, query: any = {}) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const conditions: string[] = ['tenant_id = $1::uuid'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (query.settingKey) {
      conditions.push(`setting_key ILIKE $${idx}`);
      params.push(`%${query.settingKey}%`);
      idx++;
    }
    if (query.isActive !== undefined) {
      conditions.push(`is_active = $${idx}`);
      params.push(query.isActive === 'true');
      idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const countResult = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT COUNT(*) AS total FROM multitenant.system_settings ${where}`, ...params,
    );
    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM multitenant.system_settings ${where} ORDER BY setting_key ASC LIMIT $${idx} OFFSET $${idx + 1}`,
      ...params, limit, (page - 1) * limit,
    );
    return { data: rows, total: Number(countResult[0]?.total || 0), page, limit };
  }

  async getHistory(tenantId: string, settingKey: string) {
    return this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM multitenant.system_setting_histories WHERE tenant_id = $1::uuid AND setting_key = $2 ORDER BY changed_at DESC`,
      tenantId, settingKey,
    );
  }

  /** Manhattan-style: get all settings with fallback to defaults */
  async getAllWithDefaults(tenantId: string) {
    const dbSettings = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM multitenant.system_settings WHERE tenant_id = $1::uuid`,
      tenantId,
    );
    const dbMap = new Map(dbSettings.map((s) => [s.setting_key, s]));
    return Object.values(WELL_KNOWN_SETTINGS).map((known) => {
      const db = dbMap.get(known.key);
      return { setting_key: known.key, value: db ? db.value : known.default, description: known.description, is_overridden: !!db };
    });
  }
}
