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
  DefaultJsonValue,
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
import SequelizeParser from '~/parsers/SequelizeParser';

const resolvedDataTypeOptions = (columnInfo: ColumnInfo): DataType => {
  const [precision = null, scale = null] = SequelizeParser.parseTypeParams(columnInfo.sequelizeTypeParams);
  const defaultValue: unknown | null = !columnInfo?.defaultValue || columnInfo?.defaultValue === '' ? null : columnInfo?.defaultValue;
  const defaultValueIsNull: boolean = defaultValue === null;

  const uiType = toTypeFromPostgresType(columnInfo.type);

  switch (uiType) {
    case DataTypeType.Text:
      return textDataType({ defaultValue: columnInfo.defaultValue as string });

    case DataTypeType.CiText:
      return ciTextDataType({});

    case DataTypeType.Integer:
      return integerDataType({
        defaultValue: !defaultValueIsNull ? Number(defaultValue) : null,
        autoincrement: columnInfo.flags.autoIncrement,
      });

    case DataTypeType.BigInt: {
      return bigIntDataType({
        defaultValue: !defaultValueIsNull ? Number(defaultValue) : null,
        autoincrement: columnInfo.flags.autoIncrement,
      });
    }

    case DataTypeType.SmallInt:
      return smallIntDataType({
        defaultValue: !defaultValueIsNull ? Number(defaultValue) : null,
        autoincrement: columnInfo.flags.autoIncrement,
      });

    case DataTypeType.Float:
      return floatDataType({
        defaultValue: !defaultValueIsNull ? Number(defaultValue) : null,
      });

    case DataTypeType.Real:
      return realDataType({ defaultValue: !defaultValueIsNull ? Number(defaultValue) : null });

    case DataTypeType.Double:
      return doubleDataType({
        defaultValue: !defaultValueIsNull ? Number(defaultValue) : null,
      });

    case DataTypeType.Decimal: {
      const data = decimalDataType({
        defaultValue: !defaultValueIsNull ? Number(defaultValue) : null,
        precision: {precision: 0, scale: null}
      });

      if (precision) data.precision.precision = +precision;
      if (scale) data.precision.scale = +scale;

      return data;
    }
    case DataTypeType.DateTime:
      return dateTimeDataType({ defaultNow: columnInfo?.flags?.defaultNow ?? false });

    case DataTypeType.Date:
      return dateDataType({ defaultNow: columnInfo?.flags?.defaultNow ?? false });

    case DataTypeType.Time:
      return timeDataType({ defaultNow: columnInfo?.flags?.defaultNow ?? false });

    case DataTypeType.Boolean:
      return booleanDataType({
        defaultValue: null,
      });

    case DataTypeType.Enum:
      return enumDataType({ values: [] });

    case DataTypeType.Array:
      return arrayDataType({});

    case DataTypeType.Json: {
      const data = jsonDataType({ defaultValue: null });

      if (String(defaultValue).startsWith('{')) {
        data.defaultValue = DefaultJsonValue.EmptyObject;
      } else if (String(defaultValue).startsWith('[')) {
        data.defaultValue = DefaultJsonValue.EmptyArray;
      }

      return data;
    }

    case DataTypeType.JsonB: {
      const data = jsonBDataType({ defaultValue: null });

      if (String(defaultValue).startsWith('{')) {
        data.defaultValue = DefaultJsonValue.EmptyObject;
      } else if (String(defaultValue).startsWith('[')) {
        data.defaultValue = DefaultJsonValue.EmptyArray;
      }

      return data;
    }

    case DataTypeType.Blob:
      return blobDataType();

    case DataTypeType.Uuid:
      return uuidDataType({ defaultVersion: UuidType.V4 });

    case DataTypeType.String:
    default: {
      const data = stringDataType({ defaultValue: null });
      if (precision) data.length = +precision;

      if (!defaultValueIsNull) {
        data.defaultValue = String(defaultValue).replaceAll(`'`, '');
      }

      return data;
    }
  }
};

export default resolvedDataTypeOptions;
