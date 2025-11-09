/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import * as fs from 'node:fs';
import path, {dirname} from 'node:path';

import { importer } from '@dbml/core';
import { connector } from '@dbml/connector';

// helpers
import FileHelper from '~/helpers/FileHelper';

// utils
import TemplateWriter from './TemplateWriter';

/**
 * Exports a database schema to a DBML (Database Markup Language) diagram file.
 */
export default abstract class DbmlDiagramExporter {
  /**
   * Exports a database schema to a DBML (Database Markup Language) diagram file.
   *
   * @param connectionString - The database connection string for PostgreSQL
   * @param outputFile - The path where the generated DBML file will be saved
   * @throws {Error} When schema fetching, DBML generation, or file saving fails
   * @returns {Promise<void>} A promise that resolves when the export is complete
   * @example
   * ```typescript
   * import DbmlDiagramExporter from './DbmlDiagramExporter';
   *
   * // Export PostgreSQL schema to DBML file
   * await DbmlDiagramExporter.export(
   *   'postgresql://user:password@localhost:5432/mydb',
   *   './output/schema.dbml'
   * );
   * ```
   */
  public static async export(connectionString: string, outputFile: string): Promise<void> {
    try {
      // Fetch database schema with explicit type assertion
      const schemaJson = await connector.fetchSchemaJson(connectionString, 'postgres');

      // Validate schema structure before processing
      if (!schemaJson || typeof schemaJson !== 'object') {
        throw new Error('Failed to generate valid DBML output: Expected string but got ' + typeof schemaJson);
      }

      // Generate DBML from the schema
      const output = importer.generateDbml(schemaJson);

      // Ensure output is a string before saving
      if (typeof output !== 'string') {
        throw new Error('Failed to generate valid DBML output: Expected string but got ' + typeof output);
      }

      // Save the generated DBML to file
      // Ensure output directory exists
      const outputDir = dirname(outputFile);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      FileHelper.saveTextToFile(outputFile, output);

      // Generate README content for the diagram
      TemplateWriter.renderOut('dbml-readme', `${path.dirname(outputFile)}/README.md`, {filename: path.basename(outputFile)})

      console.log(`Successfully exported DBML diagram to ${outputFile}`);
    } catch (error: any) {
      // Log detailed error information
      console.error('Error exporting DBML diagram:', {
        message: error.message,
        stack: error.stack,
        additionalContext: {
          connectionString: connectionString,
          outputFile: outputFile,
          errorType: error.name,
        },
      });
    }
  }
}
