import 'dotenv/config';

import kanel from 'kanel';
import {DIST_DIR, getConnectionString} from '~/constants/file-system';

async function run() {
  await kanel.processDatabase({
    connection: getConnectionString(),
    outputPath: `${DIST_DIR}/kanel`
  });

  console.log('--------------- END OF SCRIPT ----------------');
  process.exit();
}

run();
