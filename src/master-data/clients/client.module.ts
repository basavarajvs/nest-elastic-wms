import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientWebController } from './web/client.controller';
import { ClientContactWebController } from './web/client-contact.controller';
import { ClientAddressWebController } from './web/client-address.controller';
import { ClientFacilityAssignmentService } from './client-facility-assignment.service';
import { ClientFacilityAssignmentWebController } from './web/client-facility-assignment.controller';

@Module({
  controllers: [ClientWebController, ClientContactWebController, ClientAddressWebController, ClientFacilityAssignmentWebController],
  providers: [ClientService, ClientFacilityAssignmentService],
  exports: [ClientService, ClientFacilityAssignmentService],
})
export class ClientModule {}
