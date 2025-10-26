export function convertJsonToTs(
  json: Record<string, unknown>,
  interfaceName: string = 'Root',
): string {
  try {
    return parseObject(json, interfaceName);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith('Circular reference detected')
    ) {
      throw error; // Re-throw circular reference errors directly
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error converting JSON to TypeScript: ${errorMessage}`);
  }
}

function determineType(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return 'any[]'; // Explicitly handle empty arrays
    const baseType = determineType(value[0] || 'any'); // Determine type of the first element
    const depth = calculateArrayDepth(value);
    return `${baseType}${'[]'.repeat(depth)}`;
  } else if (value === null || value === undefined) {
    return 'any'; // Null or undefined maps to `any`
  } else if (typeof value === 'string' && isISODate(value)) {
    return 'Date'; // ISO date strings map to `Date`
  } else if (typeof value === 'object') {
    return 'object'; // Generic object type
  }
  return typeof value; // Fallback to primitive JavaScript types
}

function isISODate(value: string): boolean {
  const isoDateRegex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
  return isoDateRegex.test(value);
}

function calculateArrayDepth(arr: unknown): number {
  let depth = 0;
  while (Array.isArray(arr) && arr.length > 0) {
    depth++;
    arr = arr[0];
  }
  return depth;
}

function pluralToSingular(name: string): string {
  if (name.endsWith('ies')) return name.slice(0, -3) + 'y';
  if (name.endsWith('s')) return name.slice(0, -1);
  return name;
}

function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function formatKeysToOptional(
  content: Record<string, unknown>,
  optionalKeys: string[],
): string {
  let result = JSON.stringify(content, null, 2)
    .replace(/"/g, '')
    .replace(/,/g, '');

  Object.keys(content).forEach((key) => {
    const keyRegex = new RegExp(`${key}:`, 'g');
    result = optionalKeys.includes(key)
      ? result.replace(keyRegex, `${key}?:`)
      : result.replace(keyRegex, `${key}:`);
  });

  return result;
}

function parseObject(
  obj: Record<string, unknown>,
  parentName: string = 'Root',
  seen: Set<Record<string, unknown>> = new Set(),
  rootName: string = parentName, // To track root for circular references
): string {
  if (seen.has(obj)) {
    throw new Error(`Circular reference detected in ${rootName}`);
  }
  seen.add(obj);

  const optionalKeys: string[] = [];
  const nestedInterfaces: string[] = [];
  const parsedObject: Record<string, string> = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      optionalKeys.push(key); // Mark key as optional
    }

    const fieldType = determineType(value);

    if (fieldType === 'object' && value !== null && typeof value === 'object') {
      const childName = capitalize(pluralToSingular(key));
      nestedInterfaces.push(
        parseObject(value as Record<string, unknown>, childName, seen, rootName),
      );
      parsedObject[key] = `${childName};`;
    } else if (Array.isArray(value)) {
      const arrayType = determineType(value.flat(Infinity)[0] || 'any');
      if (arrayType === 'object' && value[0] !== null) {
        const childName = capitalize(pluralToSingular(key));
        nestedInterfaces.push(
          parseObject(
            value[0] as Record<string, unknown>,
            childName,
            seen,
            rootName,
          ),
        );
        parsedObject[key] = `${childName}[];`;
      } else {
        const depth = calculateArrayDepth(value);
        parsedObject[key] = `${arrayType}${'[]'.repeat(depth)};`;
      }
    } else {
      parsedObject[key] = `${fieldType};`;
    }
  });

  seen.delete(obj);
  const formattedContent = formatKeysToOptional(parsedObject, optionalKeys);
  return `interface ${parentName} ${formattedContent}

${nestedInterfaces.join('\n')}`;
}
