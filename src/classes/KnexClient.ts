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
 *
 * This class provides a simplified interface for creating and managing Knex.js database connections.
 * It encapsulates the configuration and initialization logic for PostgreSQL database connections.
 */
export default class KnexClient {
  /**
   * Creates a new Knex.js database connection instance
   *
   * This static method initializes a new Knex instance configured for PostgreSQL.
   * If no connection string is provided, it falls back to the environment configuration
   * retrieved through the EnvHelper utility.
   *
   * @param connectionString - Optional PostgreSQL connection string. If not provided,
   *                          the method will attempt to retrieve it from environment variables.
   *                          Should follow the format: postgresql://[user[:password]@][host][:port][/dbname][?param1=value1&...]
   *
   * @returns A configured Knex.js instance ready for database operations
   *
   * @example
   * // Using environment connection string
   * const db = KnexClient.create();
   *
   * @example
   * // Using custom connection string
   * const db = KnexClient.create('postgresql://user:pass@localhost:5432/mydb');
   *
   * @throws {Error} When connection string is invalid or database connection fails
   *
   * @see {@link https://knexjs.org/#Installation-node} For Knex.js installation and usage guide
   * @see {@link https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING} For PostgreSQL connection string format
   */
  public static create(connectionString: string = undefined): Knex {
    return knex({
      client: 'pg',
      connection: connectionString ?? EnvHelper.getConnectionString(),
    });
  }
}
