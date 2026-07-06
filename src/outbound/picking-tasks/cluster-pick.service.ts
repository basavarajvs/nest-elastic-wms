import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClusterPickService {
  private readonly logger = new Logger(ClusterPickService.name);

  constructor(private readonly prisma: PrismaService) {}

  async setupClusterPick(
    tenantId: string,
    userId: string,
    cartId: bigint,
    toteBarcodes: string[],
  ) {
    if (!toteBarcodes.length || toteBarcodes.length > 3) {
      throw new BadRequestException('Must provide 1-3 tote barcodes for cluster pick');
    }

    const shelfPositions = ['TOP', 'MIDDLE', 'BOTTOM'] as const;

    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.pick_carts.findFirst({
        where: { tenant_id: tenantId, cart_id: cartId },
      });
      if (!cart) throw new BadRequestException('Pick cart not found');

      const [session] = await tx.$queryRawUnsafe<any[]>(
        `INSERT INTO multitenant.cluster_pick_groups
           (tenant_id, cart_id, picker_id, status, created_at)
         VALUES ($1::uuid, $2, $3::uuid, 'ACTIVE', NOW())
         RETURNING *`,
        tenantId, cartId, userId,
      );
      // Set session_id = group_id (they are the same)
      await tx.$executeRawUnsafe(
        `UPDATE multitenant.cluster_pick_groups SET session_id = group_id WHERE tenant_id = $1::uuid AND group_id = $2`,
        tenantId, session.group_id,
      );
      session.session_id = session.group_id;

      const assignments: any[] = [];
      for (let i = 0; i < toteBarcodes.length; i++) {
        const [assignment] = await tx.$queryRawUnsafe<any[]>(
          `INSERT INTO multitenant.pick_cart_assignments
             (tenant_id, session_id, tote_barcode, shelf_position, created_at)
           VALUES ($1::uuid, $2, $3, $4, NOW())
           RETURNING *`,
          tenantId, session.session_id, toteBarcodes[i], shelfPositions[i],
        );
        assignments.push(assignment);
      }

      this.logger.log(`Cluster pick session ${session.session_id} created with ${toteBarcodes.length} totes by user ${userId}`);

      return { session, assignments };
    });
  }

  async getClusterPickTasks(tenantId: string, sessionId: bigint) {
    const [group] = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM multitenant.cluster_pick_groups WHERE tenant_id = $1::uuid AND session_id = $2`,
      tenantId, sessionId,
    );
    if (!group) throw new BadRequestException('Cluster pick session not found');
    if (!group.wave_id) throw new BadRequestException('Cluster session has no associated wave');

    const tasks = await this.prisma.picking_tasks.findMany({
      where: {
        tenant_id: tenantId,
        wave_id: group.wave_id,
        cluster_group_id: sessionId,
      },
      orderBy: [{ task_id: 'asc' }],
    });

    if (!tasks.length) return { session: group, tasks: [] };

    const locationIds = tasks
      .map((t) => t.from_location_id)
      .filter((id): id is bigint => id !== null);

    const locations = locationIds.length
      ? await this.prisma.storage_locations.findMany({
          where: { tenant_id: tenantId, location_id: { in: locationIds } },
          include: {
            aisles: { include: { warehouse_zones: true } },
            bays: true,
          },
        })
      : [];

    const locationMap = new Map(locations.map((l) => [Number(l.location_id), l]));

    const tasksWithLocation = tasks
      .map((task) => {
        const loc = task.from_location_id ? locationMap.get(Number(task.from_location_id)) : null;
        return { ...task, location: loc || null };
      })
      .sort((a, b) => {
        const locA = a.location;
        const locB = b.location;
        if (!locA && !locB) return 0;
        if (!locA) return 1;
        if (!locB) return -1;

        const zoneA = locA.aisles?.warehouse_zones?.zone_code || '';
        const zoneB = locB.aisles?.warehouse_zones?.zone_code || '';
        if (zoneA !== zoneB) return zoneA.localeCompare(zoneB);

        const aisleA = locA.aisles?.aisle_code || '';
        const aisleB = locB.aisles?.aisle_code || '';
        if (aisleA !== aisleB) return aisleA.localeCompare(aisleB);

        const bayA = locA.bays?.bay_number ?? 0;
        const bayB = locB.bays?.bay_number ?? 0;
        return bayA - bayB;
      });

    const assignments = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM multitenant.pick_cart_assignments WHERE tenant_id = $1::uuid AND session_id = $2 ORDER BY shelf_position`,
      tenantId, sessionId,
    );

    this.logger.log(`Cluster pick tasks retrieved for session ${sessionId}: ${tasksWithLocation.length} tasks`);

    return {
      session: group,
      assignments,
      tasks: tasksWithLocation,
    };
  }

  async distributePick(
    tenantId: string,
    taskId: bigint,
    distributions: { toteBarcode: string; quantity: number }[],
  ) {
    if (!distributions.length) {
      throw new BadRequestException('At least one distribution is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.picking_tasks.findFirst({
        where: { tenant_id: tenantId, task_id: taskId },
      });
      if (!task) throw new BadRequestException('Pick task not found');
      if (task.status !== 'COMPLETED') {
        throw new BadRequestException('Task must be COMPLETED before distributing');
      }

      const totalPicked = Number(task.quantity_picked || 0);
      const distributeSum = distributions.reduce((s, d) => s + Number(d.quantity), 0);

      if (Math.abs(distributeSum - totalPicked) > 0.0001) {
        throw new BadRequestException(
          `Distribution total (${distributeSum}) must equal picked quantity (${totalPicked})`,
        );
      }

      const [session] = await tx.$queryRawUnsafe<any[]>(
        `SELECT * FROM multitenant.cluster_pick_groups WHERE tenant_id = $1::uuid AND session_id = $2`,
        tenantId, task.cluster_group_id,
      );
      if (!session) throw new BadRequestException('Cluster pick session not found');

      const allAssignments = await tx.$queryRawUnsafe<any[]>(
        `SELECT * FROM multitenant.pick_cart_assignments
         WHERE tenant_id = $1::uuid AND session_id = $2 AND tote_barcode = ANY($3::text[])
         ORDER BY shelf_position`,
        tenantId, session.session_id, distributions.map((d) => d.toteBarcode),
      );

      const assignmentMap = new Map<string, any>();
      for (const a of allAssignments) {
        assignmentMap.set(a.tote_barcode, a);
      }

      const auditEntries: { toteBarcode: string; shelfPosition: string; quantity: number }[] = [];

      for (const dist of distributions) {
        const assignment = assignmentMap.get(dist.toteBarcode);
        if (!assignment) {
          throw new BadRequestException(`Tote ${dist.toteBarcode} not found in this session`);
        }

        await tx.inventory_transactions.create({
          data: {
            tenant_id: tenantId,
            facility_id: task.facility_id,
            reference_type: 'CLUSTER_PICK',
            reference_id: task.task_id,
            product_id: task.product_id,
            lot_id: task.lot_id,
            from_location_id: task.to_location_id || task.from_location_id,
            to_location_id: null,
            transaction_type: 'TRANSFER',
            transaction_status: 'COMPLETED',
            quantity: dist.quantity,
            uom_id: Number(task.uom_id),
            reason_code: 'CLUSTER_DISTRIBUTION',
            notes: `Distributed ${dist.quantity} to tote ${dist.toteBarcode} (${assignment.shelf_position})`,
          },
        });

        await tx.pick_audit_log.create({
          data: {
            tenant_id: tenantId,
            task_id: task.task_id,
            product_id: task.product_id,
            qty_picked: dist.quantity,
            event_type: 'CLUSTER_DISTRIBUTE',
            notes: `Distributed ${dist.quantity} to tote ${dist.toteBarcode} (${assignment.shelf_position})`,
            recorded_by: null,
          },
        });
        auditEntries.push({ toteBarcode: dist.toteBarcode, shelfPosition: assignment.shelf_position, quantity: dist.quantity });
      }

      await tx.picking_tasks.updateMany({
        where: { tenant_id: tenantId, task_id: taskId },
        data: { notes: `Distributed: ${auditEntries.map((e) => `${e.toteBarcode}=${e.quantity}`).join(', ')}` },
      });

      this.logger.log(`Pick task ${taskId} distributed: ${auditEntries.map((e) => `${e.toteBarcode}=${e.quantity}`).join(', ')}`);

      return { taskId: taskId.toString(), distributions: auditEntries };
    });
  }

  async completeClusterSession(tenantId: string, sessionId: bigint) {
    const [session] = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM multitenant.cluster_pick_groups WHERE tenant_id = $1::uuid AND session_id = $2`,
      tenantId, sessionId,
    );
    if (!session) throw new BadRequestException('Cluster pick session not found');
    if (session.status === 'COMPLETED') {
      throw new BadRequestException('Cluster pick session is already completed');
    }

    await this.prisma.$executeRawUnsafe(
      `UPDATE multitenant.cluster_pick_groups
       SET status = 'COMPLETED', completed_at = NOW()
       WHERE tenant_id = $1::uuid AND session_id = $2`,
      tenantId, sessionId,
    );

    const [updated] = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM multitenant.cluster_pick_groups WHERE tenant_id = $1::uuid AND session_id = $2`,
      tenantId, sessionId,
    );

    this.logger.log(`Cluster pick session ${sessionId} completed`);

    return updated;
  }
}
