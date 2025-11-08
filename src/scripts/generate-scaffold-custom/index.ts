/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 *
 * @fileoverview This script generates TypeScript models, repositories, and associated files
 * based on database schema information. It connects to a database using Knex, fetches
 * schema details, and generates corresponding TypeScript files with proper types,
 * relationships, and configurations.
 */

import 'dotenv/config';

import figlet from 'figlet';

// classes
import KnexClient from '~/classes/KnexClient';

// helpers
import FileHelper from '~/helpers/FileHelper';

// clients
import PosquelizeGenerator from './PosquelizeGenerator';

/**
 * Main function to orchestrate the scaffold generation process.
 * Connects to the database, fetches schema information, and generates
 * models, repositories, and configuration files.
 */
async function run(): Promise<void> {
  // 1️⃣ Configure Knex
  const knex = KnexClient.create();

  console.log(await figlet.text('Posquelize Generator', { font: 'Slant' }));

  const generator = new PosquelizeGenerator(knex, FileHelper.rootPath(`dist/custom-scaffold`), {
    cleanRootDir: true,
  });
  await generator.generate();

  process.exit();
}

run();
