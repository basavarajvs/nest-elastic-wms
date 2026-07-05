import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RfSessionService } from '../common/rf-session/rf-session.service';
import { RfSessionGuard } from './guards/rf-session.guard';
import { RfActionLightweightGuard } from './guards/rf-action-lightweight.guard';
import { RfSessionController } from './rf-session.controller';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [RfSessionController],
  providers: [
    RfSessionService,
    RfSessionGuard,
    RfActionLightweightGuard,
  ],
  exports: [
    RfSessionService,
    RfSessionGuard,
    RfActionLightweightGuard,
  ],
})
export class RfModule {}
