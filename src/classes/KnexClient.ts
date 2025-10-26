import knex from 'knex';
import {getConnectionString} from '~/constants/file-system';

/**
 * A wrapper class for Knex.js database operations
 */
export default class KnexClient {
  /**
   * Creates a new KnexClient instance
   * @returns A new KnexClient instance
   */
  public static create(): knex.Knex {
    return knex({
      client: 'pg',
      connection: getConnectionString(),
    });
  }
}
