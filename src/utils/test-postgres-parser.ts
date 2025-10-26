import { PostgresValueParser } from './PostgresValueParser';

// Test cases for PostgreSQL value parsing
console.log('Testing PostgresValueParser...');

// Test date/time types
console.log('\n=== Testing Date/Time Types ===');
const dateTest = PostgresValueParser.parseValue('2025-10-25', 'date');
console.log('Date:', dateTest, typeof dateTest);

const timestampTest = PostgresValueParser.parseValue('2025-10-25T15:00:00', 'timestamp');
console.log('Timestamp:', timestampTest, typeof timestampTest);

const timestamptzTest = PostgresValueParser.parseValue('2025-10-25T15:00:00Z', 'timestamptz');
console.log('Timestamptz:', timestamptzTest, typeof timestamptzTest);

// Test JSON types
console.log('\n=== Testing JSON Types ===');
const jsonTest = PostgresValueParser.parseValue('{"name": "John", "age": 30}', 'json');
console.log('JSON:', jsonTest, typeof jsonTest);

const jsonbTest = PostgresValueParser.parseValue('{"name": "Jane", "age": 25}', 'jsonb');
console.log('JSONB:', jsonbTest, typeof jsonbTest);

// Test boolean
console.log('\n=== Testing Boolean ===');
const booleanTest1 = PostgresValueParser.parseValue('true', 'boolean');
console.log('Boolean (string "true"):', booleanTest1, typeof booleanTest1);

const booleanTest2 = PostgresValueParser.parseValue('false', 'boolean');
console.log('Boolean (string "false"):', booleanTest2, typeof booleanTest2);

const booleanTest3 = PostgresValueParser.parseValue('t', 'boolean');
console.log('Boolean (string "t"):', booleanTest3, typeof booleanTest3);

const booleanTest4 = PostgresValueParser.parseValue('1', 'boolean');
console.log('Boolean (string "1"):', booleanTest4, typeof booleanTest4);

// Test numeric types
console.log('\n=== Testing Numeric Types ===');
const numericTest1 = PostgresValueParser.parseValue('123.45', 'numeric');
console.log('Numeric (string):', numericTest1, typeof numericTest1);

const numericTest2 = PostgresValueParser.parseValue(678.9, 'numeric');
console.log('Numeric (number):', numericTest2, typeof numericTest2);

// Test array
console.log('\n=== Testing Array ===');
const arrayTest1 = PostgresValueParser.parseValue('{1,2,3,4}', 'array');
console.log('Array (string):', arrayTest1, typeof arrayTest1);

const arrayTest2 = PostgresValueParser.parseValue('{true,false,true}', 'array');
console.log('Array (boolean strings):', arrayTest2, typeof arrayTest2);

const arrayTest3 = PostgresValueParser.parseValue('{1.5,2.5,3.5}', 'array');
console.log('Array (float strings):', arrayTest3, typeof arrayTest3);

// Test UUID
console.log('\n=== Testing UUID ===');
const uuidTest = PostgresValueParser.parseValue('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'uuid');
console.log('UUID:', uuidTest, typeof uuidTest);

// Test bytea
console.log('\n=== Testing Bytea ===');
const byteaTest1 = PostgresValueParser.parseValue('\\x48656c6c6f', 'bytea');
console.log('Bytea (hex string):', byteaTest1, typeof byteaTest1);

const byteaTest2 = PostgresValueParser.parseValue('not-a-hex', 'bytea');
console.log('Bytea (non-hex string):', byteaTest2, typeof byteaTest2);

// Test null/undefined
console.log('\n=== Testing Null/Undefined ===');
const nullTest = PostgresValueParser.parseValue(null, 'text');
console.log('Null:', nullTest, typeof nullTest);

const undefinedTest = PostgresValueParser.parseValue(undefined, 'text');
console.log('Undefined:', undefinedTest, typeof undefinedTest);

// Test unknown type
console.log('\n=== Testing Unknown Type ===');
const unknownTest = PostgresValueParser.parseValue('some value', 'unknown');
console.log('Unknown type:', unknownTest, typeof unknownTest);

console.log('\nTests completed!');
