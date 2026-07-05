import { SetMetadata } from '@nestjs/common';

export const CHECK_ABILITY_KEY = 'policies';

export interface PolicyHandler {
  action: string;
  subject: string;
}

export const CheckAbility = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_ABILITY_KEY, handlers);
