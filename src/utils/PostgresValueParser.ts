/**
 * Type definitions for PostgreSQL value types
 */
export type PostgresValueType =
  | 'smallint'
  | 'integer'
  | 'bigint'
  | 'decimal'
  | 'numeric'
  | 'real'
  | 'double precision'
  | 'smallserial'
  | 'serial'
  | 'bigserial'
  | 'char'
  | 'character'
  | 'varchar'
  | 'character varying'
  | 'text'
  | 'boolean'
  | 'date'
  | 'time'
  | 'time without time zone'
  | 'time with time zone'
  | 'timestamp'
  | 'timestamp without time zone'
  | 'timestamp with time zone'
  | 'timestamptz'
  | 'interval'
  | 'uuid'
  | 'json'
  | 'jsonb'
  | 'bytea'
  | 'inet'
  | 'cidr'
  | 'macaddr'
  | 'point'
  | 'line'
  | 'lseg'
  | 'box'
  | 'path'
  | 'polygon'
  | 'circle'
  | 'array'
  | 'unknown';

/**
 * PostgresValueParser class for converting PostgreSQL values to JavaScript values
 */
export class PostgresValueParser {
  /**
   * Parses a PostgreSQL value and converts it to an appropriate JavaScript value
   * @param value The PostgreSQL value to parse
   * @param typeName The PostgreSQL type name (e.g., 'timestamp', 'json', 'boolean', etc.)
   * @returns The converted JavaScript value
   */
  public static parseValue(value: any, typeName: PostgresValueType): any {
    if (value === null || value === undefined) {
      return null;
    }

    switch (typeName.toLowerCase()) {
      case 'timestamp':
      case 'timestamptz':
      case 'date':
        return this.parseDate(value);

      case 'json':
      case 'jsonb':
        return this.parseJson(value);

      case 'boolean':
        return this.parseBoolean(value);

      case 'numeric':
      case 'decimal':
        return this.parseNumeric(value);

      case 'array':
        return this.parseArray(value);

      case 'uuid':
        return this.parseUuid(value);

      case 'interval':
        return this.parseInterval(value);

      case 'bytea':
        return this.parseBytea(value);

      default:
        // For other types, return the value as is
        return value;
    }
  }

  /**
   * Parses a date/time value from PostgreSQL
   * @param value The PostgreSQL date/time value
   * @returns JavaScript Date object
   */
  private static parseDate(value: string | Date): Date {
    if (value instanceof Date) {
      return value;
    }
    return new Date(value);
  }

  /**
   * Parses a JSON value from PostgreSQL
   * @param value The PostgreSQL JSON value
   * @returns Parsed JavaScript object or array
   */
  private static parseJson(value: string | object): any {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        // If parsing fails, return the original string
        return value;
      }
    }
    return value;
  }

  /**
   * Parses a boolean value from PostgreSQL
   * @param value The PostgreSQL boolean value
   * @returns JavaScript boolean
   */
  private static parseBoolean(value: string | boolean): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === 't' || value === '1';
    }
    return Boolean(value);
  }

  /**
   * Parses a numeric value from PostgreSQL
   * @param value The PostgreSQL numeric value
   * @returns JavaScript number
   */
  private static parseNumeric(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }
    return parseFloat(value);
  }

  /**
   * Parses an array value from PostgreSQL
   * @param value The PostgreSQL array value
   * @returns JavaScript array
   */
  private static parseArray(value: string | any[]): any[] | string {
    if (Array.isArray(value)) {
      return value;
    }
    try {
      // Remove curly braces and split by comma
      const arrayStr = value.substring(1, value.length - 1);
      if (arrayStr === '') {
        return [];
      }

      // Handle array parsing (simplified version)
      return this.parseArrayElements(arrayStr);
    } catch {
      // If parsing fails, return the original string
      return value;
    }
  }

  /**
   * Helper method to parse array elements
   * @param arrayStr The string representation of array elements
   * @returns Array of parsed elements
   */
  private static parseArrayElements(arrayStr: string): any[] {
    const elements: any[] = [];
    let currentElement = '';
    let inQuotes = false;
    let escapeNext = false;

    for (let i = 0; i < arrayStr.length; i++) {
      const char = arrayStr[i];

      if (escapeNext) {
        currentElement += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        currentElement += char;
        continue;
      }

      if (char === ',' && !inQuotes) {
        elements.push(currentElement.trim());
        currentElement = '';
        continue;
      }

      currentElement += char;
    }

    if (currentElement.trim() !== '') {
      elements.push(currentElement.trim());
    }

    // Convert elements to appropriate types
    return elements.map(element => {
      // Remove surrounding quotes if present
      if (element.startsWith('"') && element.endsWith('"')) {
        return element.substring(1, element.length - 1);
      }
      // Try to convert to number if possible
      if (/^-?\d+(\.\d+)?$/.test(element)) {
        return parseFloat(element);
      }
      // Try to convert to boolean
      if (element.toLowerCase() === 'true' || element === 't' || element === '1') {
        return true;
      }
      if (element.toLowerCase() === 'false' || element === 'f' || element === '0') {
        return false;
      }
      return element;
    });
  }

  /**
   * Parses a UUID value from PostgreSQL
   * @param value The PostgreSQL UUID value
   * @returns JavaScript string
   */
  private static parseUuid(value: string): string {
    return value;
  }

  /**
   * Parses an interval value from PostgreSQL
   * @param value The PostgreSQL interval value
   * @returns JavaScript string or object representing the interval
   */
  private static parseInterval(value: string): string {
    return value;
  }

  /**
   * Parses a bytea value from PostgreSQL
   * @param value The PostgreSQL bytea value
   * @returns JavaScript Buffer or string
   */
  private static parseBytea(value: unknown): Buffer | string {
    if (typeof value === 'string' && value.startsWith('\\x')) {
      try {
        return Buffer.from(value.substring(2), 'hex');
      } catch {
        return value;
      }
    }
    return value as string;
  }
}
