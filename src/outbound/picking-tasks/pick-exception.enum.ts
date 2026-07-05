export enum PickExceptionReason {
  DAMAGE = 'DAMAGE',
  SHORT = 'SHORT',
  PICK_ERROR = 'PICK_ERROR',
  WRONG_PRODUCT = 'WRONG_PRODUCT',
  LABEL_DAMAGE = 'LABEL_DAMAGE',
  PACKAGING_ISSUE = 'PACKAGING_ISSUE',
  OTHER = 'OTHER',
}

export const PICK_EXCEPTION_REASONS = Object.values(PickExceptionReason);
