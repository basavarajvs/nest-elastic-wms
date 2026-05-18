import { IsString, IsUUID, IsOptional, IsNumber } from 'class-validator';

export class ApproveApprovalDto {
  @IsOptional()
  @IsString()
  comments?: string;
}

export class RejectApprovalDto {
  @IsString()
  reason: string;
}
