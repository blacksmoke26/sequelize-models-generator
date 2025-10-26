import crypto from 'node:crypto';
import rs from 'randomstring';

/**
 * A helper class for generating random strings.
 */
export default abstract class RandomHelper {
  /**
   * Generates a random string of the given length and options.
   * @param length The length of the random string to generate. Defaults to 20.
   * @param options Additional options for string generation, excluding the 'length' property.
   * @returns The generated random string.
   */
  public static randomString(
    length: number = 21,
    options: Omit<rs.GenerateOptions, 'length'> = {},
  ): string {
    return rs.generate({ length, ...options });
  }

  /**
   * Generates a SHA1 hash of the given string.
   * @param input The string to hash.
   * @returns The SHA1 hash of the input string.
   */
  public static sha1(input: string): string {
    return crypto.createHash('sha1').update(input).digest('hex');
  }

  /**
   * Generates a random number between the given minimum and maximum values (inclusive).
   * @param min The minimum value of the range.
   * @param max The maximum value of the range.
   * @returns A random number between min and max (inclusive).
   */
  public static randomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
