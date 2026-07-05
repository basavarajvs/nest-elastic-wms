import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DockYardService } from './dock-yard.service';
import { DockYardWebController } from './web/dock-yard.controller';
import { DockYardRfController } from './rf/dock-yard.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DockYardWebController, DockYardRfController],
  providers: [DockYardService],
  exports: [DockYardService],
})
export class DockYardModule {}
