import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantStore {
  tenantId: string;
  tenantCode: string;
  tenantStatus: string;
  isSystemContext: boolean;
}

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantStore>();

  set(store: TenantStore): void {
    this.storage.enterWith(store);
  }

  get(): TenantStore | undefined {
    return this.storage.getStore();
  }

  getTenantId(): string {
    const store = this.get();
    if (!store || !store.tenantId) {
      throw new UnauthorizedException('Tenant context not found');
    }
    return store.tenantId;
  }

  isSystemContext(): boolean {
    const store = this.get();
    return store?.isSystemContext === true;
  }

  async run<T>(store: TenantStore, fn: () => Promise<T>): Promise<T> {
    return this.storage.run(store, fn);
  }

  async runAsSystem<T>(fn: () => Promise<T>): Promise<T> {
    const systemStore: TenantStore = {
      tenantId: '',
      tenantCode: 'SYSTEM',
      tenantStatus: 'active',
      isSystemContext: true,
    };
    return this.run(systemStore, fn);
  }
}
