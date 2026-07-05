import { SetMetadata } from '@nestjs/common';

export const HOLD_OVERRIDE_KEY = 'hold_override';

export const HoldOverride = () => SetMetadata(HOLD_OVERRIDE_KEY, true);
