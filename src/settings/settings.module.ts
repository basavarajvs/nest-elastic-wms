import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsService } from './settings.service';
import { SettingsWebController } from './web/settings.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SettingsWebController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
