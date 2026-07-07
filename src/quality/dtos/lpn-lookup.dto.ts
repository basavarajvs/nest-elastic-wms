import { ApiProperty } from '@nestjs/swagger';

export class LpnLookupResultDto {
  @ApiProperty() lpn: any;
  @ApiProperty() product: any;
  @ApiProperty() receiptInfo: any;
  @ApiProperty() existingInspections: any[];
}
