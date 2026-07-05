import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TransfersService } from './transfers.service';
import { TransferWebController } from './web/transfer.controller';
import { TransferRfController } from './rf/transfer.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TransferWebController, TransferRfController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
