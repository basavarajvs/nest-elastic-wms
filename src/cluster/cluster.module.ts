import { Global, Module } from '@nestjs/common';
import { ClusterService } from './cluster.service';

@Global()
@Module({
  providers: [ClusterService],
  exports: [ClusterService],
})
export class ClusterModule {}
