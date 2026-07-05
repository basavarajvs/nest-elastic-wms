import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WmsRoleSeederService } from './wms-role-seeder.service';
import { UomSeederService } from './uom-seeder.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [WmsRoleSeederService, UomSeederService],
  exports: [WmsRoleSeederService, UomSeederService],
})
export class SeedModule {}
