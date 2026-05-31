import { Controller, Post, UseGuards, Body, HttpCode, Req, Logger, HttpStatus } from '@nestjs/common';
import { ScannerAuthGuard } from './guards/scanner-auth.guard';
import { ScannerAuthService } from './scanner-auth.service';
import { ScannerTelemetryService } from './scanner-telemetry.service';
import { TokenBucketRateLimiter } from '../common/rate-limiter/token-bucket.rate-limiter';
import { PrismaService } from '../prisma/prisma.service';

@Controller('scanner')
export class ScannerController {
  private readonly logger = new Logger(ScannerController.name);

  constructor(
    private readonly scannerAuth: ScannerAuthService,
    private readonly scannerTelemetry: ScannerTelemetryService,
    private readonly rateLimiter: TokenBucketRateLimiter,
    private readonly prisma: PrismaService,
  ) {}

  @Post('/session/login')
  @HttpCode(200)
  async login(@Body() body: { deviceId: string; tenantCode: string; pin: string }) {
    return this.scannerAuth.login(body.deviceId, body.tenantCode, body.pin);
  }

  @Post('/validate')
  @UseGuards(ScannerAuthGuard)
  @HttpCode(200)
  async validateBarcode(@Body() body: { barcode: string; seqNum?: number }, @Req() req: any) {
    const allowed = await this.rateLimiter.consume(`SCANNER_VALIDATE:${req.deviceId}`);
    if (!allowed) {
      return { context: null, isValid: false, reason: 'Rate limit exceeded (50/sec)' };
    }

    if (body.seqNum) {
      const { valid } = await this.scannerTelemetry.validateSeqNum(req.deviceId, body.seqNum);
      if (!valid) {
        return { context: null, isValid: false, reason: 'Sequence gap — re-sync required' };
      }
    }

    const barcode = body.barcode?.trim();
    if (!barcode) return { context: null, isValid: false, reason: 'Empty barcode' };

    const product = await this.lookupProductByBarcode(barcode);
    if (product) {
      return {
        context: 'PRODUCT',
        isValid: true,
        entity: {
          id: product.id,
          productCode: product.productCode,
          name: product.name,
          trackLot: product.trackLot,
          trackSerial: product.trackSerial,
          velocityClass: product.velocityClass,
        },
      };
    }

    const location = await this.lookupLocationByCode(barcode);
    if (location) {
      return {
        context: 'LOCATION',
        isValid: true,
        entity: {
          id: location.id,
          locationCode: location.locationCode,
          zoneCode: (location as any).zone?.zoneCode || '',
          type: location.locationType,
          isBlocked: location.isBlocked,
          currentStockCount: 0,
        },
      };
    }

    const lpn = await this.lookupLpn(barcode);
    if (lpn) {
      return {
        context: 'LPN',
        isValid: true,
        entity: {
          id: lpn.id,
          lpnNumber: lpn.lpnNumber,
          status: lpn.status,
          productId: lpn.productId,
          quantity: lpn.quantity,
        },
      };
    }

    return { context: null, isValid: false, reason: 'No matching entity found' };
  }

  @Post('/lookup/product')
  @UseGuards(ScannerAuthGuard)
  @HttpCode(200)
  async lookupProduct(@Body() body: { barcode: string; facilityId?: string }, @Req() req: any) {
    const product = await this.lookupProductByBarcode(body.barcode);
    if (!product) return { found: false };

    const primaryLocation = await this.findPrimaryLocation(product.id, body.facilityId);

    return {
      found: true,
      productCode: product.productCode,
      name: product.name,
      trackLot: product.trackLot,
      trackSerial: product.trackSerial,
      velocityClass: product.velocityClass,
      primaryLocationHint: primaryLocation,
    };
  }

  @Post('/lookup/location')
  @UseGuards(ScannerAuthGuard)
  @HttpCode(200)
  async lookupLocation(@Body() body: { barcode: string; facilityId?: string }, @Req() req: any) {
    const location = await this.lookupLocationByCode(body.barcode);
    if (!location) return { found: false };

    const stockCount = await (this.prisma as any).inventoryOnHand.count({
      where: { locationId: location.id },
    });

    return {
      found: true,
      locationCode: location.locationCode,
      zoneCode: (location as any).zone?.zoneCode || '',
      type: location.locationType,
      isBlocked: location.isBlocked,
      currentStockCount: stockCount,
    };
  }

  @Post('/telemetry')
  @UseGuards(ScannerAuthGuard)
  @HttpCode(200)
  async telemetry(
    @Body() body: { battery: number; wifiStrength: number; errors: string[] },
    @Req() req: any,
  ) {
    await this.scannerTelemetry.recordTelemetry(
      req.deviceId,
      body.battery,
      body.wifiStrength,
      body.errors || [],
    );
    return { recorded: true };
  }

  private async lookupProductByBarcode(barcode: string) {
    const barcodeRecord = await (this.prisma as any).productBarcode.findFirst({
      where: { barcodeValue: barcode, isActive: true },
      select: { productId: true },
    });
    if (!barcodeRecord) return null;

    return (this.prisma as any).product.findFirst({
      where: { id: barcodeRecord.productId },
      select: { id: true, productCode: true, name: true, trackLot: true, trackSerial: true, velocityClass: true },
    });
  }

  private async lookupLocationByCode(code: string) {
    return (this.prisma as any).storageLocation.findFirst({
      where: { locationCode: code, isActive: true },
      include: { zone: { select: { zoneCode: true } } },
    });
  }

  private async lookupLpn(lpnNumber: string) {
    return (this.prisma as any).lPN.findFirst({
      where: { lpnNumber, status: { notIn: ['CONSUMED', 'DISPOSED'] } },
      select: { id: true, lpnNumber: true, status: true, productId: true, quantity: true },
    });
  }

  private async findPrimaryLocation(productId: string, facilityId?: string): Promise<string | null> {
    const where: any = { productId };
    if (facilityId) where.facilityId = facilityId;

    const onHand = await (this.prisma as any).inventoryOnHand.findFirst({
      where,
      orderBy: { quantityOnHand: 'desc' },
      include: { location: { select: { locationCode: true } } },
    });
    return onHand?.location?.locationCode || null;
  }
}
