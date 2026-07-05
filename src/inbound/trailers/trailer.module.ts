import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InboundTrailerService } from './trailer.service';
import { InboundTrailerWebController } from './web/trailer.controller';
import { RfInboundTrailerController } from './rf/trailer.controller';

@Module({
  imports: [PrismaModule],
  controllers: [InboundTrailerWebController, RfInboundTrailerController],
  providers: [InboundTrailerService],
  exports: [InboundTrailerService],
})
export class InboundTrailerModule {}
