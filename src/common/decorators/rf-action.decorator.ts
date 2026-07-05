import { SetMetadata } from '@nestjs/common';

export const RF_ACTION_KEY = 'rf_action';

export type RfActionType = 'read' | 'create' | 'update' | 'delete';

export const RfAction = (action: RfActionType) =>
  SetMetadata(RF_ACTION_KEY, action);
