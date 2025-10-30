/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @link https://github.com/blacksmoke26
 * @see https://chat.qwen.ai/c/3e101b1a-4366-4100-9979-a62d79a7c116
 *
 * This script generates a Sequelize schema representation from a database structure.
 * It connects to the database, extracts schema information, tables, columns, and relationships,
 * then converts them into a structured JSON format compatible with Sequelize UI.
 */

import 'dotenv/config';

import figlet from 'figlet';
import KnexClient from '../classes/KnexClient';
import TableColumns from '../classes/TableColumns';
import RandomHelper from '../helpers/RandomHelper';
import DateTimeHelper from '../helpers/DateTimeHelper';
import FileHelper from '../helpers/FileHelper';
import { association, field, type Field, model, type Schema } from '~/libs/sequelize-ui/schema/schema';
import { type Association, AssociationTypeType } from '~/libs/sequelize-ui/schema/association';
import resolvedDataTypeOptions from '~/libs/sequelize-ui/resolved-dataType-options';
import DbUtils, { Relationship, RelationshipType } from '~/classes/DbUtils';

/**
 * Converts a relationship type to an association type.
 * @param type - The relationship type to convert
 * @returns The corresponding association type
 */
const toAssociationType = (type: RelationshipType): AssociationTypeType => {
  switch (type) {
    case RelationshipType.HasOne:
      return AssociationTypeType.HasOne;
    case RelationshipType.HasMany:
      return AssociationTypeType.HasMany;
    case RelationshipType.BelongsTo:
      return AssociationTypeType.BelongsTo;
    case RelationshipType.ManyToMany:
      return AssociationTypeType.ManyToMany;
  }
};

/**
 * Adds relationship associations to the schema structure.
 * @param relations - Array of database relationships
 * @param structure - Array of schema structures to modify
 */
const addRelationShips = (relations: Relationship[], structure: Schema[]): void => {
  for (const relation of relations) {
    const sourceSchema = structure.find((s) => s.models.some((m) => m.name === relation.source.table));
    const targetSchema = structure.find((s) => s.models.some((m) => m.name === relation.target.table));

    if (!sourceSchema || !targetSchema) continue;

    const sourceModel = sourceSchema.models.find((m) => m.name === relation.source.table);
    const targetModel = targetSchema.models.find((m) => m.name === relation.target.table);

    if (!sourceModel || !targetModel) continue;

    const associationConfig = {
      sourceModelId: sourceModel.id,
      targetModelId: targetModel.id,
      foreignKey: relation.target.column,
      type: {
        type: toAssociationType(relation.type) as any,
        targetFk: relation.target.column,
      },
    };

    if (relation.type === RelationshipType.BelongsTo) {
      sourceModel.associations.push(
        association({
          ...associationConfig,
          alias: relation.target.table.toLowerCase(),
        }),
      );
    } else if (relation.type === RelationshipType.HasOne || relation.type === RelationshipType.HasMany) {
      targetModel.associations.push(
        association({
          ...associationConfig,
          sourceModelId: targetModel.id,
          targetModelId: sourceModel.id,
          foreignKey: relation.source.column,
          type: {
            type: toAssociationType(relation.type) as any,
            targetFk: relation.source.column,
          },
          alias: relation.source.table.toLowerCase() + (relation.type === RelationshipType.HasMany ? 's' : ''),
        }),
      );
    } else if (relation.type === RelationshipType.ManyToMany) {
      // Handle many-to-many relationships through junction table
      const junctionSchema = structure.find((s) => s.models.some((m) => m.name === relation.source.table));
      if (junctionSchema) {
        const junctionModel = junctionSchema.models.find((m) => m.name === relation.source.table);
        if (junctionModel) {
          junctionModel.associations.push(
            association({
              sourceModelId: junctionModel.id,
              targetModelId: sourceModel.id,
              foreignKey: relation.source.column,
              type: {
                type: AssociationTypeType.BelongsTo,
                targetFk: relation.source.column,
              },
              alias: relation.source.table.toLowerCase(),
            }),
          );
          junctionModel.associations.push(
            association({
              sourceModelId: junctionModel.id,
              targetModelId: targetModel.id,
              foreignKey: relation.target.column,
              type: {
                type: AssociationTypeType.BelongsTo,
                targetFk: relation.target.column,
              },
              alias: relation.target.table.toLowerCase(),
            }),
          );
        }
      }
    }
  }
};

/**
 * Main function to execute the schema generation process.
 * Connects to the database, extracts schema information, builds the structure,
 * and saves it to a JSON file.
 */
async function run() {
  console.log(await figlet.text('Sandbox', { font: 'Slant' }));
  console.log(`--------------- START OF SCRIPT --------------\n\n`);

  // 1️⃣ Configure Knex
  const knex = KnexClient.create();

  const structure: Schema[] = [];

  const tableIds: Record<string, string> = {};

  const schemas = await DbUtils.getSchemas(knex);
  const relations = await DbUtils.getRelationships(knex);

  for await (const schemaName of schemas) {
    const schema: Schema = {
      id: RandomHelper.randomString(21),
      forkedFrom: null,
      name: schemaName,
      createdAt: DateTimeHelper.getCurrentISODateTime(),
      updatedAt: DateTimeHelper.getCurrentISODateTime(),
      models: [],
    };

    const schemaTables = await DbUtils.getTables(knex, schemaName);

    for await (const tableName of schemaTables) {
      tableIds[tableName] = RandomHelper.randomString();
    }

    for await (const tableName of schemaTables) {
      const fields: Field[] = [];
      const associations: Association[] = [];

      const tableColumns = await TableColumns.list(knex, tableName, schemaName);

      for await (const tableColumn of tableColumns) {
        fields.push(
          field({
            name: tableColumn.name,
            type: resolvedDataTypeOptions(tableColumn),
            primaryKey: tableColumn.flags.primary,
            required: !tableColumn.flags.nullable,
            unique: false,
          }),
        );
      }

      schema.models.push(
        model({
          name: tableName,
          fields,
          associations,
        }),
      );
    }

    structure.push(schema);
  }

  addRelationShips(relations, structure);

  const jsonText = JSON.stringify(structure, null, 2);
  FileHelper.saveJsonToFile(FileHelper.rootPath('dist', 'schema.json'), jsonText);

  console.log(`\n\n--------------- END OF SCRIPT ----------------`);
  process.exit();
}

run();
