/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import 'dotenv/config';

import figlet from 'figlet';
import KnexClient from '../classes/KnexClient';
import TableColumns from '../classes/TableColumns';
import DatabaseUtils from '../classes/DatabaseUtils';
import RandomHelper from '../helpers/RandomHelper';
import DateTimeHelper from '../helpers/DateTimeHelper';
import FileHelper from '../helpers/FileHelper';
import {
  type Field,
  field,
  model,
  type Schema,
} from '~/libs/sequelize-ui/schema/schema';
import { type Association } from '~/libs/sequelize-ui/schema/association';
import resolvedDataTypeOptions from '~/libs/sequelize-ui/resolved-dataType-options';

async function run() {
  console.log(await figlet.text('Sandbox', { font: 'Slant' }));
  console.log(`--------------- START OF SCRIPT --------------\n\n`);

  // 1️⃣ Configure Knex
  const knex = KnexClient.create();

  const tableIds: Record<string, string> = {};

  const schema: Schema = {
    id: RandomHelper.randomString(21),
    forkedFrom: null,
    name: 'public',
    createdAt: DateTimeHelper.getCurrentISODateTime(),
    updatedAt: DateTimeHelper.getCurrentISODateTime(),
    models: [],
  };

  const dbSchemas = await DatabaseUtils.getSchemas(knex);
  const schemaTables = (
    await DatabaseUtils.getTables(knex, [], dbSchemas[0])
  ).map((x) => x.table_name);

  for (const schemaTable of schemaTables) {
    tableIds[schemaTable] = RandomHelper.randomString();

    const fields: Field[] = [];
    const associations: Association[] = [];

    const tableColumns = await TableColumns.list(knex, schemaTable);

    for (const tableColumn of tableColumns) {
      if (tableColumn.name === 'id') continue;

      fields.push(
        field({
          name: tableColumn.name,
          type: resolvedDataTypeOptions(tableColumn),
          primaryKey: tableColumn.flags.primary,
          required: !tableColumn.flags.nullable,
          unique: false,
        }),
      );
    }

    schema.models.push(
      model({
        name: schemaTable,
        fields,
        associations,
      }),
    );
  }

  const jsonText = JSON.stringify(schema, null, 2);
  FileHelper.saveJsonToFile(
    FileHelper.rootPath('dist', 'schema.json'),
    jsonText,
  );

  //const result = await TableColumns.list(kexInstance, 'contact_labels');

  //console.log(result);

  console.log(`\n\n--------------- END OF SCRIPT ----------------`);
  process.exit();
}

run();
