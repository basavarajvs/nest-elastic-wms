import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

export class ShipmentDto {
  @ApiProperty() shipment_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() shipment_number: string;
  @ApiPropertyOptional() shipment_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() order_id?: string;
  @ApiPropertyOptional() order_number?: string;
  @ApiPropertyOptional() client_id?: string;
  @ApiPropertyOptional() carrier_id?: string;
  @ApiPropertyOptional() carrier_code?: string;
  @ApiPropertyOptional() carrier_name?: string;
  @ApiPropertyOptional() service_level?: string;
  @ApiPropertyOptional() tracking_number?: string;
  @ApiPropertyOptional() tracking_url?: string;
  @ApiPropertyOptional() pro_number?: string;
  @ApiPropertyOptional() total_cartons?: number;
  @ApiPropertyOptional() expected_carton_count?: number;
  @ApiPropertyOptional() total_weight?: number;
  @ApiPropertyOptional() total_volume?: number;
  @ApiPropertyOptional() number_of_packages?: number;
  @ApiPropertyOptional() load_id?: string;
  @ApiPropertyOptional() load_number?: string;
  @ApiPropertyOptional() staging_lane_id?: string;
  @ApiPropertyOptional() lane_name?: string;
  @ApiPropertyOptional() driver_name?: string;
  @ApiPropertyOptional() trailer_number?: string;
  @ApiPropertyOptional() scheduled_ship_date?: Date;
  @ApiPropertyOptional() shipped_date?: Date;
  @ApiPropertyOptional() delivered_date?: Date;
  @ApiPropertyOptional() delivery_address_line1?: string;
  @ApiPropertyOptional() delivery_address_line2?: string;
  @ApiPropertyOptional() delivery_city?: string;
  @ApiPropertyOptional() delivery_state_province?: string;
  @ApiPropertyOptional() delivery_postal_code?: string;
  @ApiPropertyOptional() delivery_country_code?: string;
  @ApiPropertyOptional() delivery_contact_name?: string;
  @ApiPropertyOptional() delivery_contact_phone?: string;
  @ApiPropertyOptional() delivery_instructions?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class ShipmentPaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [ShipmentDto] })
  data: ShipmentDto[];
}

export class ShipmentDetailDto extends ShipmentDto {
  @ApiPropertyOptional({ type: [Object] }) items?: any[];
  @ApiPropertyOptional({ type: [Object] }) labels?: any[];
  @ApiPropertyOptional({ type: [Object] }) statusHistory?: any[];
}

export class ManifestDto {
  @ApiProperty() loadNumber: string;
  @ApiPropertyOptional() vehicleNumber?: string;
  @ApiPropertyOptional() driverName?: string;
  @ApiProperty() totalShipments: number;
  @ApiProperty({ type: [Object] }) shipments: any[];
  @ApiProperty() generatedAt: Date;
}

export class TrailerDto {
  @ApiProperty() trailer_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() facility_name?: string;
  @ApiProperty() trailer_number: string;
  @ApiProperty() status: string;
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() carrier_id?: string;
  @ApiPropertyOptional() carrier_name?: string;
  @ApiPropertyOptional() trailer_type?: string;
  @ApiPropertyOptional() seal_number?: string;
  @ApiPropertyOptional() assigned_load_id?: string;
  @ApiPropertyOptional() load_number?: string;
  @ApiPropertyOptional() assigned_dock_id?: string;
  @ApiPropertyOptional() dock_name?: string;
  @ApiPropertyOptional() max_weight_kg?: number;
  @ApiPropertyOptional() max_volume_cbm?: number;
  @ApiPropertyOptional() max_pallets?: number;
  @ApiPropertyOptional() max_cartons?: number;
  @ApiPropertyOptional() arrival_time?: Date;
  @ApiPropertyOptional() departure_time?: Date;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class TrailerPaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [TrailerDto] })
  data: TrailerDto[];
}

export class VerifyCompletenessDto {
  @ApiProperty() isComplete: boolean;
  @ApiProperty() expected: number;
  @ApiProperty() loaded: number;
  @ApiProperty() missing: number;
  @ApiProperty() shipmentId: string;
}

export class CloseShipmentResultDto {
  @ApiProperty() closed: boolean;
  @ApiProperty() shipmentId: string;
}

