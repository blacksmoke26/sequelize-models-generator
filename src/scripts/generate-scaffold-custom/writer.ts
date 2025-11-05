/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

// helpers
import FileHelper from '~/helpers/FileHelper';
import NunjucksHelper from '~/helpers/NunjucksHelper';

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
