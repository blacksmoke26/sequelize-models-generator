/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import knex, { Knex } from 'knex';

// helpers
import EnvHelper from '~/helpers/EnvHelper';

/**
 * A wrapper class for Knex.js database operations
 */
export default class KnexClient {
  /**
   * Creates a new KnexClient instance
   * @returns A new KnexClient instance
   */
  public static create(): Knex {
    return knex({
      client: 'pg',
      connection: EnvHelper.getConnectionString(),
    });
  }
}