export class CreateForceCloseDto {
  @ApiProperty() load_id: string;
  @ApiProperty() supervisor_user_id: string;
  @ApiPropertyOptional() reason_code?: string;
  @ApiPropertyOptional() incomplete_shipments?: any;
  @ApiPropertyOptional() shipment_id?: string;
}

export class GenerateManifestDto {
  @ApiProperty() load_id: string;
  @ApiProperty() manifest_number: string;
  @ApiPropertyOptional() manifest_data_json?: any;
  @ApiPropertyOptional() generated_by?: string;
  @ApiPropertyOptional() user_id?: string;
}

export class CreateShipmentDto {
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() shipment_number?: string;
  @ApiPropertyOptional() shipment_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() order_id?: string;
  @ApiPropertyOptional() client_id?: string;
  @ApiPropertyOptional() carrier_id?: string;
  @ApiPropertyOptional() carrier_code?: string;
  @ApiPropertyOptional() carrier_name?: string;
  @ApiPropertyOptional() service_level?: string;
  @ApiPropertyOptional() scheduled_ship_date?: Date;
  @ApiPropertyOptional() driver_name?: string;
  @ApiPropertyOptional() trailer_number?: string;
  @ApiPropertyOptional() total_cartons?: number;
  @ApiPropertyOptional() total_weight?: number;
  @ApiPropertyOptional() total_volume?: number;
  @ApiPropertyOptional() number_of_packages?: number;
  @ApiPropertyOptional() expected_carton_count?: number;
  @ApiPropertyOptional() tracking_number?: string;
  @ApiPropertyOptional() tracking_url?: string;
  @ApiPropertyOptional() pro_number?: string;
  @ApiPropertyOptional() staging_lane_id?: string;
  @ApiPropertyOptional() delivery_address_line1?: string;
  @ApiPropertyOptional() delivery_address_line2?: string;
  @ApiPropertyOptional() delivery_city?: string;
  @ApiPropertyOptional() delivery_state_province?: string;
  @ApiPropertyOptional() delivery_postal_code?: string;
  @ApiPropertyOptional() delivery_country_code?: string;
  @ApiPropertyOptional() delivery_contact_name?: string;
  @ApiPropertyOptional() delivery_contact_phone?: string;
  @ApiPropertyOptional() delivery_instructions?: string;
  @ApiPropertyOptional() notes?: string;
}

export class ShipShipmentDto {
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() tracking_number?: string;
  @ApiPropertyOptional() tracking_url?: string;
  @ApiPropertyOptional() pro_number?: string;
  @ApiPropertyOptional() driver_name?: string;
  @ApiPropertyOptional() trailer_number?: string;
  @ApiPropertyOptional() total_cartons?: number;
  @ApiPropertyOptional() total_weight?: number;
  @ApiPropertyOptional() total_volume?: number;
  @ApiPropertyOptional() number_of_packages?: number;
  @ApiPropertyOptional() generate_label?: boolean;
}

export class CloseShipmentDto {
  @ApiPropertyOptional() force?: boolean;
}

// ─── Audit DTOs ───────────────────────────────────────────

export class ShippingAuditEntryDto {
  @ApiProperty()
  audit_id: string;
  @ApiProperty()
  tenant_id: string;
  @ApiPropertyOptional()
  facility_id: string | null;
  @ApiProperty()
  event_type: string;
  @ApiPropertyOptional()
  load_id: string | null;
  @ApiPropertyOptional()
  shipment_id: string | null;
  @ApiPropertyOptional()
  carton_id: string | null;
  @ApiPropertyOptional()
  trailer_id: string | null;
  @ApiPropertyOptional()
  staging_lane_id: string | null;
  @ApiPropertyOptional()
  dock_id: string | null;
  @ApiPropertyOptional()
  operator_id: string | null;
  @ApiProperty()
  event_time: Date;
  @ApiPropertyOptional()
  snapshot_data: any;
  @ApiPropertyOptional()
  notes: string | null;
}

export class CartonAuditEntryDto extends ShippingAuditEntryDto {}

