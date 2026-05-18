import { Logger } from '@nestjs/common';
import {
  WMS_ROLE_DEFINITIONS,
  ALL_WMS_SUBJECTS,
  ALL_WMS_ACTIONS,
} from './permission-registry';

/**
 * Bootstrap validation test that catches scope mismatches
 * between WMS role definitions and the available subjects/actions.
 * Run on app startup to fail fast if definitions are inconsistent.
 */
export function validatePermissionRegistry(): void {
  const logger = new Logger('PermissionRegistryBootstrap');

  const definedSubjects = new Set<string>();
  const definedActions = new Set<string>();

  for (const roleDef of WMS_ROLE_DEFINITIONS) {
    for (const perm of roleDef.permissions) {
      definedSubjects.add(perm.subject);
      definedActions.add(perm.action);
    }
  }

  // Check for references to subjects not in ALL_WMS_SUBJECTS
  for (const subject of definedSubjects) {
    if (subject === 'all') continue;
    if (!ALL_WMS_SUBJECTS.includes(subject as any)) {
      throw new Error(
        `Subject "${subject}" referenced in role definitions but not declared in ALL_WMS_SUBJECTS`,
      );
    }
  }

  // Check for actions not in ALL_WMS_ACTIONS
  for (const action of definedActions) {
    if (!ALL_WMS_ACTIONS.includes(action as any)) {
      throw new Error(
        `Action "${action}" referenced in role definitions but not declared in ALL_WMS_ACTIONS`,
      );
    }
  }

  // Check for unreferenced subjects/actions (potential gaps)
  const unreferencedSubjects = ALL_WMS_SUBJECTS.filter(
    (s) => !definedSubjects.has(s as string),
  );
  if (unreferencedSubjects.length > 0) {
    logger.warn(
      `Subjects not referenced in any role definition: ${unreferencedSubjects.join(', ')}`,
    );
  }

  logger.log('Permission registry validation complete');
}
