import { Global, Module } from '@nestjs/common';
import { RfSessionService } from './rf-session.service';
import { RfSessionController } from './rf-session.controller';
import { RfSessionGuard } from '../common/guards/rf-session.guard';

@Global()
@Module({
  controllers: [RfSessionController],
  providers: [RfSessionService, RfSessionGuard],
  exports: [RfSessionService, RfSessionGuard],
})
export class RfSessionModule {}
