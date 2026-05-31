import { Module } from '@nestjs/common';
import { LpnService } from './lpn.service';
import { LpnWebController } from './web/lpn.controller';
import { LpnRfController } from './rf/lpn.controller';

@Module({
  controllers: [LpnWebController, LpnRfController],
  providers: [LpnService],
  exports: [LpnService],
})
export class LpnModule {}
