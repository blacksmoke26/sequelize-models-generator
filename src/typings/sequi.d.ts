export interface Schema {
  id: string;
  name: string;
  forkedFrom?: string;
  createdAt: string;
  updatedAt: string;
  models: Model[];
}

export interface Field {
  id: string;
  name: string;
  type: {
    type: string
    length?: number
    defaultValue: any
    autoincrement?: boolean
    unsigned?: boolean
    precision: any
    values?: Array<string>
    arrayType?: {
      type: string
      values: Array<string>
      defaultValue: any
    }
    defaultEmptyArray?: boolean
    defaultNow?: boolean
  };
  primaryKey: boolean;
  required: boolean;
  unique: boolean;
}

export interface Association {
  id: string;
  sourceModelId: string;
  targetModelId: string;
  alias?: string;
  foreignKey?: string;
  type: {
    type: string
    targetFk?: string
    through?: {
      type: string
      modelId: string
    }
  };
}

export interface Model {
  id: string;
  name: string;
  softDelete: boolean;
  createdAt: string;
  updatedAt: string;
  fields: Array<Field>;
  associations: Array<Association>;
}
