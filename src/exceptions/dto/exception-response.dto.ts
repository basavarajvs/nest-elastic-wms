import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

export class CreateExceptionDto {
  @ApiProperty() facility_id: string;
  @ApiPropertyOptional() exception_name?: string;
  @ApiProperty() description: string;
  @ApiProperty() exception_type: string;
  @ApiPropertyOptional() exception_severity?: string;
  @ApiPropertyOptional() reference_type?: string;
  @ApiPropertyOptional() reference_id?: string;
  @ApiPropertyOptional() location_id?: string;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() reported_by_user_id?: string;
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() impact_level?: string;
  @ApiPropertyOptional() financial_impact_amount?: number;
  @ApiPropertyOptional() financial_impact_currency?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() created_by?: string;
}

export class UpdateExceptionDto {
  @ApiPropertyOptional() exception_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() exception_severity?: string;
  @ApiPropertyOptional() assigned_to_user_id?: string;
  @ApiPropertyOptional() impact_level?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional() updated_by?: string;
}

export class ResolveExceptionDto {
  @ApiPropertyOptional() resolution_description?: string;
  @ApiPropertyOptional() root_cause_description?: string;
}

export class AddCommentDto {
  @ApiProperty() facility_id: string;
  @ApiProperty() comment_text: string;
  @ApiPropertyOptional() comment_type?: string;
  @ApiPropertyOptional() commented_by_user_id?: string;
  @ApiPropertyOptional() is_internal?: boolean;
}

export class CreateEscalationRuleDto {
  @ApiPropertyOptional() facility_id?: string;
  @ApiProperty() rule_code: string;
  @ApiProperty() rule_name: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() exception_type: string;
  @ApiPropertyOptional() exception_severity?: string;
  @ApiPropertyOptional() exception_category?: string;
  @ApiPropertyOptional() escalation_level?: number;
  @ApiProperty() time_threshold_minutes: number;
  @ApiPropertyOptional() notify_roles?: string;
  @ApiPropertyOptional() notify_users?: string;
  @ApiPropertyOptional() notification_method?: string;
  @ApiPropertyOptional() notification_template?: string;
  @ApiPropertyOptional() auto_assign_to_role?: string;
  @ApiPropertyOptional() auto_assign_to_user?: string;
  @ApiPropertyOptional() condition_expression?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() priority?: number;
}

export class UpdateEscalationRuleDto {
  @ApiPropertyOptional() rule_name?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() exception_severity?: string;
  @ApiPropertyOptional() exception_category?: string;
  @ApiPropertyOptional() escalation_level?: number;
  @ApiPropertyOptional() time_threshold_minutes?: number;
  @ApiPropertyOptional() notify_roles?: string;
  @ApiPropertyOptional() notify_users?: string;
  @ApiPropertyOptional() notification_method?: string;
  @ApiPropertyOptional() notification_template?: string;
  @ApiPropertyOptional() auto_assign_to_role?: string;
  @ApiPropertyOptional() auto_assign_to_user?: string;
  @ApiPropertyOptional() condition_expression?: string;
  @ApiPropertyOptional() is_active?: boolean;
  @ApiPropertyOptional() priority?: number;
}

export class ExceptionManagementDto {
  @ApiProperty() exception_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() exception_number: string;
  @ApiPropertyOptional() exception_name: string | null;
  @ApiProperty() description: string;
  @ApiProperty() exception_type: string;
  @ApiProperty() exception_severity: string;
  @ApiPropertyOptional() reference_type: string | null;
  @ApiPropertyOptional() reference_id: number | null;
  @ApiPropertyOptional() location_id: number | null;
  @ApiPropertyOptional() location_name: string | null;
  @ApiPropertyOptional() product_id: number | null;
  @ApiPropertyOptional() product_name: string | null;
  @ApiPropertyOptional() lot_id: number | null;
  @ApiPropertyOptional() lot_number: string | null;
  @ApiProperty() status: string;
  @ApiProperty() reported_by_user_id: string;
  @ApiPropertyOptional() assigned_to_user_id: string | null;
  @ApiProperty() reported_at: string;
  @ApiPropertyOptional() acknowledged_at: string | null;
  @ApiPropertyOptional() resolved_at: string | null;
  @ApiPropertyOptional() closed_at: string | null;
  @ApiPropertyOptional() resolution_description: string | null;
  @ApiPropertyOptional() root_cause_description: string | null;
  @ApiPropertyOptional() impact_level: string | null;
  @ApiPropertyOptional() financial_impact_amount: number | null;
  @ApiPropertyOptional() financial_impact_currency: string | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class ExceptionListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [ExceptionManagementDto] })
  data: ExceptionManagementDto[];
}

export class ExceptionCommentDto {
  @ApiProperty() comment_id: number;
  @ApiProperty() tenant_id: string;
  @ApiProperty() facility_id: number;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() exception_id: number;
  @ApiProperty() comment_text: string;
  @ApiPropertyOptional() comment_type: string | null;
  @ApiProperty() commented_by_user_id: string;
  @ApiProperty() commented_at: string;
  @ApiPropertyOptional() is_internal: boolean | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class EscalationRuleDto {
  @ApiProperty() rule_id: number;
  @ApiProperty() tenant_id: string;
  @ApiPropertyOptional() facility_id: number | null;
  @ApiPropertyOptional() facility_name: string | null;
  @ApiProperty() rule_code: string;
  @ApiProperty() rule_name: string;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty() exception_type: string;
  @ApiPropertyOptional() exception_severity: string | null;
  @ApiPropertyOptional() exception_category: string | null;
  @ApiProperty() escalation_level: number;
  @ApiProperty() time_threshold_minutes: number;
  @ApiPropertyOptional() notify_roles: string | null;
  @ApiPropertyOptional() notify_users: string | null;
  @ApiPropertyOptional() notification_method: string | null;
  @ApiPropertyOptional() notification_template: string | null;
  @ApiPropertyOptional() auto_assign_to_role: string | null;
  @ApiPropertyOptional() auto_assign_to_user: string | null;
  @ApiPropertyOptional() condition_expression: string | null;
  @ApiPropertyOptional() is_active: boolean | null;
  @ApiPropertyOptional() priority: number | null;
  @ApiPropertyOptional() created_by: string | null;
  @ApiPropertyOptional() updated_by: string | null;
  @ApiPropertyOptional() created_at: string | null;
  @ApiPropertyOptional() updated_at: string | null;
  @ApiPropertyOptional() version: number | null;
}

export class EscalationRuleListResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [EscalationRuleDto] })
  data: EscalationRuleDto[];
}

// ─── RF Request DTOs ─────────────────────────────────────

export class ReportExceptionDto {
  @ApiProperty() exception_type: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() location_id?: string;
  @ApiPropertyOptional() product_id?: string;
  @ApiPropertyOptional() lot_id?: string;
  @ApiPropertyOptional() notes?: string;
}
