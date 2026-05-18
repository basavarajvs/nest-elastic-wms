import { SetMetadata } from '@nestjs/common';

export const RF_ACTION_KEY = 'rf_action';

export const RfAction = (action: string) => SetMetadata(RF_ACTION_KEY, action);
