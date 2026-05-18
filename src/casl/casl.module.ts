import { Global, Module } from '@nestjs/common';
import { WmsAbilityFactory } from './wms-ability.factory';

@Global()
@Module({
  providers: [WmsAbilityFactory],
  exports: [WmsAbilityFactory],
})
export class CaslModule {}
