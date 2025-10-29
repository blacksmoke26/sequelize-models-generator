/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import 'dotenv/config';

import { typescriptOfSchema } from 'pg-to-ts';
import * as fs from 'node:fs';

// utils
import { DIST_DIR } from '~/constants/file-system';

// helpers
import EnvHelper from '~/helpers/EnvHelper';

async function run() {
  const result = await typescriptOfSchema(EnvHelper.getConnectionString());

  fs.writeFileSync(DIST_DIR + '/types', result);

  console.log('--------------- END OF SCRIPT ----------------');
  process.exit();
}

run();
