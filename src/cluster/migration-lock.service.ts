import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MigrationLockService {
  private readonly logger = new Logger(MigrationLockService.name);

  constructor(private readonly prisma: PrismaService) {}

  async acquireLock(lockId: number = 123456789, timeoutMs: number = 300000): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRawUnsafe<Array<{ pg_try_advisory_lock: boolean }>>(
        'SELECT pg_try_advisory_lock($1)',
        lockId,
      );
      const acquired = result?.[0]?.pg_try_advisory_lock === true;
      if (acquired) {
        this.logger.log(`Advisory lock ${lockId} acquired`);
      }
      return acquired;
    } catch (err: any) {
      this.logger.error(`Failed to acquire lock ${lockId}: ${err.message}`);
      return false;
    }
  }

  async releaseLock(lockId: number = 123456789): Promise<void> {
    try {
      await this.prisma.$queryRawUnsafe('SELECT pg_advisory_unlock($1)', lockId);
      this.logger.log(`Advisory lock ${lockId} released`);
    } catch (err: any) {
      this.logger.error(`Failed to release lock ${lockId}: ${err.message}`);
    }
  }

  async waitForLock(lockId: number = 123456789, timeoutMs: number = 300000): Promise<void> {
    const pollInterval = 1000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const acquired = await this.acquireLock(lockId);
      if (acquired) return;
      await new Promise((r) => setTimeout(r, pollInterval));
    }

    throw new Error(`Migration lock ${lockId} not acquired within ${timeoutMs}ms`);
  }
}
