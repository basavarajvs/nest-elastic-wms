import { Global, Module } from '@nestjs/common';
import { WmsAbilityFactory } from './wms-ability.factory';
import { JwtValidationService } from '../common/auth/jwt-validation.service';

@Global()
@Module({
  providers: [WmsAbilityFactory, JwtValidationService],
  exports: [WmsAbilityFactory, JwtValidationService],
})
export class CaslModule {}
