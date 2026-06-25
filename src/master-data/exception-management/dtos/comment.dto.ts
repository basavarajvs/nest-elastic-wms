import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ type: String })
  @IsString()
  body: string;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

export class CommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  exceptionId: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  authorUserId: string;

  @ApiProperty()
  isInternal: boolean;

  @ApiProperty()
  createdAt: Date;
}
