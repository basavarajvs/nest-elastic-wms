import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InventoryReservationsService } from './inventory-reservations.service';
import { InventoryReservationsWebController } from './web/inventory-reservations.controller';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryReservationsWebController],
  providers: [InventoryReservationsService],
  exports: [InventoryReservationsService],
})
export class InventoryReservationsModule {}
