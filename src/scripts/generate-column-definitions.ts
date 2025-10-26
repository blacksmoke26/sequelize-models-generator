import 'dotenv/config';

import {typescriptOfSchema} from 'pg-to-ts';
import * as fs from 'node:fs';
import {DIST_DIR, getConnectionString} from '~/constants/file-system';

async function run() {
  const result = await typescriptOfSchema(getConnectionString());

  fs.writeFileSync(DIST_DIR + '/types', result);

  console.log('--------------- END OF SCRIPT ----------------');
  process.exit();
}

run();
