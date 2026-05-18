import { Global, Module } from '@nestjs/common';
import { WmsRoleSeederService } from './wms-role-seeder.service';

@Global()
@Module({
  providers: [WmsRoleSeederService],
  exports: [WmsRoleSeederService],
})
export class SeedModule {}
