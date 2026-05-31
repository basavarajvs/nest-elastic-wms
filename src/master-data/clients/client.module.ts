import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientWebController } from './web/client.controller';
import { ClientContactWebController } from './web/client-contact.controller';
import { ClientAddressWebController } from './web/client-address.controller';

@Module({
  controllers: [ClientWebController, ClientContactWebController, ClientAddressWebController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}
