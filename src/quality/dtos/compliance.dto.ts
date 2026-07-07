import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class ComplianceRequirementDto {
  @ApiProperty() requirement_id: bigint;
  @ApiProperty() requirement_code: string;
  @ApiProperty() requirement_name: string;
  @ApiProperty() description?: string;
  @ApiProperty() category: string;
  @ApiProperty() status?: string;
  @ApiProperty() priority?: string;
  @ApiProperty() next_due_date?: Date;
}

export class ComplianceAuditDto {
  @ApiProperty() audit_id: bigint;
  @ApiProperty() audit_number: string;
  @ApiProperty() audit_type: string;
  @ApiProperty() audit_date: Date;
  @ApiProperty() auditor_name?: string;
  @ApiProperty() status: string;
  @ApiProperty() score?: number;
  @ApiProperty() findings?: string;
}

export class HazmatMaterialDto {
  @ApiProperty() hazmat_id: bigint;
  @ApiProperty() material_code: string;
  @ApiProperty() material_name: string;
  @ApiProperty() un_number?: string;
  @ApiProperty() hazard_class: string;
  @ApiProperty() packing_group?: string;
  @ApiProperty() is_active: boolean;
}

export class CreateComplianceRequirementDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() requirement_code: string;
  @ApiProperty() requirement_name: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() category: string;
  @ApiPropertyOptional() sub_category?: string;
  @ApiPropertyOptional() regulatory_body?: string;
  @ApiPropertyOptional() regulation_reference?: string;
  @ApiPropertyOptional() compliance_frequency?: string;
  @ApiPropertyOptional() due_day_of_period?: number;
  @ApiPropertyOptional() next_due_date?: string;
  @ApiPropertyOptional() last_completed_date?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() priority?: string;
  @ApiPropertyOptional() responsible_role?: string;
  @ApiPropertyOptional() assigned_to?: string;
  @ApiPropertyOptional() documentation_required?: boolean;
  @ApiPropertyOptional() documentation_template_url?: string;
  @ApiPropertyOptional() created_by?: string;
}

export class UpdateComplianceRequirementDto {
  @ApiPropertyOptional() requirement_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() category?: string;
  @ApiPropertyOptional() sub_category?: string;
  @ApiPropertyOptional() regulatory_body?: string;
  @ApiPropertyOptional() regulation_reference?: string;
  @ApiPropertyOptional() compliance_frequency?: string;
  @ApiPropertyOptional() due_day_of_period?: number;
  @ApiPropertyOptional() next_due_date?: string;
  @ApiPropertyOptional() last_completed_date?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() priority?: string;
  @ApiPropertyOptional() responsible_role?: string;
  @ApiPropertyOptional() assigned_to?: string;
  @ApiPropertyOptional() updated_by?: string;
}

export class CreateComplianceAuditDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() audit_number: string;
  @ApiPropertyOptional() requirement_id?: string;
  @ApiProperty() audit_type: string;
  @ApiProperty() audit_date: string;
  @ApiPropertyOptional() auditor_name?: string;
  @ApiPropertyOptional() auditor_organization?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() score?: number;
  @ApiPropertyOptional() findings?: string;
  @ApiPropertyOptional() recommendations?: string;
  @ApiPropertyOptional() corrective_actions?: string;
  @ApiPropertyOptional() follow_up_required?: boolean;
  @ApiPropertyOptional() follow_up_due_date?: string;
  @ApiPropertyOptional() report_url?: string;
  @ApiPropertyOptional() evidence_urls?: string;
  @ApiPropertyOptional() created_by?: string;
}

export class UpdateComplianceAuditDto {
  @ApiPropertyOptional() audit_type?: string;
  @ApiPropertyOptional() audit_date?: string;
  @ApiPropertyOptional() auditor_name?: string;
  @ApiPropertyOptional() auditor_organization?: string;
  @ApiPropertyOptional() status?: string;
  @ApiPropertyOptional() score?: number;
  @ApiPropertyOptional() findings?: string;
  @ApiPropertyOptional() recommendations?: string;
  @ApiPropertyOptional() corrective_actions?: string;
  @ApiPropertyOptional() follow_up_required?: boolean;
  @ApiPropertyOptional() follow_up_due_date?: string;
  @ApiPropertyOptional() report_url?: string;
  @ApiPropertyOptional() evidence_urls?: string;
  @ApiPropertyOptional() updated_by?: string;
}

export class CreateHazmatMaterialDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() material_code: string;
  @ApiProperty() material_name: string;
  @ApiPropertyOptional() un_number?: string;
  @ApiProperty() hazard_class: string;
  @ApiPropertyOptional() packing_group?: string;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() required_storage_conditions?: string;
  @ApiPropertyOptional() max_storage_quantity?: number;
  @ApiPropertyOptional() storage_temperature_min?: number;
  @ApiPropertyOptional() storage_temperature_max?: number;
  @ApiPropertyOptional() requires_ventilation?: boolean;
  @ApiPropertyOptional() requires_grounding?: boolean;
  @ApiPropertyOptional() incompatible_materials?: string;
  @ApiPropertyOptional() handling_instructions?: string;
  @ApiPropertyOptional() ppe_requirements?: string;
  @ApiPropertyOptional() emergency_procedures?: string;
  @ApiPropertyOptional() spill_response?: string;
  @ApiPropertyOptional() sds_document_url?: string;
  @ApiPropertyOptional() sds_last_updated?: string;
  @ApiPropertyOptional() dot_regulated?: boolean;
  @ApiPropertyOptional() epa_regulated?: boolean;
  @ApiPropertyOptional() osha_regulated?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() created_by?: string;
}

export class UpdateHazmatMaterialDto {
  @ApiPropertyOptional() material_name?: string;
  @ApiPropertyOptional() un_number?: string;
  @ApiPropertyOptional() hazard_class?: string;
  @ApiPropertyOptional() packing_group?: string;
  @ApiPropertyOptional() required_storage_conditions?: string;
  @ApiPropertyOptional() max_storage_quantity?: number;
  @ApiPropertyOptional() storage_temperature_min?: number;
  @ApiPropertyOptional() storage_temperature_max?: number;
  @ApiPropertyOptional() requires_ventilation?: boolean;
  @ApiPropertyOptional() requires_grounding?: boolean;
  @ApiPropertyOptional() incompatible_materials?: string;
  @ApiPropertyOptional() handling_instructions?: string;
  @ApiPropertyOptional() ppe_requirements?: string;
  @ApiPropertyOptional() emergency_procedures?: string;
  @ApiPropertyOptional() spill_response?: string;
  @ApiPropertyOptional() sds_document_url?: string;
  @ApiPropertyOptional() sds_last_updated?: string;
  @ApiPropertyOptional() dot_regulated?: boolean;
  @ApiPropertyOptional() epa_regulated?: boolean;
  @ApiPropertyOptional() osha_regulated?: boolean;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() updated_by?: string;
}

export class CompliancePaginatedDto extends PaginatedResponseDto {
  @ApiProperty({ type: [ComplianceRequirementDto] })
  data: ComplianceRequirementDto[];
}
