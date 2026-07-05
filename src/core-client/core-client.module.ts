import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreClientService } from './core-client.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [CoreClientService],
  exports: [CoreClientService],
})
export class CoreClientModule {}
