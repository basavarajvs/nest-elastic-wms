import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { ClientService } from '../client.service';
import { ClientResponseDto, FacilityAssignmentDto, ClientAddressDto, ClientContactDto, CreateClientDto, UpdateClientDto, CreateClientAddressDto, CreateClientContactDto } from '../dtos/client-response.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Clients')
@Controller('web/clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @ApiOperation({ summary: 'Create client with optional addresses and contacts' })
  @ApiCreatedResponse({ type: ClientResponseDto })
  async create(@Req() req: any, @Body() dto: CreateClientDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clientService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List clients' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Req() req: any, @Query() query: any) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clientService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client with addresses, contacts, facility assignments' })
  @ApiOkResponse({ type: ClientResponseDto })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clientService.getClientSummary(tenantId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client' })
  @ApiOkResponse({ type: ClientResponseDto })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateClientDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clientService.update(tenantId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete client' })
  @ApiOkResponse({ type: ClientResponseDto })
  async delete(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clientService.delete(tenantId, BigInt(id));
  }

  @Post(':id/assign-facility/:facilityId')
  @ApiOperation({ summary: 'Assign client to facility' })
  @ApiCreatedResponse({ type: FacilityAssignmentDto })
  async assignToFacility(@Req() req: any, @Param('id') id: string, @Param('facilityId') facilityId: string) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clientService.assignToFacility(tenantId, BigInt(id), BigInt(facilityId));
  }

  @Post(':id/addresses')
  @ApiOperation({ summary: 'Add client address' })
  @ApiCreatedResponse({ type: ClientAddressDto })
  async addAddress(@Req() req: any, @Param('id') id: string, @Body() dto: CreateClientAddressDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clientService.addAddress(tenantId, BigInt(id), dto);
  }

  @Post(':id/contacts')
  @ApiOperation({ summary: 'Add client contact' })
  @ApiCreatedResponse({ type: ClientContactDto })
  async addContact(@Req() req: any, @Param('id') id: string, @Body() dto: CreateClientContactDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.clientService.addContact(tenantId, BigInt(id), dto);
  }
}