export class CreateTrailerDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() trailer_number: string;
  @ApiPropertyOptional() carrier_id?: string;
  @ApiPropertyOptional() trailer_type?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() max_weight_kg?: number;
  @ApiPropertyOptional() max_volume_cbm?: number;
  @ApiPropertyOptional() max_pallets?: number;
  @ApiPropertyOptional() max_cartons?: number;
  @ApiPropertyOptional() seal_number?: string;
  @ApiPropertyOptional() arrival_time?: Date;
  @ApiPropertyOptional() notes?: string;
}

export class UpdateTrailerDto {
  @ApiPropertyOptional() trailer_number?: string;
  @ApiPropertyOptional() carrier_id?: string;
  @ApiPropertyOptional() trailer_type?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() seal_number?: string;
  @ApiPropertyOptional() max_weight_kg?: number;
  @ApiPropertyOptional() max_volume_cbm?: number;
  @ApiPropertyOptional() max_pallets?: number;
  @ApiPropertyOptional() max_cartons?: number;
  @ApiPropertyOptional() arrival_time?: Date;
  @ApiPropertyOptional() departure_time?: Date;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() assigned_load_id?: string;
  @ApiPropertyOptional() assigned_dock_id?: string;
}

// ─── RF Request DTOs ─────────────────────────────────────

