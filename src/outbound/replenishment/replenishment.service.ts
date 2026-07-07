import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReplenishmentService {
  private readonly logger = new Logger(ReplenishmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async deleteRule(tenantId: string, ruleId: bigint) {
    const rule = await this.findRuleById(tenantId, ruleId);
    await this.prisma.replenishment_rules.deleteMany({
      where: { tenant_id: tenantId, rule_id: ruleId },
    });
    return rule;
  }

  async deleteTask(tenantId: string, taskId: bigint) {
    const task = await this.findTaskById(tenantId, taskId);
    await this.prisma.replenishment_tasks.deleteMany({
      where: { tenant_id: tenantId, task_id: taskId },
    });
    return task;
  }

  async createRule(tenantId: string, userId: string | undefined, dto: any) {
    return this.prisma.replenishment_rules.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facility_id),
        product_id: BigInt(dto.product_id),
        from_location_id: dto.from_location_id ? BigInt(dto.from_location_id) : undefined,
        to_location_id: dto.to_location_id ? BigInt(dto.to_location_id) : undefined,
        zone_id: dto.zone_id ? BigInt(dto.zone_id) : undefined,
        min_quantity: dto.min_quantity,
        max_quantity: dto.max_quantity,
        reorder_point: dto.reorder_point,
        reorder_quantity: dto.reorder_quantity,
        priority: dto.priority ?? 5,
        is_active: dto.is_active ?? true,
        auto_generate_tasks: dto.auto_generate_tasks ?? true,
        notes: dto.notes,
        created_by: userId,
        updated_by: userId,
      },
    });
  }

  async findAllRules(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.productId) where.product_id = BigInt(query.productId);
    if (query.isActive !== undefined) where.is_active = query.isActive === 'true' || query.isActive === true;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const [rows, total] = await Promise.all([
      this.prisma.replenishment_rules.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { priority: 'asc' },
        include: {
          warehouse_facilities: true,
          products: true,
          storage_locations_replenishment_rules_from_location_idTostorage_locations: true,
          storage_locations_replenishment_rules_to_location_idTostorage_locations: true,
        },
      }),
      this.prisma.replenishment_rules.count({ where }),
    ]);
    const data = rows.map(r => ({
      ...r,
      facility_name: r.warehouse_facilities?.facility_name,
      product_name: r.products?.product_name,
      from_location_name: r.storage_locations_replenishment_rules_from_location_idTostorage_locations?.location_name,
      to_location_name: r.storage_locations_replenishment_rules_to_location_idTostorage_locations?.location_name,
      warehouse_facilities: undefined,
      products: undefined,
      storage_locations_replenishment_rules_from_location_idTostorage_locations: undefined,
      storage_locations_replenishment_rules_to_location_idTostorage_locations: undefined,
    }));
    return { data, total, page, limit };
  }

  async findRuleById(tenantId: string, ruleId: bigint) {
    const rule = await this.prisma.replenishment_rules.findFirst({
      where: { tenant_id: tenantId, rule_id: ruleId },
      include: {
        warehouse_facilities: true,
        products: true,
        storage_locations_replenishment_rules_from_location_idTostorage_locations: true,
        storage_locations_replenishment_rules_to_location_idTostorage_locations: true,
      },
    });
    if (!rule) throw new NotFoundException('Replenishment rule not found');
    return {
      ...rule,
      facility_name: rule.warehouse_facilities?.facility_name,
      product_name: rule.products?.product_name,
      from_location_name: rule.storage_locations_replenishment_rules_from_location_idTostorage_locations?.location_name,
      to_location_name: rule.storage_locations_replenishment_rules_to_location_idTostorage_locations?.location_name,
      warehouse_facilities: undefined,
      products: undefined,
      storage_locations_replenishment_rules_from_location_idTostorage_locations: undefined,
      storage_locations_replenishment_rules_to_location_idTostorage_locations: undefined,
    };
  }

  async updateRule(tenantId: string, ruleId: bigint, userId: string | undefined, dto: any) {
    await this.findRuleById(tenantId, ruleId);
    const data: Record<string, any> = { updated_by: userId };
    if (dto.min_quantity !== undefined) data.min_quantity = dto.min_quantity;
    if (dto.max_quantity !== undefined) data.max_quantity = dto.max_quantity;
    if (dto.reorder_point !== undefined) data.reorder_point = dto.reorder_point;
    if (dto.reorder_quantity !== undefined) data.reorder_quantity = dto.reorder_quantity;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (dto.auto_generate_tasks !== undefined) data.auto_generate_tasks = dto.auto_generate_tasks;
    if (dto.notes !== undefined) data.notes = dto.notes;

    await this.prisma.replenishment_rules.updateMany({
      where: { tenant_id: tenantId, rule_id: ruleId },
      data,
    });
    return this.findRuleById(tenantId, ruleId);
  }

  async findAllTasks(tenantId: string, query: any) {
    const where: any = { tenant_id: tenantId };
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);
    if (query.status) where.status = query.status;
    if (query.ruleId) where.rule_id = BigInt(query.ruleId);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const [rows, total] = await Promise.all([
      this.prisma.replenishment_tasks.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_date: 'desc' },
        include: {
          warehouse_facilities: true,
          products: true,
          storage_locations_replenishment_tasks_from_location_idTostorage_locations: true,
          storage_locations_replenishment_tasks_to_location_idTostorage_locations: true,
        },
      }),
      this.prisma.replenishment_tasks.count({ where }),
    ]);
    const data = rows.map(r => ({
      ...r,
      facility_name: r.warehouse_facilities?.facility_name,
      product_name: r.products?.product_name,
      from_location_name: r.storage_locations_replenishment_tasks_from_location_idTostorage_locations?.location_name,
      to_location_name: r.storage_locations_replenishment_tasks_to_location_idTostorage_locations?.location_name,
      warehouse_facilities: undefined,
      products: undefined,
      storage_locations_replenishment_tasks_from_location_idTostorage_locations: undefined,
      storage_locations_replenishment_tasks_to_location_idTostorage_locations: undefined,
    }));
    return { data, total, page, limit };
  }

  async findTaskById(tenantId: string, taskId: bigint) {
    const task = await this.prisma.replenishment_tasks.findFirst({
      where: { tenant_id: tenantId, task_id: taskId },
      include: {
        warehouse_facilities: true,
        products: true,
        storage_locations_replenishment_tasks_from_location_idTostorage_locations: true,
        storage_locations_replenishment_tasks_to_location_idTostorage_locations: true,
      },
    });
    if (!task) throw new NotFoundException('Replenishment task not found');
    return {
      ...task,
      facility_name: task.warehouse_facilities?.facility_name,
      product_name: task.products?.product_name,
      from_location_name: task.storage_locations_replenishment_tasks_from_location_idTostorage_locations?.location_name,
      to_location_name: task.storage_locations_replenishment_tasks_to_location_idTostorage_locations?.location_name,
      warehouse_facilities: undefined,
      products: undefined,
      storage_locations_replenishment_tasks_from_location_idTostorage_locations: undefined,
      storage_locations_replenishment_tasks_to_location_idTostorage_locations: undefined,
    };
  }

  async updateTask(tenantId: string, taskId: bigint, userId: string | undefined, dto: any) {
    await this.findTaskById(tenantId, taskId);
    const data: Record<string, any> = { updated_by: userId };
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.quantity_moved !== undefined) data.quantity_moved = dto.quantity_moved;
    if (dto.assigned_to_user_id !== undefined) data.assigned_to_user_id = dto.assigned_to_user_id;

    if (dto.status === 'IN_PROGRESS' || dto.status === 'IN_PROGRESS') {
      data.started_at = new Date();
    }
    if (dto.status === 'COMPLETED') {
      data.completed_at = new Date();
      if (dto.quantity_moved === undefined) {
        const task = await this.findTaskById(tenantId, taskId);
        data.quantity_moved = task.quantity_requested;
      }
    }

    await this.prisma.replenishment_tasks.updateMany({
      where: { tenant_id: tenantId, task_id: taskId },
      data,
    });
    return this.findTaskById(tenantId, taskId);
  }

  /** RF: Get the highest-priority PENDING replenishment task for a facility */
  async getNextTask(tenantId: string, facilityId: string) {
    return this.prisma.replenishment_tasks.findFirst({
      where: {
        tenant_id: tenantId,
        facility_id: BigInt(facilityId),
        status: 'PENDING',
      },
      orderBy: [{ priority: 'asc' }, { task_id: 'asc' }],
    });
  }

  /** RF: Validate scanned location matches the task's from_location */
  async scanLocation(tenantId: string, taskId: string, locationCode: string) {
    const task = await this.findTaskById(tenantId, BigInt(taskId));
    const location = await this.prisma.storage_locations.findFirst({
      where: { tenant_id: tenantId, location_code: locationCode },
    });
    if (!location) throw new NotFoundException('Location not found');
    if (Number(location.location_id) !== Number(task.from_location_id)) {
      throw new NotFoundException('Scanned location does not match expected replenishment source location');
    }
    return { task, location, locationVerified: true };
  }

  /** RF: Validate scanned product matches the task's product */
  async scanProduct(tenantId: string, taskId: string, productCode: string) {
    const task = await this.findTaskById(tenantId, BigInt(taskId));
    let product = await this.prisma.products.findFirst({
      where: { tenant_id: tenantId, product_code: productCode },
    });
    if (!product) {
      const pb = await this.prisma.product_barcodes.findFirst({
        where: { tenant_id: tenantId, barcode_value: productCode },
        include: { products: true },
      });
      product = pb?.products || null;
    }
    if (!product) throw new NotFoundException('Product not found');
    if (Number(product.product_id) !== Number(task.product_id)) {
      throw new NotFoundException('Scanned product does not match expected product');
    }
    return { task, product, productVerified: true };
  }

  /** RF: Confirm replenishment — mark COMPLETED, update inventory on-hand */
  async confirmTask(tenantId: string, taskId: string, userId: string) {
    const task = await this.findTaskById(tenantId, BigInt(taskId));
    if (task.status === 'COMPLETED') throw new NotFoundException('Task is already completed');

    const movedQty = Number(task.quantity_moved || task.quantity_requested);

    await this.prisma.replenishment_tasks.updateMany({
      where: { tenant_id: tenantId, task_id: BigInt(taskId) },
      data: {
        status: 'COMPLETED',
        quantity_moved: movedQty,
        completed_at: new Date(),
        updated_by: userId,
      },
    });

    // Decrement from source location
    const sourceWhere: any = {
      tenant_id: tenantId,
      facility_id: task.facility_id,
      product_id: task.product_id,
      location_id: task.from_location_id,
    };
    if (task.lot_id) sourceWhere.lot_id = task.lot_id;
    else sourceWhere.lot_id = null;
    await this.prisma.inventory_on_hand.updateMany({
      where: sourceWhere,
      data: { quantity_on_hand: { decrement: movedQty } },
    });

    // Increment at destination location (upsert)
    const destWhere: any = {
      tenant_id: tenantId,
      facility_id: task.facility_id,
      product_id: task.product_id,
      location_id: task.to_location_id,
    };
    if (task.lot_id) destWhere.lot_id = task.lot_id;
    else destWhere.lot_id = null;
    const existingOnHand = await this.prisma.inventory_on_hand.findFirst({
      where: destWhere,
    });

    if (existingOnHand) {
      await this.prisma.inventory_on_hand.updateMany({
        where: { on_hand_id: existingOnHand.on_hand_id },
        data: { quantity_on_hand: { increment: movedQty } },
      });
    } else {
      await this.prisma.inventory_on_hand.create({
        data: {
          tenant_id: tenantId,
          facility_id: task.facility_id,
          product_id: task.product_id,
          location_id: task.to_location_id,
          lot_id: task.lot_id,
          quantity_on_hand: movedQty,
          uom_id: task.uom_id ?? 1,
        },
      });
    }

    return this.findTaskById(tenantId, BigInt(taskId));
  }
}
