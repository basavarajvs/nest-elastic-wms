import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupervisorPinService } from './supervisor-pin.service';
import { SecurityWebController } from './web/security.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SecurityWebController],
  providers: [SupervisorPinService],
  exports: [SupervisorPinService],
})
export class SecurityModule {}
