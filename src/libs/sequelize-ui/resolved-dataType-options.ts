/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import {
  arrayDataType,
  bigIntDataType,
  blobDataType,
  booleanDataType,
  ciTextDataType,
  DataType,
  DataTypeType,
  dateDataType,
  dateTimeDataType,
  decimalDataType,
  doubleDataType,
  enumDataType,
  floatDataType,
  integerDataType,
  jsonBDataType,
  jsonDataType,
  realDataType,
  smallIntDataType,
  stringDataType,
  textDataType,
  timeDataType,
  uuidDataType,
  UuidType,
} from '~/libs/sequelize-ui/schema';
import { toTypeFromPostgresType } from '~/constants/sequelize-ui';

// types
import type { ColumnInfo } from '~/classes/TableColumns';

const resolvedDataTypeOptions = (columnInfo: ColumnInfo): DataType => {
  const uiType = toTypeFromPostgresType(columnInfo.type);

  switch (uiType) {
    case DataTypeType.Text:
      return textDataType({ defaultValue: columnInfo.defaultValue as string});

    case DataTypeType.CiText:
      return ciTextDataType({});

    case DataTypeType.Integer:
      return integerDataType({
        defaultValue: +columnInfo.defaultValue,
        autoincrement: columnInfo.flags.autoIncrement,
      });

    case DataTypeType.BigInt:
      return bigIntDataType({
        defaultValue: +columnInfo.defaultValue,
        autoincrement: columnInfo.flags.autoIncrement,
      });

    case DataTypeType.SmallInt:
      return smallIntDataType({
        defaultValue: +columnInfo.defaultValue,
        autoincrement: columnInfo.flags.autoIncrement,
      });

    case DataTypeType.Float:
      return floatDataType({
        defaultValue: +columnInfo.defaultValue,
      });

    case DataTypeType.Real:
      return realDataType({ defaultValue: +columnInfo.defaultValue });

    case DataTypeType.Double:
      return doubleDataType({
        defaultValue: +columnInfo.defaultValue,
      });

    case DataTypeType.Decimal:
      return decimalDataType({
        defaultValue: +columnInfo.defaultValue,
        //precision: {
          //precision: columnInfo.numericPrecision,
          //scale: columnInfo.numericScale,
        //},
      });

    case DataTypeType.DateTime:
      return dateTimeDataType({defaultNow: columnInfo.flags.defaultNow});

    case DataTypeType.Date:
      return dateDataType({defaultNow: columnInfo.flags.defaultNow});

    case DataTypeType.Time:
      return timeDataType({defaultNow: columnInfo.flags.defaultNow});

    case DataTypeType.Boolean:
      return booleanDataType({
        defaultValue: columnInfo.defaultValue === 'true',
      });

    case DataTypeType.Enum:
      return enumDataType({ values: [] });

    case DataTypeType.Array:
      return arrayDataType({});

    case DataTypeType.Json:
      return jsonDataType({ defaultValue: JSON.parse(columnInfo.defaultValue as string) });

    case DataTypeType.JsonB:
      return jsonBDataType({ defaultValue: JSON.parse(columnInfo.defaultValue as string) });

    case DataTypeType.Blob:
      return blobDataType();

    case DataTypeType.Uuid:
      return uuidDataType({ defaultVersion: UuidType.V4 });

    case DataTypeType.String:
    default:
      return stringDataType({
        //length: columnInfo.maxLength,
        defaultValue: columnInfo.defaultValue as string,
      });
  }
};

export default resolvedDataTypeOptions;
