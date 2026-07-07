import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SalesOrderService } from './sales-orders/sales-order.service';
import { AllocationService } from './allocation/allocation.service';
import { PickingWaveService } from './picking-waves/picking-wave.service';
import { PickingTaskService } from './picking-tasks/picking-task.service';
import { ClusterPickService } from './picking-tasks/cluster-pick.service';
import { PickRouteService } from './picking-tasks/pick-route.service';
import { PickCartService } from './picking-tasks/pick-cart.service';
import { PickCartAssignmentService } from './picking-tasks/pick-cart-assignment.service';
import { ClusterPickGroupService } from './picking-tasks/cluster-pick-group.service';
import { ShortPickReasonService } from './picking-tasks/short-pick-reason.service';
import { PackingService } from './packing/packing.service';
import { CartonizationService } from './packing/cartonization.service';
import { ScaleIntegrationService } from './packing/scale-integration.service';
import { ShipmentService } from './shipments/shipment.service';
import { LoadService } from './loads/load.service';
import { VasCatalogService } from './vas-catalog/vas-catalog.service';
import { VasExecutionService } from './vas-execution/vas-execution.service';
import { ReplenishmentService } from './replenishment/replenishment.service';
import { CrossDockService } from './cross-dock/cross-dock.service';
import { CarrierRateService } from './carrier-rates/carrier-rate.service';
import { StagingService } from './staging/staging.service';
import { TrailerService } from './shipments/trailer.service';
import { PackingMaterialService } from './packing/packing-material.service';
import { PackingStationService } from './packing/packing-station.service';
import { CartonizationPreferenceService } from './sales-orders/cartonization-preference.service';
import { ShippingRouteService } from './shipments/shipping-route.service';
import { RouteStopService } from './shipments/route-stop.service';
import { ShippingLabelService } from './shipments/shipping-label.service';
import { SalesOrderWebController } from './sales-orders/web/sales-order.controller';
import { AllocationWebController } from './allocation/allocation.controller';
import { PickingWaveWebController } from './picking-waves/web/picking-wave.controller';
import { PickingTaskWebController } from './picking-tasks/web/picking-task.controller';
import { PackingWebController } from './packing/web/packing.controller';
import { ShipmentWebController } from './shipments/web/shipment.controller';
import { LoadWebController } from './loads/web/load.controller';
import { RfPickingController } from './picking-tasks/rf/picking.controller';
import { RfPackingController } from './packing/rf/packing.controller';
import { RfShippingController } from './shipments/rf/shipping.controller';
import { VasCatalogWebController } from './vas-catalog/web/vas-catalog.controller';
import { RfVasCatalogController } from './vas-catalog/rf/vas-catalog.controller';
import { VasExecutionWebController } from './vas-execution/web/vas-execution.controller';
import { ReplenishmentRuleController, ReplenishmentTaskController } from './replenishment/web/replenishment.controller';
import { CrossDockWebController } from './cross-dock/web/cross-dock.controller';
import { CarrierRateWebController } from './carrier-rates/web/carrier-rate.controller';
import { StagingWebController } from './staging/web/staging.controller';
import { TrailerWebController } from './shipments/web/trailer.controller';
import { PackingMaterialWebController } from './packing/web/packing-material.controller';
import { PackingStationWebController } from './packing/web/packing-station.controller';
import { CartonizationPreferenceWebController } from './sales-orders/web/cartonization-preference.controller';
import { ShippingRouteWebController } from './shipments/web/shipping-route.controller';
import { RouteStopWebController } from './shipments/web/route-stop.controller';
import { ShippingLabelWebController } from './shipments/web/shipping-label.controller';
import { RfStagingController } from './staging/rf/staging.controller';
import { BackorderWebController } from './sales-orders/web/backorder.controller';
import { WaveTaskWebController } from './picking-waves/web/wave-task.controller';
import { PickAuditWebController } from './picking-tasks/web/pick-audit.controller';
import { PickRouteWebController } from './picking-tasks/web/pick-route.controller';
import { PickCartController } from './picking-tasks/web/pick-cart.controller';
import { PickCartAssignmentController } from './picking-tasks/web/pick-cart-assignment.controller';
import { ClusterPickGroupController } from './picking-tasks/web/cluster-pick-group.controller';
import { ShortPickReasonController } from './picking-tasks/web/short-pick-reason.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    SalesOrderWebController,
    AllocationWebController,
    PickingWaveWebController,
    PickingTaskWebController,
    PackingWebController,
    ShipmentWebController,
    LoadWebController,
    RfPickingController,
    RfPackingController,
    RfShippingController,
    VasCatalogWebController,
    RfVasCatalogController,
    VasExecutionWebController,
    ReplenishmentRuleController,
    ReplenishmentTaskController,
    CrossDockWebController,
    CarrierRateWebController,
    StagingWebController,
    TrailerWebController,
    RfStagingController,
    BackorderWebController,
    WaveTaskWebController,
    PickAuditWebController,
    PickRouteWebController,
    PickCartController,
    PickCartAssignmentController,
    ClusterPickGroupController,
    ShortPickReasonController,
    PackingMaterialWebController,
    PackingStationWebController,
    CartonizationPreferenceWebController,
    ShippingRouteWebController,
    RouteStopWebController,
    ShippingLabelWebController,
  ],
  providers: [
    SalesOrderService,
    AllocationService,
    PickingWaveService,
    PickingTaskService,
    ClusterPickService,
    PickRouteService,
    PickCartService,
    PickCartAssignmentService,
    ClusterPickGroupService,
    ShortPickReasonService,
    PackingService,
    CartonizationService,
    ScaleIntegrationService,
    ShipmentService,
    LoadService,
    VasCatalogService,
    VasExecutionService,
    ReplenishmentService,
    CrossDockService,
    CarrierRateService,
    StagingService,
    TrailerService,
    PackingMaterialService,
    PackingStationService,
    CartonizationPreferenceService,
    ShippingRouteService,
    RouteStopService,
    ShippingLabelService,
  ],
  exports: [
    SalesOrderService,
    AllocationService,
    PickingWaveService,
    PickingTaskService,
    ClusterPickService,
    PickRouteService,
    PickCartService,
    PickCartAssignmentService,
    ClusterPickGroupService,
    ShortPickReasonService,
    PackingService,
    CartonizationService,
    ScaleIntegrationService,
    ShipmentService,
    LoadService,
    VasCatalogService,
    VasExecutionService,
    ReplenishmentService,
    CrossDockService,
    CarrierRateService,
    StagingService,
    TrailerService,
    PackingMaterialService,
    PackingStationService,
    CartonizationPreferenceService,
    ShippingRouteService,
    RouteStopService,
    ShippingLabelService,
  ],
})
export class OutboundModule {}
