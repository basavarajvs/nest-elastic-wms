import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReservationDto } from './dtos/create-reservation.dto';

@Injectable()
export class InventoryReservationsService {
  private readonly logger = new Logger(InventoryReservationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReservationDto, tenantId: string, userId?: string) {
    const onHand = await (this.prisma as any).inventoryOnHand.findFirst({
      where: {
        tenantId,
        facilityId: dto.facilityId,
        productId: dto.productId,
        locationId: dto.locationId,
        lotId: dto.lotId || undefined,
      },
    });

    const available = (onHand?.quantityOnHand || 0) - (onHand?.quantityReserved || 0) - (onHand?.quantityAllocated || 0);
    if (available < dto.quantity) {
      throw new BadRequestException(`Insufficient available inventory: ${available} available, ${dto.quantity} requested`);
    }

    return (this.prisma as any).$transaction(async (tx: any) => {
      const reservation = await tx.inventoryReservation.create({
        data: {
          tenantId,
          facilityId: dto.facilityId,
          productId: dto.productId,
          locationId: dto.locationId,
          lotId: dto.lotId || null,
          quantity: dto.quantity,
          uomId: dto.uomId,
          reservationType: dto.reservationType,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          createdByUserId: userId || null,
        },
      });

      if (onHand) {
        await tx.inventoryOnHand.update({
          where: { id: onHand.id },
          data: { quantityReserved: { increment: dto.quantity } },
        });
      }

      this.logger.log(`Reservation created: ${reservation.id} for ${dto.productId}`);
      return reservation;
    });
  }

  async findAll(tenantId: string, facilityId?: string, status?: string) {
    const where: Record<string, any> = { tenantId };
    if (facilityId) where.facilityId = facilityId;
    if (status) where.status = status;
    return (this.prisma as any).inventoryReservation.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string, tenantId: string) {
    const r = await (this.prisma as any).inventoryReservation.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException('Reservation not found');
    return r;
  }

  async release(id: string, tenantId: string, userId?: string) {
    const reservation = await (this.prisma as any).inventoryReservation.findFirst({ where: { id, tenantId } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.status !== 'ACTIVE') throw new BadRequestException('Reservation is not active');

    return (this.prisma as any).$transaction(async (tx: any) => {
      await tx.inventoryReservation.update({
        where: { id },
        data: { status: 'RELEASED', releasedByUserId: userId || null, releasedAt: new Date() },
      });

      const onHand = await tx.inventoryOnHand.findFirst({
        where: {
          tenantId,
          facilityId: reservation.facilityId,
          productId: reservation.productId,
          locationId: reservation.locationId,
          lotId: reservation.lotId || undefined,
        },
      });

      if (onHand) {
        await tx.inventoryOnHand.update({
          where: { id: onHand.id },
          data: { quantityReserved: { decrement: reservation.quantity } },
        });
      }

      this.logger.log(`Reservation released: ${id}`);
      return { released: true, reservationId: id };
    });
  }

  async update(id: string, tenantId: string, data: { quantity?: number; expiresAt?: string; status?: string }) {
    const reservation = await (this.prisma as any).inventoryReservation.findFirst({ where: { id, tenantId } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    return (this.prisma as any).inventoryReservation.update({ where: { id }, data });
  }

  async delete(id: string, tenantId: string) {
    const reservation = await (this.prisma as any).inventoryReservation.findFirst({ where: { id, tenantId } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    await (this.prisma as any).inventoryReservation.delete({ where: { id } });
  }
}
