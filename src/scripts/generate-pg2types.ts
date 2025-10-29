/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import 'dotenv/config';

import { Client, types } from 'pg';
import { builtins } from 'pg-types';

// helpers
import EnvHelper from '~/helpers/EnvHelper';

async function run() {
  types.setTypeParser(20, function (val) {
    return parseInt(val, 10);
  });

  const client = new Client({
    connectionString: EnvHelper.getConnectionString(),
  });

  await client.connect();

  const result = await client.query('SELECT * FROM users LIMIT 1');

  result.fields.forEach((field) => {
    console.log(field.name, field.dataTypeID, field.dataTypeID in builtins ? 'builtin' : 'custom');
  });

  await client.end();

  console.log('--------------- END OF SCRIPT ----------------');
  process.exit();
}

run();
