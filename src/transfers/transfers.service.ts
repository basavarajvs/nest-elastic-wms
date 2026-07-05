import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextTransferNumber(tenantId: string, facilityId: bigint): Promise<string> {
    const facility = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT code FROM warehouse_facilities WHERE id = $1::bigint AND tenant_id = $2::uuid`,
      facilityId,
      tenantId,
    );
    const prefix = facility.length ? facility[0].code : 'XX';
    const seq = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT COALESCE(MAX(CAST(SPLIT_PART(transfer_number, '-', 3) AS INTEGER)), 0) + 1 AS next
       FROM inventory_transfers
       WHERE tenant_id = $1::uuid AND transfer_number LIKE $2`,
      tenantId,
      `TRF-${prefix}-%`,
    );
    const next = seq.length ? seq[0].next : 1;
    return `TRF-${prefix}-${String(next).padStart(6, '0')}`;
  }

  async create(tenantId: string, dto: any) {
    const transferNumber = await this.getNextTransferNumber(tenantId, BigInt(dto.facilityId));
    const result = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `INSERT INTO inventory_transfers
         (tenant_id, facility_id, transfer_number, status, source_warehouse_id, destination_warehouse_id, notes, created_by, created_at, updated_at)
       VALUES ($1::uuid, $2::bigint, $3, 'DRAFT', $4::bigint, $5::bigint, $6, $7::uuid, NOW(), NOW())
       RETURNING *`,
      tenantId,
      BigInt(dto.facilityId),
      transferNumber,
      BigInt(dto.sourceWarehouseId),
      BigInt(dto.destinationWarehouseId),
      dto.notes || null,
      tenantId,
    );
    const transfer = result[0];

    if (dto.lines?.length) {
      for (let i = 0; i < dto.lines.length; i++) {
        const line = dto.lines[i];
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO inventory_transfer_lines
             (transfer_id, line_number, product_id, quantity, uom, lot_number, notes, created_at, updated_at)
           VALUES ($1::bigint, $2, $3::bigint, $4, $5, $6, $7, NOW(), NOW())`,
          transfer.id,
          i + 1,
          BigInt(line.productId),
          line.quantity,
          line.uom || 'EA',
          line.lotNumber || null,
          line.notes || null,
        );
      }
    }

    return transfer;
  }

  async findAll(tenantId: string, query: any) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const offset = (page - 1) * limit;
    const status = query.status;
    let where = `WHERE t.tenant_id = $1::uuid`;
    const params: any[] = [tenantId];
    let idx = 2;

    if (status) {
      where += ` AND t.status = $${idx}::varchar`;
      params.push(status);
      idx++;
    }

    const count = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT COUNT(*) AS total FROM inventory_transfers t ${where}`,
      ...params,
    );

    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT t.*, f.code AS facility_code, sw.name AS source_warehouse, dw.name AS dest_warehouse
       FROM inventory_transfers t
       LEFT JOIN warehouse_facilities f ON f.id = t.facility_id
       LEFT JOIN warehouses sw ON sw.id = t.source_warehouse_id
       LEFT JOIN warehouses dw ON dw.id = t.destination_warehouse_id
       ${where}
       ORDER BY t.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      ...params,
      limit,
      offset,
    );

    return { data: rows, total: Number(count[0]?.total || 0), page, limit };
  }

  async delete(tenantId: string, id: string) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM inventory_transfers WHERE tenant_id = $1::uuid AND id = $2::bigint`,
      tenantId, BigInt(id),
    );
    return { message: 'Transfer deleted successfully' };
  }

  async findById(tenantId: string, id: bigint) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT t.*, f.code AS facility_code, sw.name AS source_warehouse, dw.name AS dest_warehouse
       FROM inventory_transfers t
       LEFT JOIN warehouse_facilities f ON f.id = t.facility_id
       LEFT JOIN warehouses sw ON sw.id = t.source_warehouse_id
       LEFT JOIN warehouses dw ON dw.id = t.destination_warehouse_id
       WHERE t.id = $1::bigint AND t.tenant_id = $2::uuid`,
      id,
      tenantId,
    );
    return rows.length ? rows[0] : null;
  }

  async findLines(tenantId: string, transferId: bigint) {
    const transfer = await this.findById(tenantId, transferId);
    if (!transfer) return null;

    const lines = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT l.*, p.sku, p.name AS product_name
       FROM inventory_transfer_lines l
       LEFT JOIN products p ON p.id = l.product_id
       WHERE l.transfer_id = $1::bigint
       ORDER BY l.line_number`,
      transferId,
    );

    return { ...transfer, lines };
  }

  async dispatch(tenantId: string, id: bigint, dto: any) {
    const transfer = await this.findById(tenantId, id);
    if (!transfer) throw new Error('Transfer not found');
    if (transfer.status !== 'REQUESTED') throw new Error('Only REQUESTED transfers can be dispatched');

    const lines = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM inventory_transfer_lines WHERE transfer_id = $1::bigint`,
      id,
    );

    for (const line of lines) {
      const qtyToDispatch = dto.lines?.find((l: any) => l.lineId === line.id)?.quantity || line.quantity;

      const onHand = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
        `SELECT id, quantity FROM inventory_on_hand
         WHERE tenant_id = $1::uuid AND facility_id = $2::bigint AND product_id = $3::bigint
           AND (lot_number = $4 OR ($4 IS NULL AND lot_number IS NULL))
         ORDER BY quantity DESC LIMIT 1`,
        tenantId,
        transfer.facility_id,
        line.product_id,
        line.lot_number,
      );

      if (!onHand.length || Number(onHand[0].quantity) < Number(qtyToDispatch)) {
        throw new Error(`Insufficient inventory for product ${line.product_id}`);
      }

      const remaining = Number(onHand[0].quantity) - Number(qtyToDispatch);
      if (remaining <= 0) {
        await this.prisma.$executeRawUnsafe(
          `DELETE FROM inventory_on_hand WHERE id = $1::bigint`,
          onHand[0].id,
        );
      } else {
        await this.prisma.$executeRawUnsafe(
          `UPDATE inventory_on_hand SET quantity = $1 WHERE id = $2::bigint`,
          remaining,
          onHand[0].id,
        );
      }

      await this.prisma.$executeRawUnsafe(
        `UPDATE inventory_transfer_lines SET quantity_dispatched = $1, updated_at = NOW() WHERE id = $2::bigint`,
        qtyToDispatch,
        line.id,
      );
    }

    const result = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `UPDATE inventory_transfers
       SET status = 'DISPATCHED', dispatched_by = $1::uuid, dispatched_at = NOW(), updated_at = NOW(), notes = COALESCE($2, notes)
       WHERE id = $3::bigint AND tenant_id = $4::uuid
       RETURNING *`,
      tenantId,
      dto.notes || null,
      id,
      tenantId,
    );

    return result[0];
  }

  async receive(tenantId: string, id: bigint, dto: any) {
    const transfer = await this.findById(tenantId, id);
    if (!transfer) throw new Error('Transfer not found');
    if (transfer.status !== 'DISPATCHED') throw new Error('Only DISPATCHED transfers can be received');

    const lines = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM inventory_transfer_lines WHERE transfer_id = $1::bigint`,
      id,
    );

    for (const line of lines) {
      const qtyToReceive = dto.lines?.find((l: any) => l.lineId === line.id)?.quantity || line.quantity_dispatched || line.quantity;

      const existing = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
        `SELECT id, quantity FROM inventory_on_hand
         WHERE tenant_id = $1::uuid AND facility_id = $2::bigint AND product_id = $3::bigint
           AND (lot_number = $4 OR ($4 IS NULL AND lot_number IS NULL))`,
        tenantId,
        transfer.destination_warehouse_id,
        line.product_id,
        line.lot_number,
      );

      if (existing.length) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE inventory_on_hand SET quantity = quantity + $1 WHERE id = $2::bigint`,
          qtyToReceive,
          existing[0].id,
        );
      } else {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO inventory_on_hand (tenant_id, facility_id, product_id, quantity, lot_number)
           VALUES ($1::uuid, $2::bigint, $3::bigint, $4, $5)`,
          tenantId,
          transfer.destination_warehouse_id,
          line.product_id,
          qtyToReceive,
          line.lot_number || null,
        );
      }

      await this.prisma.$executeRawUnsafe(
        `UPDATE inventory_transfer_lines SET quantity_received = $1, updated_at = NOW() WHERE id = $2::bigint`,
        qtyToReceive,
        line.id,
      );
    }

    const result = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `UPDATE inventory_transfers
       SET status = 'RECEIVED', received_by = $1::uuid, received_at = NOW(), updated_at = NOW(), notes = COALESCE($2, notes)
       WHERE id = $3::bigint AND tenant_id = $4::uuid
       RETURNING *`,
      tenantId,
      dto.notes || null,
      id,
      tenantId,
    );

    return result[0];
  }

  async cancel(tenantId: string, id: bigint, dto: any) {
    const transfer = await this.findById(tenantId, id);
    if (!transfer) throw new Error('Transfer not found');
    if (['RECEIVED', 'CANCELLED'].includes(transfer.status)) throw new Error('Cannot cancel a received or already cancelled transfer');

    if (transfer.status === 'DISPATCHED') {
      const lines = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
        `SELECT * FROM inventory_transfer_lines WHERE transfer_id = $1::bigint`,
        id,
      );

      for (const line of lines) {
        const qty = line.quantity_dispatched || 0;
        if (Number(qty) > 0) {
          const existing = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
            `SELECT id, quantity FROM inventory_on_hand
             WHERE tenant_id = $1::uuid AND facility_id = $2::bigint AND product_id = $3::bigint
               AND (lot_number = $4 OR ($4 IS NULL AND lot_number IS NULL))`,
            tenantId,
            transfer.source_warehouse_id,
            line.product_id,
            line.lot_number,
          );
          if (existing.length) {
            await this.prisma.$executeRawUnsafe(
              `UPDATE inventory_on_hand SET quantity = quantity + $1 WHERE id = $2::bigint`,
              qty,
              existing[0].id,
            );
          }
        }
      }
    }

    const result = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `UPDATE inventory_transfers
       SET status = 'CANCELLED', updated_at = NOW(), notes = COALESCE($1, notes)
       WHERE id = $2::bigint AND tenant_id = $3::uuid
       RETURNING *`,
      dto?.notes || null,
      id,
      tenantId,
    );

    return result[0];
  }
}
