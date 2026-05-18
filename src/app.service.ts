import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot() {
    return {
      name: 'WMS Application',
      version: '1.0.0-wms',
      description: 'Warehouse Management System on SaaS Core',
    };
  }
}
