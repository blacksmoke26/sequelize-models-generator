/**
 * A helper class for handling date and time operations.
 */
export default abstract class DateTimeHelper {
  /**
   * Gets the current date and time in ISO 8601 format.
   * @returns The current datetime as an ISO string (e.g., "2023-12-25T10:30:45.123Z").
   */
  public static getCurrentISODateTime(): string {
    return new Date().toISOString();
  }

  /**
   * Gets the current date in ISO 8601 format (YYYY-MM-DD).
   * @returns The current date as an ISO string (e.g., "2023-12-25").
   */
  public static getCurrentISODate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Gets the current time in ISO 8601 format (HH:mm:ss).
   * @returns The current time as an ISO string (e.g., "10:30:45").
   */
  public static getCurrentISOTime(): string {
    return new Date().toISOString().split('T')[1].split('.')[0];
  }

  /**
   * Formats a Date object to ISO 8601 datetime string.
   * @param date The date to format. If not provided, uses current date.
   * @returns The formatted datetime as an ISO string.
   */
  public static toISODateTime(date?: Date): string {
    const targetDate = date || new Date();
    return targetDate.toISOString();
  }

  /**
   * Parses an ISO datetime string to a Date object.
   * @param isoString The ISO datetime string to parse.
   * @returns A Date object parsed from the ISO string.
   */
  public static parseISODateTime(isoString: string): Date {
    return new Date(isoString);
  }

  public static fromDate(date: Date): string {
    return date.toISOString();
  }

  public static now(): string {
    return this.fromDate(new Date(Date.now()));
  }
}
