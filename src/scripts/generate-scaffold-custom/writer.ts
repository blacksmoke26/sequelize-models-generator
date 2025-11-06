/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

// helpers
import FileHelper from '~/helpers/FileHelper';
import NunjucksHelper from '~/helpers/NunjucksHelper';
import EnvHelper from '~/helpers/EnvHelper';
import exportDbmlDiagram from '~/scripts/generate-scaffold-custom/dbml';

/**
 * Renders a Nunjucks template and saves the output to a file.
 *
 * @param template - The name of the template file (without extension).
 * @param outFile - The path where the rendered output will be saved.
 * @param context - Optional context object containing variables for template rendering.
 */
export const renderOut = (template: string, outFile: string, context: Record<string, any> = {}): void => {
  const templateFile: string = FileHelper.join(__dirname, 'templates', `${template}.njk`);
  const text = NunjucksHelper.renderFile(templateFile, context, {
    autoescape: false,
  });
  FileHelper.saveTextToFile(outFile, text);
};

/**
 * Writes database diagrams in DBML format and generates a README file.
 * Connects to the database using the connection string from environment variables,
 * exports the schema as a DBML file, and creates a README with documentation.
 *
 * @param {string} outputDir - The directory path where the diagram files will be written.
 * @returns {Promise<void>}
 */
export const writeDiagrams = async (outputDir: string): Promise<void> => {
  // Get database connection string from environment
  const connectionString: string = EnvHelper.getConnectionString();
  // Export database schema to DBML format
  await exportDbmlDiagram(connectionString, FileHelper.join(outputDir, 'database.dbml'));
};

/**
 * Writes base files required for the scaffold generation.
 * @param {string} baseDir - The base directory path where the repositories folder is located.
 * This includes ModelBase, RepositoryBase, configuration, and instance files.
 */
export const writeBaseFiles = (baseDir: string): void => {
  // Generate ModelBase.ts from template
  const fileName = FileHelper.join(baseDir, 'base/ModelBase.ts');
  renderOut('model-base', fileName);
  console.log('Generated ModelBase:', fileName);

  // Generate RepositoryBase.ts from template
  const rbFileName = FileHelper.join(baseDir, 'base/RepositoryBase.ts');
  renderOut('repo-base', rbFileName);
  console.log('Generated RepositoryBase:', rbFileName);

  // Generate configuration.ts from template
  const cfgFileName = FileHelper.join(baseDir, 'configuration.ts');
  renderOut('config-template', cfgFileName);
  console.log('Generated configuration file:', cfgFileName);

  // Generate instance.ts from template
  const insFileName = FileHelper.join(baseDir, 'instance.ts');
  renderOut('instance-template', insFileName);
  console.log('Generated instance file:', insFileName);
};

/**
 * Generates and writes a repository file for the given model name.
 ** This function generates a repository file for the given model name using a template.
 * It renders the repository template with the provided model name and saves it to the
 * repositories directory.
 *
 * @param {string} baseDir - The base directory path where the repositories folder is located.
 * @param {string} modelName - The name of the model to generate the repository for.
 */
export const writeRepoFile = (baseDir: string, modelName: string): void => {
  const fileName = FileHelper.join(baseDir, 'repositories', `${modelName}Repository.ts`);
  renderOut('repo-template', fileName, {modelName});
  console.log('Repository generated:', fileName);
};
