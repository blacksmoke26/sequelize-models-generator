/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

// types
import type { Knex } from 'knex';

/**
 * Utility class for data operations.
 */
export default abstract class DataUtils {
  /**
     * Retrieves the longest JSON string from a specified column in a database table.
     *
     * @param knex - Knex instance for database connection.
     * @param params - Parameters for the query.
     * @param params.schemaName - Optional schema name (defaults to 'public').
     * @param params.tableName - Name of the table to query.
     * @param params.columnName - Name of the column containing JSON data.
     * @returns Promise resolving to the longest JSON string as text.
     */
  public static async getLongestJson(knex: Knex, params: { schemaName?: string; tableName: string; columnName: string }): Promise<string> {
    const [text = null] = await knex
      .from(`${params?.schemaName ?? 'public'}.${params.tableName}`)
      .select(knex.raw(`${params.columnName}::TEXT`))
      .orderByRaw(`LENGTH(${params.columnName}::TEXT) DESC`)
      .limit(1)
      .first();

    return text?.trim?.() ?? '{}';
  }
}
