import { Injectable } from '@nestjs/common';
import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
} from '@casl/ability';
import { WmsAbility, WmsAction, WmsSubjects } from './casl.types';
import { WMS_ROLE_DEFINITIONS, ALL_WMS_SUBJECTS } from './permission-registry';

@Injectable()
export class WmsAbilityFactory {
  createForUser(jwtPayload: any): WmsAbility {
    const { can, cannot, build } = new AbilityBuilder<WmsAbility>(
      createMongoAbility,
    );

    const roles: string[] = jwtPayload.roles || [];
    const permissions: string[] = jwtPayload.permissions || [];

    // Core TENANT_ADMIN → full access
    if (roles.includes('TENANT_ADMIN')) {
      can(WmsAction.Manage, 'all');
      return build({
        detectSubjectType: (item: any) =>
          typeof item === 'string'
            ? item
            : item.__caslSubjectType__ || (item.constructor?.name),
      });
    }

    // Apply WMS role definitions
    for (const roleDef of WMS_ROLE_DEFINITIONS) {
      if (roles.includes(roleDef.roleCode)) {
        for (const perm of roleDef.permissions) {
          const subject = perm.subject === 'all' ? 'all' : perm.subject;
          can(perm.action, subject);

          // Manage implies all specific actions on that subject
          if (perm.action === WmsAction.Manage && subject !== 'all') {
            can([WmsAction.Create, WmsAction.Read, WmsAction.Update, WmsAction.Delete], subject);
          }
        }
      }
    }

    // Process permission codes from Core JWT
    for (const perm of permissions) {
      const code: string = typeof perm === 'string' ? perm : (perm as any).code;
      const [resourceStr, actionStr] = code.split(':');
      if (!resourceStr || !actionStr) continue;

      // Check if this is a WMS subject
      const wmsSubject = ALL_WMS_SUBJECTS.find(
        (s) => s.toUpperCase() === resourceStr,
      );
      if (!wmsSubject) continue;

      const wmsAction = this.mapAction(actionStr);
      if (wmsAction) {
        can(wmsAction, wmsSubject as any);
      }
    }

    // Auth method restrictions
    if (jwtPayload.authMethod === 'pin') {
      cannot(WmsAction.Delete, 'all');
      cannot(WmsAction.Create, 'all');
      cannot(WmsAction.Update, 'all');
      cannot(WmsAction.Approve, 'all');
    }

    return build({
      detectSubjectType: (item: any) => {
        if (typeof item === 'string') return item as any;
        if (item.__caslSubjectType__) return item.__caslSubjectType__;
        if (item.constructor && item.constructor.name !== 'Object') {
          return item.constructor as ExtractSubjectType<WmsSubjects>;
        }
        return undefined as any;
      },
    });
  }

  private mapAction(actionStr: string): WmsAction | null {
    const map: Record<string, WmsAction> = {
      MANAGE: WmsAction.Manage,
      CREATE: WmsAction.Create,
      READ: WmsAction.Read,
      UPDATE: WmsAction.Update,
      DELETE: WmsAction.Delete,
      LIST: WmsAction.List,
      RECEIVE: WmsAction.Receive,
      PICK: WmsAction.Pick,
      PACK: WmsAction.Pack,
      SHIP: WmsAction.Ship,
      ADJUST: WmsAction.Adjust,
      COUNT: WmsAction.Count,
      APPROVE: WmsAction.Approve,
      TRANSACT: WmsAction.Transact,
      EXECUTEPUTAWAY: WmsAction.ExecutePutaway,
      PERFORMQC: WmsAction.PerformQc,
      RELEASE: WmsAction.Release,
      SHORTPICK: WmsAction.ShortPick,
      REALLOCATE: WmsAction.Reallocate,
      CANCEL: WmsAction.Cancel,
      INITIATETRANSFER: WmsAction.InitiateTransfer,
      RECEIVETRANSFER: WmsAction.ReceiveTransfer,
      EXECUTECYCLECOUNT: WmsAction.ExecuteCycleCount,
      APPROVEADJUSTMENT: WmsAction.ApproveAdjustment,
      MANAGECYCLECOUNTSCHEDULE: WmsAction.ManageCycleCountSchedule,
      OVERRIDEAPPROVAL: WmsAction.OverrideApproval,
    };
    return map[actionStr.toUpperCase()] || null;
  }
}
