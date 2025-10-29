/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

/**
 * Interface for database connection parameters.
 */
interface ConnectionData {
  /** The username for database authentication. */
  username: string;
  /** The password for database authentication. */
  password: string;
  /** The database host address. */
  host: string;
  /** The name of the database. */
  name: string;
}

/**
 * Helper class for environment variable handling.
 */
export default abstract class EnvHelper {
  /**
   * Constructs a PostgreSQL connection string from environment variables.
   * @returns The connection string.
   */
  public static getConnectionString(): string {
    const { username, password, host, name } = this.getDbConfig();
    return `postgresql://${username}:${password}@${host}/${name}`;
  }

  /**
   * Retrieves database configuration from environment variables.
   * @returns The database configuration object.
   */
  public static getDbConfig(): ConnectionData {
    return {
      username: process.env?.DATABASE_USERNAME ?? '',
      password: process.env?.DATABASE_PASSWORD ?? '',
      host: process.env?.DATABASE_HOST ?? '',
      name: process.env?.DATABASE_NAME ?? '',
    };
  }
}
