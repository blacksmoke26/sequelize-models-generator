export function parsePostgreSQLValue(value: any, type: string): any {
  if (value === null || value === undefined) {
    return value;
  }

  switch (type) {
    case 'boolean':
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return Boolean(value);
    case 'bytea':
      if (typeof value === 'string') {
        // Handle PostgreSQL bytea format (e.g., '\x48656c6c6f')
        if (value.startsWith('\\x')) {
          const hex = value.slice(2);
          return Buffer.from(hex, 'hex');
        }
        return value;
      }
      return value;
    case 'character':
    case 'char':
    case 'character varying':
    case 'varchar':
    case 'text':
      return String(value);
    case 'smallint':
      if (typeof value === 'string') {
        return parseInt(value, 10);
      }
      return Number(value);
    case 'real':
    case 'double precision':
      if (typeof value === 'string') {
        return parseFloat(value);
      }
      return Number(value);
    case 'time':
    case 'timetz':
      if (typeof value === 'string') {
        return value;
      }
      return value;
    case 'interval':
      if (typeof value === 'string') {
        return value;
      }
      return value;
    case 'uuid':
      if (typeof value === 'string') {
        return value;
      }
      return value;
    case 'inet':
      if (typeof value === 'string') {
        return value;
      }
      return value;
    case 'cidr':
      if (typeof value === 'string') {
        return value;
      }
      return value;
    case 'macaddr':
      if (typeof value === 'string') {
        return value;
      }
      return value;
    case 'bit':
    case 'bit varying':
      if (typeof value === 'string') {
        return value;
      }
      return value;
    case 'money':
      if (typeof value === 'string') {
        // Remove currency symbols and parse
        const cleanValue = value.replace(/[^0-9.-]/g, '');
        return parseFloat(cleanValue);
      }
      return Number(value);
    case 'date':
      if (typeof value === 'string') {
        return new Date(value);
      }
      return value;
    case 'point':
    case 'line':
    case 'lseg':
    case 'box':
    case 'path':
    case 'polygon':
    case 'circle':
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      }
      return value;
    case 'integer':
    case 'bigint':
      if (typeof value === 'string') {
        return parseInt(value, 10);
      }
      return Number(value);

    case 'numeric':
    case 'decimal':
      if (typeof value === 'string') {
        return parseFloat(value);
      }
      return Number(value);

    case 'timestamp':
    case 'timestamptz':
      if (typeof value === 'string') {
        return new Date(value);
      }
      return value;

    case 'json':
    case 'jsonb':
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      }
      return value;
    case 'array':
      if (typeof value === 'string') {
        // Handle PostgreSQL array format (e.g., '{1,2,3}')
        if (value.startsWith('{') && value.endsWith('}')) {
          const arrayString = value.slice(1, -1);
          if (arrayString === '') {
            return [];
          }
          // Split by comma, but be careful with commas inside array elements
          const elements = [];
          let currentElement = '';
          let inQuotes = false;
          let quoteChar = '';
          let i = 0;

          while (i < arrayString.length) {
            const char = arrayString[i];

            if ((char === '"' || char === "'") && !inQuotes) {
              inQuotes = true;
              quoteChar = char;
            } else if (
              char === quoteChar &&
              inQuotes &&
              (i === 0 || arrayString[i - 1] !== '\\')
            ) {
              inQuotes = false;
              quoteChar = '';
            } else if (char === ',' && !inQuotes) {
              elements.push(currentElement.trim());
              currentElement = '';
            } else {
              currentElement += char;
            }
            i++;
          }

          if (currentElement !== '') {
            elements.push(currentElement.trim());
          }

          return elements;
        }
        return value;
      }
      return value;
    default:
      return value;
  }
}
