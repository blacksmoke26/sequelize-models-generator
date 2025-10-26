import {join, normalize} from 'node:path';
import fs from 'fs-extra';

/**
 * Normalizes and joins path segments to create the distribution directory path.
 * @type {string}
 * @description The absolute path to the distribution directory, resolved relative to the current file's location.
 */
export const DIST_DIR = normalize(
  join(__dirname, '..', '..', 'dist'),
);

/**
 * Generates a Postgres connection string using environment variables.
 * @returns {string} The formatted connection string.
 */
export const getConnectionString = (): string => {
  return `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`;
};

/**
 * Creates a directory and its parent directories if they do not exist.
 * @param path - The path of the directory to create.
 */
export const createDir = (path: string): void => {
  try {
    fs.mkdirSync(path, {recursive: true});
    fs.emptydirSync(path);
  } catch {
    // do nothing
  }
};
