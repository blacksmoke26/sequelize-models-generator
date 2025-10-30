/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import 'dotenv/config';

import figlet from 'figlet';
import fsx from 'fs-extra';
import { generate } from 'pg-generator';
import FileHelper from '~/helpers/FileHelper';
import EnvHelper from '~/helpers/EnvHelper';

async function run() {
  console.log(await figlet.text('PG Generator', { font: 'Slant' }));
  console.log(`--------------- START OF SCRIPT --------------\n\n`);

  const OUT_DIR = FileHelper.rootPath('dist/pg-models');
  fsx.emptydirSync(OUT_DIR);

  const dbConfig = EnvHelper.getDbConfig();

  await generate('example', {
    outDir: OUT_DIR,
    password: dbConfig.password,
    host: dbConfig.host,
    user: dbConfig.username,
    database: dbConfig.name,
  });

  console.log(`\n\n--------------- END OF SCRIPT ----------------`);
  process.exit();
}

run();
