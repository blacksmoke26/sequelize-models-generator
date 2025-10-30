/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Utility class for file operations.
 *
 * This class provides methods for reading and writing files.
 */
export default abstract class FileHelper {
  /**
   * Saves a JSON string to a file at the given path.
   * @param filePath The path where the file will be saved.
   * @param jsonString The JSON string to save.
   */
  public static saveJsonToFile(filePath: string, jsonString: string): void {
    try {
      fs.rmSync(filePath);
    } catch {
      // do nothing
    }

    fs.writeFileSync(filePath, jsonString, 'utf8');
  }

  /**
   * Saves a string to a file at the given path.
   * @param filePath The path where the file will be saved.
   * @param text The string to write.
   */
  public static saveTextToFile(filePath: string, text: string): void {
    try {
      fs.rmSync(filePath);
    } catch {
      // do nothing
    }

    fs.writeFileSync(filePath, text, 'utf8');
  }

  /**
   * Reads the contents of a file at the given path.
   * @param filePath The path of the file to read.
   * @returns The contents of the file as a string.
   */
  public static readFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8');
  }

  /**
   * Reads a SQL file from the sqls directory.
   * @param filename The name of the SQL file to read.
   * @returns The contents of the SQL file as a string.
   * @example
   * ```typescript
   * const sqlContent = FileHelper.readSqlFile('query.sql');
   * console.log(sqlContent);
   * ```
   */
  public static readSqlFile(filename: string): string {
    return fs.readFileSync(
      path.join(__dirname, '..', 'sqls', filename),
      'utf8',
    );
  }

  /**
   * Gets the root path of the project.
   * @param [dir] - Additional directory segments to append to the root path.
   * @returns The absolute path to the project root directory, optionally extended by additional directory segments.
   */
  public static rootPath(...dir: string[]): string {
    return path.normalize(path.join(__dirname, '..', '..', ...dir));
  }
}
