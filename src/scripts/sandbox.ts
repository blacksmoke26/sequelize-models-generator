/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import 'dotenv/config';

import figlet from 'figlet';

// classes
import KnexClient from '../classes/KnexClient';
import TableColumns from '~/classes/TableColumns';

async function run() {
  console.log(await figlet.text('Sandbox', { font: 'Slant' }));
  console.log(`--------------- START OF SCRIPT --------------\n\n`);

  // 1️⃣ Configure Knex
  const knex = KnexClient.create();

  //const result = await TableColumns.list(knex, 'users');

  //console.log(await DbUtils.getTableElementTypes(knex, 'products'));
  console.log(await TableColumns.list(knex, 'products'));
  //console.log('isCompositeTypeColumn:', await DbUtils.getCompositeTypeData(knex, 'products', 'address_composite'));
  //console.log(await DbUtils.getSchemas(knex));
  //console.log(await DbUtils.getTableIndexes(knex, 'products'));
  //console.log(await DbUtils.getTableConstraints(knex, 'products'));
  //console.log(result);

  console.log(`\n\n--------------- END OF SCRIPT ----------------`);
  process.exit();
}

run();
