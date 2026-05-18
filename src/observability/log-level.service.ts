import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import pino from 'pino';

const AUTO_REVERT_MS = 30 * 60 * 1000;

@Injectable()
export class LogLevelService {
  private readonly logger = new Logger(LogLevelService.name);
  private pinoInstance: pino.Logger | null = null;
  private originalLevel = 'info';
  private revertTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly eventEmitter: EventEmitter2) {}

  setPinoInstance(logger: pino.Logger): void {
    this.pinoInstance = logger;
    this.originalLevel = logger.level;
  }

  @OnEvent('system_settings.changed')
  onSettingsChanged(payload: { key: string; value: string }) {
    if (payload.key === 'log_level_override') {
      this.setLevel(payload.value);
    }
  }

  setLevel(level: string): void {
    const valid = ['debug', 'info', 'warn', 'error', 'trace', 'fatal'];
    if (!valid.includes(level)) {
      this.logger.warn(`Invalid log level: ${level}`);
      return;
    }

    if (!this.pinoInstance) {
      this.logger.warn('Pino instance not set, cannot change log level');
      return;
    }

    this.pinoInstance.level = level;
    this.logger.log(`Log level changed to: ${level}`);

    this.eventEmitter.emit('log.level.changed', {
      previousLevel: this.originalLevel,
      newLevel: level,
      timestamp: new Date().toISOString(),
    });

    if (this.revertTimer) clearTimeout(this.revertTimer);
    this.revertTimer = setTimeout(() => {
      if (this.pinoInstance) {
        this.pinoInstance.level = this.originalLevel;
        this.logger.log(`Log level auto-reverted to: ${this.originalLevel}`);
        this.eventEmitter.emit('log.level.changed', {
          previousLevel: level,
          newLevel: this.originalLevel,
          reason: 'auto_revert_timeout',
        });
      }
    }, AUTO_REVERT_MS);
  }

  getCurrentLevel(): string {
    return this.pinoInstance?.level || this.originalLevel;
  }
}
