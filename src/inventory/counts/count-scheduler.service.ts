import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CountSchedulerService {
  private readonly logger = new Logger(CountSchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  // GAP-6.2: Generate scheduled counts based on ABC classification
  async generateScheduledCounts(tenantId: string, facilityId: bigint) {
    const products = await this.prisma.products.findMany({
      where: {
        tenant_id: tenantId,
        is_active: true,
        next_count_due_at: { lte: new Date() },
      },
    });

    let aItems = 0, bItems = 0, cItems = 0, errors = 0;
    const createdCounts: any[] = [];

    // Group by location zone
    const productsByLocation: Record<string, any[]> = {};
    for (const product of products) {
      const onHand = await this.prisma.inventory_on_hand.findFirst({
        where: { tenant_id: tenantId, facility_id: facilityId, product_id: product.product_id },
      });
      if (!onHand) continue;
      const locKey = onHand.location_id.toString();
      if (!productsByLocation[locKey]) productsByLocation[locKey] = [];
      productsByLocation[locKey].push(product);

      if (product.abc_analysis_class === 'A') aItems++;
      else if (product.abc_analysis_class === 'B') bItems++;
      else cItems++;
    }

    for (const [locationIdStr, prods] of Object.entries(productsByLocation)) {
      try {
        const count = await this.prisma.inventory_counts.create({
          data: {
            tenant_id: tenantId,
            facility_id: facilityId,
            count_number: `SCH-${facilityId}-${Date.now()}-${locationIdStr}`,
            count_name: `Scheduled count for location ${locationIdStr}`,
            count_scope_type: 'LOCATION',
            count_scope_identifier: BigInt(locationIdStr),
            status: 'CREATED',
            auto_generated: true,
            last_auto_generated_date: new Date(),
            count_method: 'CYCLE',
            count_frequency_type: 'ABC_DRIVEN',
            count_priority: prods.some(p => p.abc_analysis_class === 'A') ? 'HIGH' : 'MEDIUM',
            is_blind_count: true,
            count_type: 'SCHEDULED',
          },
        });
        createdCounts.push(count);
        // Transition to READY
        await this.prisma.inventory_counts.update({
          where: { count_id: count.count_id },
          data: { status: 'READY' },
        });
      } catch (err) {
        errors++;
        this.logger.error(`Failed to create scheduled count for location ${locationIdStr}: ${(err as Error).message}`);
      }
    }

    // GAP-6.4: Record metrics
    await this.prisma.count_scheduler_metrics.create({
      data: {
        tenant_id: tenantId,
        facility_id: facilityId,
        schedule_run_at: new Date(),
        total_counts_created: createdCounts.length,
        a_items_created: aItems,
        b_items_created: bItems,
        c_items_created: cItems,
        errors_count: errors,
      },
    });

    this.logger.log(`Scheduled count generation: ${createdCounts.length} counts, A=${aItems} B=${bItems} C=${cItems} errors=${errors}`);
    return { totalCountsCreated: createdCounts.length, aItems, bItems, cItems, errors };
  }

  // APP-CC-J: Dynamic ABC reclassification
  async reclassifyABC(tenantId: string, facilityId: bigint) {
    const products = await this.prisma.products.findMany({
      where: { tenant_id: tenantId, is_active: true },
    });

    let reclassified = 0;
    for (const product of products) {
      // Calculate movement based on inventory transactions (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const movements = await this.prisma.inventory_transactions.aggregate({
        where: {
          tenant_id: tenantId,
          product_id: product.product_id,
          transaction_timestamp: { gte: ninetyDaysAgo },
        },
        _sum: { quantity: true },
        _count: true,
      });

      const totalMovement = Number(movements._sum?.quantity || 0);
      const movementCount = movements._count || 0;

      // Simple ABC classification: A = top 20% movement, B = middle 30%, C = bottom 50%
      let newClass = 'C';
      let newFreq = 90;
      if (movementCount >= 50 || totalMovement >= 1000) {
        newClass = 'A';
        newFreq = 7;
      } else if (movementCount >= 20 || totalMovement >= 200) {
        newClass = 'B';
        newFreq = 30;
      }

      const oldClass = product.abc_analysis_class || 'C';
      if (oldClass !== newClass) {
        await this.prisma.products.update({
          where: { product_id: product.product_id },
          data: {
            abc_analysis_class: newClass,
            default_cycle_count_frequency_days: newFreq,
          },
        });
        await this.prisma.abc_reclassification_log.create({
          data: {
            tenant_id: tenantId,
            product_id: product.product_id,
            old_class: oldClass,
            new_class: newClass,
            old_frequency: product.default_cycle_count_frequency_days || 30,
            new_frequency: newFreq,
            reason: `Movement: ${totalMovement} qty, ${movementCount} txns in 90 days`,
            reclassified_at: new Date(),
          },
        });
        reclassified++;
      }
    }

    this.logger.log(`ABC reclassification: ${reclassified} products reclassified`);
    return { reclassified };
  }

  async getSchedulerMetrics(tenantId: string, facilityId: bigint) {
    return this.prisma.count_scheduler_metrics.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId },
      orderBy: { schedule_run_at: 'desc' },
      take: 10,
    });
  }
}
