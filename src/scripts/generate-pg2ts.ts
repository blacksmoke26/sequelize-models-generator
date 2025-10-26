import 'dotenv/config';

import Case from 'case';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {createDir, DIST_DIR} from '~/constants/file-system';
import {getJsType, pgSequelizeTypeMap} from '~/constants/pg';
import DatabaseUtils from '~/classes/DatabaseUtils';
import TypeUtils from '~/classes/TypeUtils';
import TableUtils from '~/classes/TableUtils';
import KnexClient from '~/classes/KnexClient';

// 1️⃣ Configure Knex
const kexInstance = KnexClient.create();

interface GenerateModelTextParams {
  datatypeInterfaces: string[];
  modelName: string;
  tsNodeTypes: string[];
  attributes: string[];
  table_name: string;
  table_schema: string;
}

const generateModelText = (params: GenerateModelTextParams): string => {
  const {datatypeInterfaces, modelName, tsNodeTypes, attributes, table_name, table_schema} = params;

  return `
import { Model, DataTypes, Sequelize, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
${datatypeInterfaces.length ? `\n` + datatypeInterfaces.map(x => `/** The ${x.replace(modelName, '').replace('Data', '')} data for the ${modelName} model. */\nexport interface ${x} {}`).join(`\n\n`) + `\n` : ''}
/**
 * The ${modelName} Sequelize model class.
 * Represents a "${table_schema}"."${table_name}" table in the system with various attributes and configurations.
 */
export class ${modelName} extends Model<InferAttributes<${modelName}>, InferCreationAttributes<${modelName}>> {
  declare readonly id: CreationOptional<number>;
${tsNodeTypes.join(`\n`)}
}

export function init${modelName}(sequelize: Sequelize) {
  ${modelName}.init(
    {
${attributes.join('\n')}
    },
    {
      sequelize,
      tableName: '${table_name}',
      timestamps: false, // adjust if you have timestamps
    }
  );
}
`.trim();
};

/**
 * Main generator function.
 */
async function generateModels() {
  let datatypeInterfaces: string[] = [];

// 2️⃣ Get all tables in public schema
  const tables = (await DatabaseUtils.getTables(kexInstance, ['table_schema'])).filter(x => x.table_name === 'users');

  // Ensure output directory exists
  const outDir = path.resolve(DIST_DIR, 'models-ts-definitons');
  createDir(outDir);

  // 3️⃣ Generate a model file per table
  for (const {table_name, table_schema} of tables) {
    const tsNodeTypes: string[] = [];
    const columns = await DatabaseUtils.getTableColumns(kexInstance, table_name, ['*']);

    const modelName = TableUtils.table2ModelName(table_name);
    const attributes: string[] = [];

    for (const col of columns) {
      //const comment = await kexInstance.table(col.table_name).columnInfo();
      const isJsonize = TypeUtils.isJsonize(col.data_type);
      const jsonizeInterface = Case.pascal(`${modelName}_${col.column_name}_data`);

      const tsType = pgSequelizeTypeMap[col.data_type] ?? 'DataTypes.STRING';
      const allowNull = col.is_nullable === 'YES';

      let defaultValueString: string = DatabaseUtils.escapeDefaultValue(col.column_default);

      const defaultValue = defaultValueString.trim()
        ? `      defaultValue: ${defaultValueString},\n`
        : '';

      attributes.push(
        `    ${Case.camel(col.column_name)}: {\n` +
        `      type: ${tsType},\n` +
        `      allowNull: ${allowNull},\n${defaultValue}` +
        `      field: '${col.column_name}',\n` +
        `    },`,
      );

      let tsValueType = getJsType(col.data_type) ?? 'string';

      if (isJsonize) {
        tsValueType = jsonizeInterface;
        datatypeInterfaces.push(jsonizeInterface);
      }

      if (col.column_name === 'id') continue;

      const creational = allowNull ? `CreationOptional<${tsValueType}>` : tsValueType;
      tsNodeTypes.push(`  declare ${Case.camel(col.column_name)}${allowNull ? '?' : ''}: ${creational};`);
    }

    const modelFile = generateModelText({
      datatypeInterfaces,
      modelName,
      tsNodeTypes,
      attributes,
      table_name,
      table_schema,
    });

    const filePath = path.join(outDir, `${modelName}`);
    fs.writeFileSync(filePath, modelFile, 'utf-8');
    console.log(`✅ Generated ${filePath}`);
    datatypeInterfaces = [];
  }

  // 4️⃣ Generate an index that imports and initializes all models
  const indexContent = `
import { Sequelize } from 'sequelize';
${tables
    .map(
      ({table_name}) =>
        `import { init${TableUtils.table2ModelName(table_name)} } from './${TableUtils.table2ModelName(table_name)}';`,
    )
    .join('\n')}

export function initAllModels(sequelize: Sequelize) {
${tables
    .map(
      ({table_name}) =>
        `  init${TableUtils.table2ModelName(table_name)}(sequelize);`,
    )
    .join('\n')}
}
`.trim();

  fs.writeFileSync(path.join(outDir, 'index'), indexContent, 'utf-8');
  console.log(`✅ Generated ${path.join(outDir, 'index')}`);
}

generateModels().catch((err) => {
  console.error('❌ Error generating models:', err);
}).finally(() => process.exit(1));
