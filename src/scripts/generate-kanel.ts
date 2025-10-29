/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import 'dotenv/config';

import kanel from 'kanel';

// utils
import {DIST_DIR} from '~/constants/file-system';

// helpers
import EnvHelper from '~/helpers/EnvHelper';

async function run() {
  await kanel.processDatabase({
    connection: EnvHelper.getConnectionString(),
    outputPath: `${DIST_DIR}/kanel`
  });

  console.log('--------------- END OF SCRIPT ----------------');
  process.exit();
}

run();
