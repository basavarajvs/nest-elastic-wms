import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RfSessionService } from './rf-session.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [RfSessionService],
  exports: [RfSessionService],
})
export class RfSessionModule {}