export class RfStartLoadDto {
  @ApiPropertyOptional() dock_door_code?: string;
  @ApiPropertyOptional() load_number?: string;
  @ApiPropertyOptional() load_name?: string;
  @ApiPropertyOptional() trailer_number?: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfScanTrailerDto {
  @ApiProperty() trailer_number: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfScanShippingLpnDto {
  @ApiProperty() load_id: string;
  @ApiProperty() lpn_barcode: string;
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() verify_route?: boolean;
  @ApiPropertyOptional() carton_weight_kg?: number;
}

export class RfSealTrailerDto {
  @ApiProperty() load_id: string;
  @ApiProperty() seal_number: string;
}

export class RfCloseTrailerDto {
  @ApiProperty() load_id: string;
  @ApiPropertyOptional() seal_number?: string;
  @ApiPropertyOptional() force?: boolean;
}

export class RfGetNextLoadingDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiPropertyOptional() user_id?: string;
}

export class RfVerifyShipmentDto {
  @ApiProperty() shipment_id: string;
}

export class RfVerifyLoadDto {
  @ApiProperty() load_id: string;
}

export class RfCloseShipmentDto {
  @ApiProperty() shipment_id: string;
  @ApiPropertyOptional() force?: boolean;
}

export class RfCapacityDto {
  @ApiProperty() load_id: string;
  @ApiPropertyOptional() carton_weight_kg?: number;
}

export class RfHandoffDto {
  @ApiProperty() load_id: string;
  @ApiPropertyOptional() driver_name?: string;
}

export class RfBolDto {
  @ApiProperty() load_id: string;
}

export class RfManifestDto {
  @ApiProperty() load_id: string;
  @ApiPropertyOptional() user_id?: string;
}

export class RfFindCartonDto {
  @ApiProperty() lpn_barcode: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfLoadSummaryDto {
  @ApiProperty() load_id: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfShipmentCartonsDto {
  @ApiProperty() shipment_id: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfScanPalletShippingDto {
  @ApiProperty() load_id: string;
  @ApiProperty() pallet_barcode: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfCurrentStopDto {
  @ApiProperty() load_id: string;
}

export class RfNextStopDto {
  @ApiProperty() load_id: string;
}

export class RfValidateCartonDto {
  @ApiProperty() load_id: string;
  @ApiProperty() lpn_barcode: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfConfirmLoadDto {
  @ApiProperty() load_id: string;
  @ApiProperty() lpn_barcode: string;
  @ApiPropertyOptional() facility_id?: string;
}

export class RfForceCloseDto {
  @ApiProperty() load_id: string;
  @ApiPropertyOptional() shipment_id?: string;
  @ApiPropertyOptional() supervisor_user_id?: string;
  @ApiPropertyOptional() reason_code?: string;
}

export class RfUndoLoadDto {
  @ApiProperty() load_id: string;
  @ApiProperty() lpn_id: string;
  @ApiPropertyOptional() reason_code?: string;
}

export class RfReassignShipmentDto {
  @ApiProperty() shipment_id: string;
  @ApiProperty() new_load_id: string;
  @ApiPropertyOptional() reason_code?: string;
}

// ─── Web Trailer Response DTOs ────────────────────────────

export class TrailerAssignToLoadResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class TrailerAssignToDockResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class TrailerDepartResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

// ─── RF Response DTOs ─────────────────────────────────────

export class RfStartLoadResponseDto {
  @ApiProperty() loadId: string;
  @ApiPropertyOptional() loadNumber?: string;
  @ApiPropertyOptional() dockDoor?: string;
}

export class RfScanTrailerResponseDto {
  @ApiProperty() trailerId: string;
  @ApiProperty() trailerNumber: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() maxWeightKg?: string;
  @ApiPropertyOptional() maxCartons?: number;
}

export class RfScanShippingLpnResponseDto {
  @ApiProperty() lpnId: string;
  @ApiProperty() lpnNumber: string;
  @ApiProperty() loadId: string;
  @ApiProperty() loadProgress: string;
}

export class RfSealTrailerResponseDto {
  @ApiProperty() loadId: string;
  @ApiProperty() sealNumber: string;
}

export class RfCloseTrailerResponseDto {
  @ApiProperty() loadId: string;
  @ApiProperty() loadNumber: string;
  @ApiPropertyOptional() sealNumber?: string;
  @ApiProperty() status: string;
}

export class RfGetNextLoadingResponseDto {
  @ApiPropertyOptional({ type: Object }) work?: any;
}

export class RfVerifyShipmentResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class RfVerifyLoadResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class RfCloseShipmentResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class RfCapacityResponseDto {
  @ApiPropertyOptional() allowed?: boolean;
  @ApiPropertyOptional() message?: string;
}

export class RfHandoffResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class RfBolResponseDto {
  @ApiPropertyOptional({ type: Object }) bol?: any;
}

export class RfManifestResponseDto {
  @ApiPropertyOptional({ type: Object }) manifest?: any;
}

export class RfFindCartonResponseDto {
  @ApiProperty() lpnId: string;
  @ApiProperty() lpnNumber: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional({ type: Object }) stagingLane?: any;
  @ApiPropertyOptional({ type: Object }) shipment?: any;
  @ApiPropertyOptional() productId?: string;
}

export class RfLoadSummaryResponseDto {
  @ApiProperty() loadId: string;
  @ApiProperty() loadNumber: string;
  @ApiPropertyOptional() status?: string;
  @ApiProperty() totalShipments: number;
  @ApiProperty() loadedCartons: number;
  @ApiPropertyOptional() totalCartons?: number;
  @ApiPropertyOptional() dockDoorNumber?: string;
  @ApiPropertyOptional() trailerNumber?: string;
  @ApiPropertyOptional() sealNumber?: string;
  @ApiPropertyOptional() driverName?: string;
  @ApiPropertyOptional({ type: [Object] }) shipments?: any[];
}

export class RfShipmentCartonsResponseDto {
  @ApiProperty() shipmentId: string;
  @ApiPropertyOptional() shipmentNumber?: string;
  @ApiPropertyOptional() shipmentStatus?: string;
  @ApiPropertyOptional({ type: [Object] }) cartons?: any[];
}

export class RfScanPalletShippingResponseDto {
  @ApiProperty() palletLoaded: boolean;
  @ApiProperty() cartonCount: number;
  @ApiProperty({ type: [String] }) cartonIds: string[];
}

export class RfCurrentStopResponseDto {
  @ApiPropertyOptional({ type: Object }) stop?: any;
}

export class RfNextStopResponseDto {
  @ApiPropertyOptional({ type: Object }) stop?: any;
}

export class RfValidateCartonResponseDto {
  @ApiProperty() valid: boolean;
  @ApiProperty() lpnId: string;
  @ApiProperty() lpnNumber: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() shipmentId?: string;
  @ApiPropertyOptional() weight?: string;
}

export class RfConfirmLoadResponseDto {
  @ApiProperty() confirmed: boolean;
  @ApiProperty() lpnId: string;
  @ApiProperty() lpnNumber: string;
}

export class RfForceCloseResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class RfUndoLoadResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

export class RfReassignShipmentResponseDto {
  @ApiPropertyOptional({ type: Object }) result?: any;
}

// ─── Shipping Route DTOs ──────────────────────────────────

export class ShippingRouteDto {
  @ApiProperty() route_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() route_code: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() origin_facility_id?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
  @ApiPropertyOptional() version?: string;
}

export class ShippingRoutePaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [ShippingRouteDto] })
  data: ShippingRouteDto[];
}

export class CreateShippingRouteDto {
  @ApiProperty() route_code: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() origin_facility_id?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateShippingRouteDto {
  @ApiPropertyOptional() route_code?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() origin_facility_id?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

// ─── Route Stop DTOs ──────────────────────────────────────

export class RouteStopDto {
  @ApiProperty() route_stop_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() route_id: string;
  @ApiProperty() stop_sequence: number;
  @ApiProperty() location_name: string;
  @ApiPropertyOptional() planned_arrival?: Date;
  @ApiPropertyOptional() planned_departure?: Date;
  @ApiPropertyOptional() carrier_id?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class RouteStopPaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [RouteStopDto] })
  data: RouteStopDto[];
}

export class CreateRouteStopDto {
  @ApiProperty() route_id: string;
  @ApiProperty() stop_sequence: number;
  @ApiProperty() location_name: string;
  @ApiPropertyOptional() planned_arrival?: Date;
  @ApiPropertyOptional() planned_departure?: Date;
  @ApiPropertyOptional() carrier_id?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

export class UpdateRouteStopDto {
  @ApiPropertyOptional() stop_sequence?: number;
  @ApiPropertyOptional() location_name?: string;
  @ApiPropertyOptional() planned_arrival?: Date;
  @ApiPropertyOptional() planned_departure?: Date;
  @ApiPropertyOptional() carrier_id?: string;
  @ApiPropertyOptional() is_active?: boolean;
}

// ─── Shipping Label DTOs ──────────────────────────────────

export class ShippingLabelDto {
  @ApiProperty() label_id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: string;
  @ApiProperty() shipment_id: string;
  @ApiProperty() tracking_number: string;
  @ApiPropertyOptional() label_data_url?: string;
  @ApiProperty() label_format: string;
  @ApiPropertyOptional() service_level?: string;
  @ApiPropertyOptional() weight?: number;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() shipping_cost?: number;
  @ApiPropertyOptional() currency_code?: string;
  @ApiProperty() status: string;
  @ApiProperty() generated_at: Date;
  @ApiPropertyOptional() printed_at?: Date;
  @ApiPropertyOptional() applied_to_shipment_at?: Date;
  @ApiPropertyOptional() carrier_confirmation_number?: string;
  @ApiPropertyOptional() carrier_picked_up_at?: Date;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
  @ApiPropertyOptional() updated_by?: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
  @ApiPropertyOptional() version?: string;
}

export class ShippingLabelPaginatedResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [ShippingLabelDto] })
  data: ShippingLabelDto[];
}

export class CreateShippingLabelDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() shipment_id: string;
  @ApiProperty() tracking_number: string;
  @ApiPropertyOptional() label_data_url?: string;
  @ApiPropertyOptional() label_format?: string;
  @ApiPropertyOptional() service_level?: string;
  @ApiPropertyOptional() weight?: number;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() shipping_cost?: number;
  @ApiPropertyOptional() currency_code?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() printed_at?: Date;
  @ApiPropertyOptional() applied_to_shipment_at?: Date;
  @ApiPropertyOptional() carrier_confirmation_number?: string;
  @ApiPropertyOptional() carrier_picked_up_at?: Date;
  @ApiPropertyOptional() notes?: string;
}

export class UpdateShippingLabelDto {
  @ApiPropertyOptional() tracking_number?: string;
  @ApiPropertyOptional() label_data_url?: string;
  @ApiPropertyOptional() label_format?: string;
  @ApiPropertyOptional() service_level?: string;
  @ApiPropertyOptional() weight?: number;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;
  @ApiPropertyOptional() shipping_cost?: number;
  @ApiPropertyOptional() currency_code?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() printed_at?: Date;
  @ApiPropertyOptional() applied_to_shipment_at?: Date;
  @ApiPropertyOptional() carrier_confirmation_number?: string;
  @ApiPropertyOptional() carrier_picked_up_at?: Date;
  @ApiPropertyOptional() notes?: string;
}
