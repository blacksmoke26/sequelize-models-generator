/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import nunjucks, { ConfigureOptions } from 'nunjucks';

// helpers
import FileHelper from './FileHelper';

/**
 * NunjucksHelper is an abstract base class for creating custom Nunjucks template helpers.
 *
 * This class provides static methods to render Nunjucks templates with given context and options.
 * It abstracts the file reading and template rendering process, making it easier to work with
 * Nunjucks templates in a consistent manner across the application.
 */
export default abstract class NunjucksHelper {
  /**
   * Renders a Nunjucks template with the given context and options.
   *
   * @param name - The name of the template file to render (relative to the templates directory)
   * @param [context] - An object containing the variables to be passed to the template
   * @param [options] - Optional Nunjucks configuration options (defaults to autoescape: true)
   * @returns The rendered template as a string
   *
   * @example
   * ```typescript
   * const rendered = NunjucksHelper.renderTemplate('welcome.njk', { name: 'John' });
   * console.log(rendered); // Output: Welcome John!
   * ```
   *
   * @throws {Error} If the template file cannot be found or read
   */
  public static renderTemplate(name: string, context: Record<string, any> = {}, options: ConfigureOptions = {}): string {
    return this.renderFile(`${__dirname}/../templates/${name}`, context, options);
  }

  /**
   * Renders a Nunjucks template file with the given context and options.
   *
   * @param filename - Absolute path to the template file to render
   * @param [context] - An object containing the variables to be passed to the template
   * @param [options] - Optional Nunjucks configuration options (defaults to autoescape: true)
   * @returns The rendered template as a string
   *
   * @example
   * ```typescript
   * const rendered = NunjucksHelper.renderTemplate(__dirname + '/welcome.njk', { name: 'John' });
   * console.log(rendered); // Output: Welcome John!
   * ```
   *
   * @throws {Error} If the template file cannot be found or read
   */
  public static renderFile(filename: string, context: Record<string, any> = {}, options: ConfigureOptions = {}): string {
    const text = FileHelper.readFile(filename);
    return this.renderString(text, context, options);
  }

  /**
   * Renders a Nunjucks template string with the given context and options.
   *
   * @param template - The template string to render
   * @param [context] - An object containing the variables to be passed to the template
   * @param [options] - Optional Nunjucks configuration options (defaults to autoescape: true)
   * @returns The rendered template as a string
   *
   * @example
   * ```typescript
   * const rendered = NunjucksHelper.renderString('Hello {{ name }}!', { name: 'John' });
   * console.log(rendered); // Output: Hello John!
   * ```
   */
  public static renderString(template: string, context: Record<string, any> = {}, options: ConfigureOptions = {}): string {
    nunjucks.configure({ autoescape: true, ...options });
    return nunjucks.renderString(template, context);
  }
}
