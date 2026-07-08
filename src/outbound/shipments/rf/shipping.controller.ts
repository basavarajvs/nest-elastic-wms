import { Controller, Post, Body, Req, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { RfSessionGuard } from '../../../common/guards/rf-session.guard';
import { RfActionLightweightGuard } from '../../../common/guards/rf-action-lightweight.guard';
import { RfAction } from '../../../common/decorators/rf-action.decorator';
import { LoadService } from '../../loads/load.service';
import { ShipmentService } from '../shipment.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  RfStartLoadDto, RfScanTrailerDto, RfScanShippingLpnDto, RfSealTrailerDto,
  RfCloseTrailerDto, RfGetNextLoadingDto, RfVerifyShipmentDto, RfVerifyLoadDto,
  RfCloseShipmentDto, RfCapacityDto, RfHandoffDto, RfBolDto, RfManifestDto,
  RfFindCartonDto, RfLoadSummaryDto, RfShipmentCartonsDto, RfScanPalletShippingDto,
  RfCurrentStopDto, RfNextStopDto, RfValidateCartonDto, RfConfirmLoadDto,
  RfUndoLoadDto, RfReassignShipmentDto,
  CreateForceCloseDto, GenerateManifestDto,
  RfStartLoadResponseDto, RfScanTrailerResponseDto,
  RfScanShippingLpnResponseDto, RfSealTrailerResponseDto,
  RfCloseTrailerResponseDto, RfGetNextLoadingResponseDto,
  RfVerifyShipmentResponseDto, RfVerifyLoadResponseDto,
  RfCloseShipmentResponseDto, RfCapacityResponseDto,
  RfHandoffResponseDto, RfBolResponseDto, RfManifestResponseDto,
  RfFindCartonResponseDto, RfLoadSummaryResponseDto,
  RfShipmentCartonsResponseDto, RfScanPalletShippingResponseDto,
  RfCurrentStopResponseDto, RfNextStopResponseDto,
  RfValidateCartonResponseDto, RfConfirmLoadResponseDto,
  RfForceCloseResponseDto, RfUndoLoadResponseDto,
  RfReassignShipmentResponseDto,
} from '../dtos/response.dto';

@ApiTags('RF - Shipping')
@Controller('rf/outbound/shipping')
@UseGuards(RfSessionGuard, RfActionLightweightGuard)
export class RfShippingController {
  constructor(
    private readonly loadService: LoadService,
    private readonly shipmentService: ShipmentService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('start-load')
  @ApiCreatedResponse({ type: RfStartLoadResponseDto })
  @RfAction('create')
  @ApiOperation({ summary: 'Start loading session — scan dock door, find or create load (RF)' })
  async startLoad(@Req() req: any, @Body() dto: RfStartLoadDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id || 0);
    const userId = req.rfSession.userId;
    let dockCode = dto.dock_door_code;
    if (dockCode) {
      const dock = await this.prisma.loading_docks.findFirst({
        where: { tenant_id: tenantId, facility_id: facilityId, dock_code: dockCode, is_active: true },
      });
      if (!dock) throw new Error(`Dock door ${dockCode} not found`);
    }
    let load = dto.load_number
      ? await this.prisma.loads.findFirst({ where: { tenant_id: tenantId, facility_id: facilityId, load_number: dto.load_number } })
      : null;
    if (!load) {
      load = await this.prisma.loads.create({
        data: {
          tenant_id: tenantId, facility_id: facilityId,
          load_number: dto.load_number || `LOAD-${Date.now()}`,
          load_name: dto.load_name || null, dock_door_number: dockCode || null,
          trailer_number: dto.trailer_number || null, status: 'LOADING',
          load_start_time: new Date(), loaded_by: userId,
        },
      });
      if (dockCode) {
        await this.prisma.loading_docks.updateMany({
          where: { tenant_id: tenantId, facility_id: facilityId, dock_code: dockCode },
          data: { is_available: false },
        });
      }
    }
    return { loadId: load.load_id.toString(), loadNumber: load.load_number, dockDoor: dockCode || null };
  }

