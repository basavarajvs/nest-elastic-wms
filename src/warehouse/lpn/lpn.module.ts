import { Module } from '@nestjs/common';
import { LpnService } from './lpn.service';
import { LpnTransactionService } from './lpn-transaction.service';
import { LpnWebController } from './web/lpn.controller';
import { LpnTransactionsWebController } from './web/lpn-transactions.controller';
import { LpnRfController } from './rf/lpn.controller';

@Module({
  controllers: [LpnWebController, LpnTransactionsWebController, LpnRfController],
  providers: [LpnService, LpnTransactionService],
  exports: [LpnService, LpnTransactionService],
})
export class LpnModule {}
