/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import { singular } from 'pluralize';
import { camelCase, noCase, pascalCase } from 'change-case';

/**
 * Utility class for string transformations commonly used in database naming conventions.
 */
export default abstract class StringHelper {
  /**
   * Converts a string to lowercase with spaces between words.
   *
   * @param name - The string to normalize
   * @returns The normalized string
   *
   * @example
   * ```typescript
   * StringHelper.normalize('UserName') // returns 'user name'
   * StringHelper.normalize('table_name') // returns 'table name'
   * ```
   */
  public static normalize(name: string): string {
    return noCase(name);
  }

  /**
   * Compares two strings after normalizing and converting to singular form.
   *
   * @param a - First string to compare
   * @param b - Second string to compare
   * @returns True if the normalized singular forms are equal
   *
   * @example
   * ```typescript
   * StringHelper.namesEqSingular('Users', 'user') // returns true
   * StringHelper.namesEqSingular('Posts', 'Article') // returns false
   * StringHelper.namesEqSingular(null, null) // returns true
   * StringHelper.namesEqSingular('Users', null) // returns false
   * ```
   */
  public static namesEqSingular(a?: string | null, b?: string): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return this.normalizeSingular(a) === this.normalizeSingular(b);
  }

  /**
   * Normalizes a string and converts it to its singular form.
   *
   * @param name - The string to normalize and singularize
   * @returns The normalized singular string
   *
   * @example
   * ```typescript
   * StringHelper.normalizeSingular('Users') // returns 'user'
   * StringHelper.normalizeSingular('BlogPosts') // returns 'blog post'
   * ```
   */
  public static normalizeSingular(name: string): string {
    return singular(noCase(name));
  }

  /**
   * Converts a table name to a model name in PascalCase.
   *
   * @param table - The table name to convert
   * @returns The model name in PascalCase
   *
   * @example
   * ```typescript
   * StringHelper.tableToModel('users') // returns 'User'
   * StringHelper.tableToModel('blog_posts') // returns 'BlogPost'
   * StringHelper.tableToModel('user_profiles') // returns 'UserProfile'
   * ```
   */
  public static tableToModel(table: string): string {
    return pascalCase(singular(table));
  }

  /**
   * Converts a column name to a property name in camelCase.
   *
   * @param column - The column name to convert
   * @returns The property name in camelCase
   *
   * @example
   * ```typescript
   * StringHelper.toPropertyName('first_name') // returns 'firstName'
   * StringHelper.toPropertyName('user_id') // returns 'userId'
   * StringHelper.toPropertyName('created_at') // returns 'createdAt'
   * ```
   */
  public static toPropertyName(column: string): string {
    return camelCase(column);
  }

  /**
   * Generates a belongsTo relationship name.
   *
   * @param targetTable - The table being referenced
   * @param sourceTable - The table containing the reference
   * @returns The relationship name
   *
   * @example
   * ```typescript
   * StringHelper.relationBelongsTo('users', 'posts') // returns 'userPost'
   * StringHelper.relationBelongsTo('categories', 'articles') // returns 'categoryArticle'
   * ```
   */
  public static relationBelongsTo(targetTable: string, sourceTable: string) {
    return singular(this.toPropertyName(targetTable)) + this.tableToModel(sourceTable);
  }

  /**
   * Generates a hasOne relationship name.
   *
   * @param sourceTable - The table that has the relationship
   * @returns The relationship name
   *
   * @example
   * ```typescript
   * StringHelper.relationHasOne('users') // returns 'user'
   * StringHelper.relationHasOne('profiles') // returns 'profile'
   * ```
   */
  public static relationHasOne(sourceTable: string) {
    return this.toPropertyName(singular(sourceTable));
  }

  /**
   * Generates a hasMany relationship name.
   *
   * @param targetTable - The table being referenced
   * @param sourceTable - The table containing the reference
   * @returns The relationship name
   *
   * @example
   * ```typescript
   * StringHelper.relationHasMany('posts', 'users') // returns 'postUser'
   * StringHelper.relationHasMany('comments', 'articles') // returns 'commentArticle'
   * ```
   */
  public static relationHasMany(targetTable: string, sourceTable: string) {
    return singular(this.toPropertyName(targetTable)) + pascalCase(sourceTable);
  }
}