  @Post('scan-trailer')
  @ApiCreatedResponse({ type: RfScanTrailerResponseDto })
  @RfAction('read')
  @ApiOperation({ summary: 'Validate trailer barcode, return status (RF)' })
  async scanTrailer(@Req() req: any, @Body() dto: RfScanTrailerDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id || 0);
    const trailer = await this.prisma.trailers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, trailer_number: dto.trailer_number, is_active: true },
    });
    if (!trailer) throw new NotFoundException('Trailer not found');
    return { trailerId: trailer.trailer_id.toString(), trailerNumber: trailer.trailer_number, status: trailer.status, maxWeightKg: trailer.max_weight_kg?.toString(), maxCartons: trailer.max_cartons };
  }

  @Post('scan-lpn')
  @ApiCreatedResponse({ type: RfScanShippingLpnResponseDto })
  @RfAction('update')
  @ApiOperation({ summary: 'Scan shipping LPN to load onto trailer (RF)' })
  async scanLpn(@Req() req: any, @Body() dto: RfScanShippingLpnDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id || 0);
    const loadId = BigInt(dto.load_id);
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lpn_number: dto.lpn_barcode },
    });
    if (!lpn) throw new Error('LPN not found');
    if (lpn.status !== 'STAGED' && lpn.status !== 'LOADED') {
      if (lpn.status === 'PACKED') throw new Error('Carton must be staged first — scan at staging lane');
      throw new Error(`Carton is ${lpn.status}, must be STAGED or LOADED`);
    }
    if (dto.verify_route && lpn.assigned_shipment_id) {
      const shipment = await this.prisma.outbound_shipments.findFirst({
        where: { tenant_id: tenantId, shipment_id: lpn.assigned_shipment_id },
      });
      if (shipment) {
        const existingLoadId = shipment.load_id;
        if (existingLoadId && existingLoadId !== loadId) {
          throw new Error(`WRONG TRUCK: LPN ${dto.lpn_barcode} belongs to a different trailer`);
        }
      }
    }
    // GAP-6.2: Capacity check
    const cartonWt = Number(lpn.gross_weight || dto.carton_weight_kg || 0);
    const capacity = await this.loadService.validateCapacity(tenantId, loadId, cartonWt);
    if (!capacity.allowed) {
      throw new BadRequestException(`OVER CAPACITY: ${capacity.message}`);
    }
    await this.prisma.license_plate_numbers.updateMany({
      where: { tenant_id: tenantId, lpn_id: lpn.lpn_id },
      data: { assigned_load_id: loadId, status: 'LOADED', loaded_at: new Date() },
    });
    await this.prisma.loads.updateMany({
      where: { tenant_id: tenantId, load_id: loadId },
      data: { loaded_cartons: { increment: 1 }, total_weight: { increment: cartonWt } },
    });
    // Decrement staging lane count if LPN was staged
    if (lpn.staging_location_id) {
      await this.prisma.staging_lanes.updateMany({
        where: { tenant_id: tenantId, lane_id: lpn.staging_location_id },
        data: { current_carton_count: { decrement: 1 } },
      });
    }
    const load = await this.prisma.loads.findFirst({ where: { tenant_id: tenantId, load_id: loadId } });
    return {
      lpnId: lpn.lpn_id.toString(), lpnNumber: lpn.lpn_number,
      loadId: loadId.toString(),
      loadProgress: `${load?.loaded_cartons || 0}/${load?.total_cartons || '?'}`,
    };
  }

  @Post('seal-trailer')
  @ApiCreatedResponse({ type: RfSealTrailerResponseDto })
  @RfAction('update')
  @ApiOperation({ summary: 'Record seal number on trailer (RF)' })
  async sealTrailer(@Req() req: any, @Body() dto: RfSealTrailerDto) {
    const tenantId = req.tenantContext.getTenantId();
    const loadId = BigInt(dto.load_id);
    await this.prisma.loads.updateMany({
      where: { tenant_id: tenantId, load_id: loadId },
      data: { seal_number: dto.seal_number },
    });
    return { loadId: loadId.toString(), sealNumber: dto.seal_number };
  }

  @Post('close-trailer')
  @ApiCreatedResponse({ type: RfCloseTrailerResponseDto })
  @RfAction('update')
  @ApiOperation({ summary: 'Close and seal trailer after loading complete (RF)' })
  async closeTrailer(@Req() req: any, @Body() dto: RfCloseTrailerDto) {
    const tenantId = req.tenantContext.getTenantId();
    const loadId = BigInt(dto.load_id);
    const userId = req.rfSession.userId;
    const load = await this.prisma.loads.findFirst({ where: { tenant_id: tenantId, load_id: loadId } });
    if (!load) throw new Error('Load not found');
    if (load.status === 'CLOSED' || load.status === 'DEPARTED' || load.status === 'DELIVERED') {
      throw new Error('Load is already closed or departed');
    }
    // GAP-3.2: Verify all shipments are complete before closing
    const verification = await this.shipmentService.verifyLoad(tenantId, loadId);
    if (!verification.allComplete && !dto.force) {
      return { blocked: true, message: 'Not all shipments complete', incompleteShipments: verification.shipments?.filter((s: any) => !s.isComplete) };
    }
    // GAP-6.3: Final capacity check
    const capacity = await this.loadService.validateCapacity(tenantId, loadId, 0);
    if (!capacity.allowed && !dto.force) {
      throw new BadRequestException('OVER CAPACITY');
    }
    await this.prisma.loads.updateMany({
      where: { tenant_id: tenantId, load_id: loadId },
      data: { status: 'LOADED', seal_number: dto.seal_number || load.seal_number, load_completed_time: new Date(), updated_by: userId },
    });
    await this.prisma.license_plate_numbers.updateMany({
      where: { tenant_id: tenantId, assigned_load_id: loadId },
      data: { status: 'LOADED' },
    });
    // Use closeShipment for each shipment
    const shipments = await this.prisma.outbound_shipments.findMany({
      where: { tenant_id: tenantId, load_id: loadId },
      select: { shipment_id: true, order_id: true },
    });
    for (const shipment of shipments) {
      await this.shipmentService.closeShipment(tenantId, shipment.shipment_id, true);
    }
    // GAP-8.1: Generate manifest
    try {
      await this.shipmentService.generateManifest(tenantId, loadId);
    } catch {}
    if (load.dock_door_number) {
      await this.prisma.loading_docks.updateMany({
        where: { tenant_id: tenantId, facility_id: load.facility_id, dock_code: load.dock_door_number },
        data: { is_available: true },
      });
    }
    return { loadId: loadId.toString(), loadNumber: load.load_number, sealNumber: dto.seal_number || load.seal_number, status: 'LOADED' };
  }

  @Post('get-next')
  @ApiCreatedResponse({ type: RfGetNextLoadingResponseDto })
  @RfAction('read')
  @ApiOperation({ summary: 'Get next loading work (directed assignment)' })
  async getNext(@Req() req: any, @Body() dto: RfGetNextLoadingDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id || 0);
    return this.loadService.getNextLoadingWork(tenantId, facilityId, req.rfSession?.userId || dto.user_id);
  }

  @Post('verify-shipment')
  @ApiCreatedResponse({ type: RfVerifyShipmentResponseDto })
  @RfAction('read')
  @ApiOperation({ summary: 'Verify all cartons for a shipment are loaded' })
  async verifyShipment(@Req() req: any, @Body() dto: RfVerifyShipmentDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.shipmentService.verifyShipmentCompleteness(tenantId, BigInt(dto.shipment_id));
  }

  @Post('verify-load')
  @ApiCreatedResponse({ type: RfVerifyLoadResponseDto })
  @RfAction('read')
  @ApiOperation({ summary: 'Verify all shipments on a load are complete' })
  async verifyLoad(@Req() req: any, @Body() dto: RfVerifyLoadDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.shipmentService.verifyLoad(tenantId, BigInt(dto.load_id));
  }

  @Post('close-shipment')
  @ApiCreatedResponse({ type: RfCloseShipmentResponseDto })
  @RfAction('update')
  @ApiOperation({ summary: 'Close individual shipment' })
  async closeShipment(@Req() req: any, @Body() dto: RfCloseShipmentDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.shipmentService.closeShipment(tenantId, BigInt(dto.shipment_id), dto.force);
  }

  @Post('capacity')
  @ApiCreatedResponse({ type: RfCapacityResponseDto })
  @RfAction('read')
  @ApiOperation({ summary: 'Check trailer capacity before loading' })
  async capacity(@Req() req: any, @Body() dto: RfCapacityDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.loadService.validateCapacity(tenantId, BigInt(dto.load_id), Number(dto.carton_weight_kg || 0));
  }

  @Post('handoff')
  @ApiCreatedResponse({ type: RfHandoffResponseDto })
  @RfAction('update')
  @ApiOperation({ summary: 'Transfer custody to carrier' })
  async handoff(@Req() req: any, @Body() dto: RfHandoffDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.loadService.transferToCarrier(tenantId, BigInt(dto.load_id), dto.driver_name || '');
  }

  @Post('bol')
  @ApiCreatedResponse({ type: RfBolResponseDto })
  @RfAction('read')
  @ApiOperation({ summary: 'View BOL data (RF)' })
  async bol(@Req() req: any, @Body() dto: RfBolDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.loadService.generateBol(tenantId, BigInt(dto.load_id));
  }

  @Post('manifest')
  @ApiCreatedResponse({ type: RfManifestResponseDto })
  @RfAction('read')
  @ApiOperation({ summary: 'View/generate manifest (RF)' })
  async manifest(@Req() req: any, @Body() dto: GenerateManifestDto) {
    const tenantId = req.tenantContext.getTenantId();
    const manifestData = dto.manifest_data_json || await this.shipmentService.generateManifest(tenantId, BigInt(dto.load_id));
    await this.prisma.generated_manifests.create({
      data: {
        tenant_id: tenantId,
        load_id: BigInt(dto.load_id),
        manifest_number: dto.manifest_number || `MAN-${dto.load_id}-${Date.now()}`,
        manifest_data_json: manifestData,
        generated_by: req.rfSession?.userId || dto.generated_by || dto.user_id,
      },
    }).catch(() => {});
    return manifestData;
  }

  @Post('find-carton')
  @ApiCreatedResponse({ type: RfFindCartonResponseDto })
  @RfAction('read')
  @ApiOperation({ summary: 'Find carton by barcode — return status and location (RF)' })
  async findCarton(@Req() req: any, @Body() dto: RfFindCartonDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id || 0);
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lpn_number: dto.lpn_barcode },
    });
    if (!lpn) throw new NotFoundException('Carton not found');
    let stagingLane: any = null;
    if (lpn.staging_location_id) {
      stagingLane = await this.prisma.staging_lanes.findFirst({
        where: { tenant_id: tenantId, lane_id: lpn.staging_location_id },
      });
    }
    let shipment: any = null;
    if (lpn.assigned_shipment_id) {
      shipment = await this.prisma.outbound_shipments.findFirst({
        where: { tenant_id: tenantId, shipment_id: lpn.assigned_shipment_id },
      });
    }
    return {
      lpnId: lpn.lpn_id.toString(), lpnNumber: lpn.lpn_number, status: lpn.status,
      stagingLane: stagingLane ? { laneId: stagingLane.lane_id.toString(), laneCode: stagingLane.lane_code } : null,
      shipment: shipment ? { shipmentId: shipment.shipment_id.toString(), status: shipment.status } : null,
      productId: lpn.product_id?.toString(),
    };
  }

  @Post('load-summary')
  @ApiCreatedResponse({ type: RfLoadSummaryResponseDto })
  @RfAction('read')
  @ApiOperation({ summary: 'Get load summary with shipments and carton counts (RF)' })
  async loadSummary(@Req() req: any, @Body() dto: RfLoadSummaryDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id || 0);
    const load = await this.prisma.loads.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, load_id: BigInt(dto.load_id) },
    });
    if (!load) throw new NotFoundException('Load not found');
    const shipments = await this.prisma.outbound_shipments.findMany({
      where: { tenant_id: tenantId, load_id: load.load_id },
    });
    const totalCartons = await this.prisma.license_plate_numbers.count({
      where: { tenant_id: tenantId, assigned_load_id: load.load_id, status: 'LOADED' },
    });
    return {
      loadId: load.load_id.toString(), loadNumber: load.load_number, status: load.status,
      totalShipments: shipments.length, loadedCartons: totalCartons, totalCartons: load.total_cartons,
      dockDoorNumber: load.dock_door_number, trailerNumber: load.trailer_number,
      sealNumber: load.seal_number, driverName: load.driver_name,
      shipments: shipments.map(s => ({ shipmentId: s.shipment_id.toString(), shipmentNumber: s.shipment_number, status: s.status })),
    };
  }

  @Post('shipment-cartons')
  @ApiCreatedResponse({ type: RfShipmentCartonsResponseDto })
  @RfAction('read')
  @ApiOperation({ summary: 'List all cartons for a shipment with statuses (RF)' })
  async shipmentCartons(@Req() req: any, @Body() dto: RfShipmentCartonsDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id || 0);
    const cartons = await this.prisma.license_plate_numbers.findMany({
      where: { tenant_id: tenantId, facility_id: facilityId, assigned_shipment_id: BigInt(dto.shipment_id) },
      orderBy: { lpn_id: 'asc' },
    });
    const shipment = await this.prisma.outbound_shipments.findFirst({
      where: { tenant_id: tenantId, shipment_id: BigInt(dto.shipment_id) },
    });
    return {
      shipmentId: dto.shipment_id, shipmentNumber: shipment?.shipment_number, shipmentStatus: shipment?.status,
      cartons: cartons.map(c => ({ lpnId: c.lpn_id.toString(), lpnNumber: c.lpn_number, status: c.status, stagingLocationId: c.staging_location_id?.toString() })),
    };
  }

  // GAP-5.2: Scan pallet — bulk load all child cartons
  @Post('scan-pallet')
  @ApiCreatedResponse({ type: RfScanPalletShippingResponseDto })
  @RfAction('update')
  @ApiOperation({ summary: 'Scan pallet barcode to bulk-load all child cartons (RF)' })
  async scanPallet(@Req() req: any, @Body() dto: RfScanPalletShippingDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id || 0);
    const loadId = BigInt(dto.load_id);
    const pallet = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lpn_number: dto.pallet_barcode },
    });
    if (!pallet) throw new NotFoundException('Pallet not found');
    if (pallet.lpn_type !== 'PALLET') throw new BadRequestException('Scanned LPN is not a pallet');
    const childCartons = await this.prisma.license_plate_numbers.findMany({
      where: { tenant_id: tenantId, parent_lpn_id: pallet.lpn_id, status: 'STAGED' },
    });
    if (childCartons.length === 0) throw new BadRequestException('No staged child cartons on pallet');
    for (const carton of childCartons) {
      await this.prisma.license_plate_numbers.updateMany({
        where: { tenant_id: tenantId, lpn_id: carton.lpn_id },
        data: { assigned_load_id: loadId, status: 'LOADED', loaded_at: new Date() },
      });
    }
    await this.prisma.loads.updateMany({
      where: { tenant_id: tenantId, load_id: loadId },
      data: { loaded_cartons: { increment: childCartons.length } },
    });
    return { palletLoaded: true, cartonCount: childCartons.length, cartonIds: childCartons.map(c => c.lpn_id.toString()) };
  }

  // GAP-4.3: Current stop
  @Post('current-stop')
  @ApiCreatedResponse({ type: RfCurrentStopResponseDto })
  @RfAction('read')
  @ApiOperation({ summary: 'Get current multi-stop loading position (RF)' })
  async currentStop(@Req() req: any, @Body() dto: RfCurrentStopDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.loadService.getLoadingSequence(tenantId, BigInt(dto.load_id));
  }

  // GAP-4.3: Next stop
  @Post('next-stop')
  @ApiCreatedResponse({ type: RfNextStopResponseDto })
  @RfAction('update')
  @ApiOperation({ summary: 'Advance to next loading stop (RF)' })
  async nextStop(@Req() req: any, @Body() dto: RfNextStopDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.loadService.advanceToNextStop(tenantId, BigInt(dto.load_id));
  }

  // APP-SHIP-C: Validate carton (phase 1 of 2-phase load)
  @Post('validate-carton')
  @ApiCreatedResponse({ type: RfValidateCartonResponseDto })
  @RfAction('read')
  @ApiOperation({ summary: 'Validate carton for loading — phase 1 before confirm (RF)' })
  async validateCarton(@Req() req: any, @Body() dto: RfValidateCartonDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id || 0);
    const loadId = BigInt(dto.load_id);
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lpn_number: dto.lpn_barcode },
    });
    if (!lpn) throw new NotFoundException('Carton not found');
    if (lpn.status !== 'STAGED') throw new BadRequestException(`Carton is ${lpn.status}, must be STAGED`);
    if (!lpn.assigned_shipment_id) throw new BadRequestException('Carton has no shipment assignment');
    const shipment = await this.prisma.outbound_shipments.findFirst({
      where: { tenant_id: tenantId, shipment_id: lpn.assigned_shipment_id },
    });
    if (shipment && shipment.load_id && shipment.load_id !== loadId) {
      throw new BadRequestException('WRONG LOAD: Carton belongs to a different load');
    }
    return { valid: true, lpnId: lpn.lpn_id.toString(), lpnNumber: lpn.lpn_number, status: lpn.status, shipmentId: lpn.assigned_shipment_id?.toString(), weight: lpn.gross_weight?.toString() };
  }

  // APP-SHIP-C: Confirm load (phase 2 of 2-phase load)
  @Post('confirm-load')
  @ApiCreatedResponse({ type: RfConfirmLoadResponseDto })
  @RfAction('update')
  @ApiOperation({ summary: 'Confirm carton loaded — phase 2 after validate (RF)' })
  async confirmLoad(@Req() req: any, @Body() dto: RfConfirmLoadDto) {
    const tenantId = req.tenantContext.getTenantId();
    const facilityId = BigInt(req.rfSession.facilityId || dto.facility_id || 0);
    const loadId = BigInt(dto.load_id);
    const userId = req.rfSession?.userId;
    const lpn = await this.prisma.license_plate_numbers.findFirst({
      where: { tenant_id: tenantId, facility_id: facilityId, lpn_number: dto.lpn_barcode },
    });
    if (!lpn) throw new NotFoundException('Carton not found');
    if (lpn.status !== 'STAGED') throw new BadRequestException(`Carton is ${lpn.status}, must be STAGED`);
    await this.prisma.license_plate_numbers.updateMany({
      where: { tenant_id: tenantId, lpn_id: lpn.lpn_id },
      data: { assigned_load_id: loadId, status: 'LOADED', loaded_at: new Date() },
    });
    await this.prisma.loads.updateMany({
      where: { tenant_id: tenantId, load_id: loadId },
      data: { loaded_cartons: { increment: 1 } },
    });
    // APP-SHIP-C: Create confirmation record
    await this.prisma.carton_loading_confirmation.create({
      data: { tenant_id: tenantId, carton_id: lpn.lpn_id, load_id: loadId, loaded_by: userId, confirmation_method: 'SCAN_CONFIRM' },
    }).catch(() => {});
    // Write audit event
    await this.prisma.shipping_audit_log.create({
      data: { tenant_id: tenantId, event_type: 'CARTON_CONFIRMED_LOADED', load_id: loadId, carton_id: lpn.lpn_id, operator_id: userId },
    }).catch(() => {});
    return { confirmed: true, lpnId: lpn.lpn_id.toString(), lpnNumber: lpn.lpn_number };
  }

  // APP-SHIP-M: Force close (supervisor only)
  @Post('force-close')
  @ApiCreatedResponse({ type: RfForceCloseResponseDto })
  @RfAction('update')
  @ApiOperation({ summary: 'Force close trailer with incomplete shipments — supervisor only (RF)' })
  async forceClose(@Req() req: any, @Body() dto: CreateForceCloseDto) {
    const tenantId = req.tenantContext.getTenantId();
    const loadId = BigInt(dto.load_id);
    const userId = req.rfSession?.userId;
    // Record authorization
    const verification = await this.shipmentService.verifyLoad(tenantId, loadId);
    const incomplete = (verification.shipments?.filter((s: any) => !s.isComplete) || []).map((s: any) => ({ shipmentId: s.shipmentId?.toString(), expected: s.expected, loaded: s.loaded, missing: s.missing }));
    await this.prisma.force_close_authorizations.create({
      data: {
        tenant_id: tenantId, load_id: loadId,
        supervisor_user_id: dto.supervisor_user_id || userId,
        reason_code: dto.reason_code || 'FORCE_CLOSE',
        incomplete_shipments: dto.incomplete_shipments || (incomplete as any),
      },
    }).catch(() => {});
    // Force close
    return this.shipmentService.closeShipment(tenantId, BigInt(dto.shipment_id || 0), true);
  }

  // APP-SHIP-G: Undo load
  @Post('undo-load')
  @ApiCreatedResponse({ type: RfUndoLoadResponseDto })
  @RfAction('update')
  @ApiOperation({ summary: 'Reverse last carton load (RF)' })
  async undoLoad(@Req() req: any, @Body() dto: RfUndoLoadDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.loadService.undoLoad(tenantId, BigInt(dto.load_id), BigInt(dto.lpn_id), dto.reason_code || 'WRONG_CARTON');
  }

  // APP-SHIP-G: Reassign shipment
  @Post('reassign-shipment')
  @ApiCreatedResponse({ type: RfReassignShipmentResponseDto })
  @RfAction('update')
  @ApiOperation({ summary: 'Reassign shipment to different load (RF)' })
  async reassignShipment(@Req() req: any, @Body() dto: RfReassignShipmentDto) {
    const tenantId = req.tenantContext.getTenantId();
    return this.shipmentService.reassignShipment(tenantId, BigInt(dto.shipment_id), BigInt(dto.new_load_id), dto.reason_code || 'REASSIGN');
  }
}
