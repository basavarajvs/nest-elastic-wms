import { IsString, IsUUID, IsOptional, IsNumber, Min } from 'class-validator';

export class ConfirmPickDto {
  @IsUUID()
  taskId: string;

  @IsNumber()
  @Min(0)
  actualQuantity: number;

  @IsOptional()
  @IsString()
  lotNumber?: string;

  @IsOptional()
  @IsString()
  exceptionNotes?: string;
}

export class PickRecoverDto {
  @IsUUID()
  taskId: string;

  @IsUUID()
  userId: string;
}
