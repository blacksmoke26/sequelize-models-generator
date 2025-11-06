/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import { TriggerEvent, TriggerTiming, ViewType } from '~/classes/DbMigrator';
import { generateComposites } from '~/scripts/generate-scaffold-custom/libs/migration.lib';

/**
 * Interface representing a database view.
 */
export interface DbView {
  /** Database schema name */
  schema: string;
  /** View name */
  name: string;
  /** Type of view (materialized or regular) */
  type: ViewType | null;
  /** Owner of the view */
  owner: string;
  /** SQL definition of the view */
  definition: string;
  /** Comment associated with the view */
  comment: string | null;
  /** Note about when the view was created */
  creationTimeNote: string;
  /** Estimated number of times the view has been accessed */
  estimatedAccessCount: number;
  /** Size of the view on disk */
  viewSize: string | null;
  /** Timestamp of the last vacuum or analyze operation */
  lastVacuumOrAnalyze: string | null;
}

/**
 * Interface representing a database domain.
 */
export interface DbDomain {
  /** Database schema name */
  schema: string;
  /** Domain name */
  name: string;
  /** Base type of the domain */
  baseType: string;
  /** Definition of the domain */
  definition: string;
}

/**
 * Interface representing a database function.
 */
export interface DbFunction {
  /** Database schema name */
  schema: string;
  /** Function name */
  name: string;
  /** Function arguments */
  arguments: string;
  /** Return type of the function */
  returnType: string;
  /** Language in which the function is implemented */
  language: string;
  /** Volatility classification of the function */
  volatility: string;
  /** Whether the function is a security definer */
  isSecurityDefiner: boolean;
  /** Function definition */
  definition: string;
}

/**
 * Interface representing a database trigger.
 */
export interface DbTrigger {
  /** Database schema name */
  schema: string;
  /** Table name the trigger is associated with */
  table: string;
  /** Trigger name */
  name: string;
  /** Timing of the trigger (BEFORE, AFTER, etc.) */
  timing: TriggerTiming;
  /** Event that fires the trigger (INSERT, UPDATE, DELETE, etc.) */
  event: TriggerEvent;
  /** Schema of the function executed by the trigger */
  functionSchema: string;
  /** Name of the function executed by the trigger */
  functionName: string;
  /** Current enabled/disabled status of the trigger */
  enabledStatus: string;
  /** Whether this is a constraint trigger */
  isConstraintTrigger: boolean;
  /** SQL definition of the trigger */
  definition: string;
}

export interface DbComposite {
  schema: string;
  name: string;
  params: string;
  definition: string;
}
