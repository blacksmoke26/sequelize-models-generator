/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import { SequelizeType, TypesMap } from '~/constants/sequelize';

// utils
import ColumnInfoUtils from '~/classes/ColumnInfoUtils';

// types
import type { Knex } from 'knex';
import type { TableColumnInfo } from '~/typings/knex';
import { ExclusiveColumnInfo } from '~/classes/DbUtils';

/**
 * A utility class for parsing and converting PostgreSQL data types to Sequelize data types.
 */
export default abstract class SequelizeParser {
  /**
   * Parses parameters from a parameter type string.
   *
   * @param paramType - The parameter type string to parse (e.g., "10,2").
   * @returns An array of parsed parameters as strings.
   */
  public static parseTypeParams(paramType: string): string[] {
    const matches = paramType.match(/(\d+)(?:,(\d+))?/);
    if (!matches) {
      return [];
    }

    const [, ...params] = matches;
    return params;
  }

  /**
   * Formats a Sequelize data type with optional arguments.
   *
   * @param type - The Sequelize data type.
   * @param args - Optional arguments for the data type (e.g., length, precision).
   * @returns A tuple containing the base type and the formatted type string.
   */
  public static format(
    type: string,
    ...args: (string | number)[]
  ): [SequelizeType, string] {
    const formattedArgs = args.filter((x) => String(x || '').length);

    if (!formattedArgs.length) {
      return [type as SequelizeType, type];
    }

    return [type as SequelizeType, `${type}(${formattedArgs.join(',')})`];
  }

  /**
   * Parses user-defined PostgreSQL data types (ENUM, composite types, domain types) to Sequelize equivalents.
   * @param columnInfo - Information about the column being parsed.
   * @returns A tuple containing the Sequelize type and the formatted type string, or null if the type is not supported.
   */
  private static parseUserDefined(
    columnInfo: ExclusiveColumnInfo,
  ): [SequelizeType, string] | null {
    //region ENUMs: Supported natively by Sequelize.
    if (
      columnInfo.element.isEnum
    ) {
      return ['ENUM', `ENUM(${columnInfo?.element?.enumData.map((x) => `'${x}'`).join(',')})`];
    }
    //endregion

    //region Composite types: Struct-like types with multiple fields
    if (
      columnInfo.element.isComposite
    ) {
      // TODO: Implement logic here
    }
    //endregion

    //region Domain types: Custom types based on existing ones with constraints.
    if (
      columnInfo.element.isDomain
    ) {
      // TODO: Implement logic here
    }
    //endregion

    return null;
  }

  /**
   * Parses a PostgreSQL data type and converts it to a Sequelize data type.
   *
   * @returns A tuple containing the Sequelize type and the formatted type string.
   */
  public static parse(
    info: ExclusiveColumnInfo,
  ): [SequelizeType, string] {
    const type = info.element.dataType.toLowerCase();
    let sequelizeType: SequelizeType = TypesMap[type] as SequelizeType;
    const udtType: string = ColumnInfoUtils.toUdtType(info.info);

    if (type === 'user-defined') {
      return this.parseUserDefined(info);
    }

    if (type === 'array') {
      sequelizeType = 'ARRAY';
    }

    if (type.endsWith('range')) {
      sequelizeType = 'RANGE';
    }

    switch (sequelizeType) {
      case 'STRING':
        return this.format(sequelizeType, info.info.character_maximum_length);

      case 'DECIMAL':
        return this.format(
          sequelizeType,
          ...ColumnInfoUtils.toNumericPrecision(info.info),
        );

      case 'REAL':
        return this.format(sequelizeType);

      case 'BOOLEAN':
        return this.format(sequelizeType);

      case 'DATE':
        return this.format(sequelizeType);

      case 'DATEONLY':
        return this.format(sequelizeType);

      case 'TIME':
        return this.format(sequelizeType);

      case 'TINYINT':
        return this.format(sequelizeType);

      case 'SMALLINT':
        return this.format(sequelizeType);

      case 'MEDIUMINT':
        return this.format(sequelizeType);

      case 'INTEGER':
        return this.format(sequelizeType, info.info.numeric_precision);

      case 'BIGINT':
        return this.format(sequelizeType);

      case 'FLOAT':
        return this.format(sequelizeType);

      case 'DOUBLE':
        return this.format(sequelizeType, info.info.numeric_precision);

      case 'BLOB':
        return this.format(sequelizeType, info.info.character_maximum_length);

      case 'TEXT':
        return this.format(sequelizeType, info.info.character_maximum_length);

      case 'JSON':
        return this.format(sequelizeType);

      case 'JSONB':
        return this.format(sequelizeType);

      case 'CIDR':
        return this.format(sequelizeType);

      case 'INET':
        return this.format(sequelizeType);

      case 'MACADDR':
        return this.format(sequelizeType);

      case 'CHAR':
        return this.format(sequelizeType, info.info.character_maximum_length);

      case 'UUID':
      case 'UUIDV1':
      case 'UUIDV4':
        return this.format(sequelizeType);

      case 'ARRAY': {
        return this.format(sequelizeType, TypesMap[udtType] ?? 'STRING');
      }

      case 'RANGE': {
        const rangeType = sequelizeType
          .replace(/multirange|range$/i, '')
          .toLowerCase();
        return this.format(sequelizeType, TypesMap[rangeType] ?? 'STRING');
      }

      /*case 'ABSTRACT':
        break;
      case 'NUMBER':
        break;
      case 'HSTORE':
        break;
      case 'NOW':
        break;
      case 'VIRTUAL':
        break;
      case 'ENUM':
        break;
      case 'GEOMETRY':
        break;
      case 'GEOGRAPHY':
        break;
      case 'CITEXT':
        break;
      case 'TSVECTOR':
        break;*/

      default:
        return this.format(sequelizeType);
    }
  }
}
