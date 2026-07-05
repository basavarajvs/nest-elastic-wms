import { Controller, Post, Get, Patch, Param, Body, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { CaslGuard } from '../../../common/guards/casl.guard';
import { CheckAbility } from '../../../common/decorators/check-ability.decorator';
import { TrailerService } from '../trailer.service';

@Controller('web/trailers')
@UseGuards(JwtAuthGuard, CaslGuard)
export class TrailerWebController {
  constructor(private readonly trailerService: TrailerService) {}

  private getTenant(req: any): string {
    return req.tenantContext.getTenantId();
  }

  @Post()
  @CheckAbility({ action: 'create', subject: 'Trailer' })
  async create(@Req() req: any, @Body() dto: any) {
    return this.trailerService.create(this.getTenant(req), dto);
  }

  @Get()
  @CheckAbility({ action: 'read', subject: 'Trailer' })
  async findAll(@Req() req: any, @Query() query: any) {
    return this.trailerService.findAll(this.getTenant(req), query);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Trailer' })
  async findById(@Req() req: any, @Param('id') id: string) {
    return this.trailerService.findById(this.getTenant(req), BigInt(id));
  }

  @Patch(':id')
  @CheckAbility({ action: 'update', subject: 'Trailer' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.trailerService.update(this.getTenant(req), BigInt(id), dto);
  }

  @Post(':id/assign-load/:loadId')
  @CheckAbility({ action: 'update', subject: 'Trailer' })
  async assignToLoad(@Req() req: any, @Param('id') id: string, @Param('loadId') loadId: string) {
    return this.trailerService.assignToLoad(this.getTenant(req), BigInt(id), BigInt(loadId));
  }

  @Post(':id/assign-dock/:dockId')
  @CheckAbility({ action: 'update', subject: 'Trailer' })
  async assignToDock(@Req() req: any, @Param('id') id: string, @Param('dockId') dockId: string) {
    return this.trailerService.assignToDock(this.getTenant(req), BigInt(id), BigInt(dockId));
  }

  @Post(':id/depart')
  @CheckAbility({ action: 'update', subject: 'Trailer' })
  async depart(@Req() req: any, @Param('id') id: string) {
    return this.trailerService.depart(this.getTenant(req), BigInt(id));
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'Trailer' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.trailerService.delete(this.getTenant(req), BigInt(id));
  }
}
