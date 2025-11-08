/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import { pascal } from 'case';
import pluralize, { singular } from 'pluralize';
import { camelCase, pascalCase } from 'change-case';

// helpers
import StringHelper from '~/helpers/StringHelper';

// utils
import { sp } from './utils';
import { RelationshipType } from '~/classes/DbUtils';

// types
import type { Relationship } from '~/typings/utils';
import type { InitTemplateVars, ModelTemplateVars } from './utils';

/**
 * Creates an alias name for a relationship based on its type and related tables/columns
 * @param type - The type of relationship
 * @param source - Source table information
 * @param target - Target table information
 * @param junction - Junction table information (for many-to-many relationships)
 * @returns The generated alias name
 */
const createAlias = (type: RelationshipType, source: Relationship['source'], target: Relationship['target'], junction?: Relationship['junction']): string => {
  switch (type) {
    case RelationshipType.HasMany:
      return singular(StringHelper.toPropertyName(source.table)) + pluralize(StringHelper.omitId(source.column, true));
    case RelationshipType.BelongsTo:
      return singular(StringHelper.toPropertyName(target.table)) + StringHelper.omitId(target.column, true);
    case RelationshipType.HasOne:
      return singular(StringHelper.toPropertyName(source.table)) + StringHelper.omitId(source.column, true);
    case RelationshipType.ManyToMany:
      return camelCase(pascalCase(singular(junction.table))) + pluralize(StringHelper.omitId(source.table, true)) + 'es';
    default:
      return '';
  }
};

/**
 * Generates TypeScript declarations for HasMany relationship mixins
 * @param alias - The alias name for the relationship
 * @param sourceModel - The source model name
 * @param targetModel - The target model name
 * @returns String containing the mixin declarations
 */
const generateHasManyMixins = (alias: string, sourceModel: string, targetModel: string): string => {
  let mixins = '\n';
  mixins += sp(2, `// %s hasMany %s (as %s)\n`, sourceModel, targetModel, alias);
  mixins += sp(2, `declare %s?: Sequelize.NonAttribute<%s>;\n`, alias, targetModel);
  mixins += sp(2, `declare get%s: Sequelize.HasManyGetAssociationsMixin<%s>;\n`, pascalCase(alias), targetModel);
  mixins += sp(2, `declare set%s: Sequelize.HasManySetAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
  mixins += sp(2, `declare add%s: Sequelize.HasManyAddAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
  mixins += sp(2, `declare add%ses: Sequelize.HasManyAddAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
  mixins += sp(2, `declare create%s: Sequelize.HasManyCreateAssociationMixin<%s>;\n`, pascalCase(alias), targetModel);
  mixins += sp(2, `declare remove%s: Sequelize.HasManyRemoveAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
  mixins += sp(2, `declare remove%ses: Sequelize.HasManyRemoveAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
  mixins += sp(2, `declare has%s: Sequelize.HasManyHasAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
  mixins += sp(2, `declare has%ses: Sequelize.HasManyHasAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
  mixins += sp(2, `declare count%s: Sequelize.HasManyCountAssociationsMixin;\n`, pascalCase(alias));
  return mixins;
};

/**
 * Generates TypeScript declarations for BelongsTo relationship mixins
 * @param alias - The alias name for the relationship
 * @param sourceModel - The source model name
 * @param targetModel - The target model name
 * @returns String containing the mixin declarations
 */
const generateBelongsToMixins = (alias: string, sourceModel: string, targetModel: string): string => {
  let mixins = '\n';
  mixins += sp(2, `// %s belongsTo %s (as %s)\n`, sourceModel, targetModel, alias);
  mixins += sp(2, `declare %s?: Sequelize.NonAttribute<%s>;\n`, alias, targetModel);
  mixins += sp(2, `declare get%s: Sequelize.BelongsToGetAssociationMixin<%s>;\n`, pascalCase(alias), targetModel);
  mixins += sp(2, `declare set%s: Sequelize.BelongsToSetAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
  mixins += sp(2, `declare create%s: Sequelize.BelongsToCreateAssociationMixin<%s>;\n`, pascalCase(alias), targetModel);
  return mixins;
};

/**
 * Generates TypeScript declarations for HasOne relationship mixins
 * @param alias - The alias name for the relationship
 * @param sourceModel - The source model name
 * @param targetModel - The target model name
 * @returns String containing the mixin declarations
 */
const generateHasOneMixins = (alias: string, sourceModel: string, targetModel: string): string => {
  let mixins = '\n';
  mixins += sp(2, `// %s hasOne %s (as %s)\n`, sourceModel, targetModel, alias);
  mixins += sp(2, `declare %s?: Sequelize.NonAttribute<%s>;\n`, alias, targetModel);
  mixins += sp(2, `declare get%s: Sequelize.HasOneGetAssociationMixin<%s>;\n`, pascalCase(alias), targetModel);
  mixins += sp(2, `declare set%s: Sequelize.HasOneSetAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
  mixins += sp(2, `declare create%s: Sequelize.HasOneCreateAssociationMixin<%s>;`, pascalCase(alias), targetModel);
  return mixins;
};

/**
 * Generates TypeScript declarations for BelongsToMany relationship mixins
 * @param alias - The alias name for the relationship
 * @param sourceModel - The source model name
 * @param targetModel - The target model name
 * @returns String containing the mixin declarations
 */
const generateBelongsToManyMixins = (alias: string, sourceModel: string, targetModel: string): string => {
  let mixins = '\n';
  mixins += sp(2, `// %s belongsToMany %s (as %s)\n`, sourceModel, targetModel, alias);
  mixins += sp(2, `declare %s?: Sequelize.NonAttribute<%s[]>;\n`, alias, targetModel);
  mixins += sp(2, `declare get%s: Sequelize.BelongsToManyGetAssociationsMixin<%s>;\n`, pascalCase(alias), targetModel);
  mixins += sp(2, `declare set%s: Sequelize.BelongsToManySetAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
  mixins += sp(2, `declare add%s: Sequelize.BelongsToManyAddAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
  mixins += sp(2, `declare add%ses: Sequelize.BelongsToManyAddAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
  mixins += sp(2, `declare create%s: Sequelize.BelongsToManyCreateAssociationMixin<%s>;\n`, pascalCase(alias), targetModel);
  mixins += sp(2, `declare remove%s: Sequelize.BelongsToManyRemoveAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
  mixins += sp(2, `declare remove%ses: Sequelize.BelongsToManyRemoveAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
  mixins += sp(2, `declare has%s: Sequelize.BelongsToManyHasAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
  mixins += sp(2, `declare has%ses: Sequelize.BelongsToManyHasAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
  mixins += sp(2, `declare count%s: Sequelize.BelongsToManyCountAssociationsMixin;\n`, pascalCase(alias));
  return mixins;
};

/**
 * Processes a single relationship to generate its mixin declarations and association declarations
 * @param relation - The relationship configuration
 * @param alreadyAdded - Array of already processed aliases to avoid duplicates
 * @returns Object containing the generated mixins and declarations
 */
const processAssociation = (relation: Relationship, alreadyAdded: string[]): { mixins: string; declaration: string } => {
  const { type, source, target, junction } = relation;
  const sourceModel = StringHelper.tableToModel(source.table);
  const targetModel = StringHelper.tableToModel(target.table);
  const alias = createAlias(type, source, target, junction);

  if (alreadyAdded.includes(alias)) return { mixins: '', declaration: '' };
  alreadyAdded.push(alias);

  const declaration = sp(4, '%s: Sequelize.Association<%s, %s>;\n', alias, sourceModel, targetModel);
  let mixins = '';

  switch (type) {
    case RelationshipType.HasMany:
      mixins = generateHasManyMixins(alias, sourceModel, targetModel);
      break;
    case RelationshipType.BelongsTo:
      mixins = generateBelongsToMixins(alias, sourceModel, targetModel);
      break;
    case RelationshipType.HasOne:
      mixins = generateHasOneMixins(alias, sourceModel, targetModel);
      break;
    case RelationshipType.ManyToMany:
      mixins = generateBelongsToManyMixins(alias, sourceModel, targetModel);
      break;
  }

  return { mixins, declaration };
};

/**
 * Generates association declarations and mixins for model relationships
 * @param relations - Array of relationship configurations
 * @param modTplVars - Template variables object to modify
 * @param tableName - Name of the table being processed
 */
export const generateAssociations = (relations: Relationship[], modTplVars: ModelTemplateVars, tableName: string) => {
  if (!relations.length) return;

  let mixins: string = '';
  let declaration: string = '';
  const alreadyAdded: string[] = [];

  for (const relation of relations) {
    const result = processAssociation(relation, alreadyAdded);
    mixins += result.mixins;
    declaration += result.declaration;
  }

  modTplVars.associations += `\n${mixins}\n`;
  modTplVars.associations += sp(2, `/** Static associations defined for the %s model */\n`, StringHelper.tableToModel(tableName));
  modTplVars.associations += sp(2, `declare static associations: {\n`);
  modTplVars.associations += declaration;
  modTplVars.associations += sp(2, `}`);
};

/**
 * Generates a BelongsTo relationship configuration
 * @param relationship - The relationship configuration
 * @param initTplVars - Template variables object to modify
 */
const generateBelongsToRelation = (relationship: Relationship, initTplVars: InitTemplateVars): void => {
  const { source, target } = relationship;
  const alias = createAlias(RelationshipType.BelongsTo, source, target);

  initTplVars.associations += sp(
    2,
    `%s.%s(%s, { as: '%s', foreignKey: '%s' });\n`,
    StringHelper.tableToModel(target.table),
    'belongsTo',
    StringHelper.tableToModel(source.table),
    alias,
    StringHelper.toPropertyName(target.column),
  );
};

/**
 * Generates a HasOne relationship configuration
 * @param relationship - The relationship configuration
 * @param initTplVars - Template variables object to modify
 */
const generateHasOneRelation = (relationship: Relationship, initTplVars: InitTemplateVars): void => {
  const { source, target } = relationship;
  const alias = createAlias(RelationshipType.HasOne, source, target);

  initTplVars.associations += sp(
    2,
    `%s.%s(%s, { as: '%s', foreignKey: '%s' });\n`,
    StringHelper.tableToModel(target.table),
    'hasOne',
    StringHelper.tableToModel(source.table),
    alias,
    StringHelper.toPropertyName(source.column),
  );
};

/**
 * Generates a HasMany relationship configuration
 * @param relationship - The relationship configuration
 * @param initTplVars - Template variables object to modify
 */
const generateHasManyRelation = (relationship: Relationship, initTplVars: InitTemplateVars): void => {
  const { source, target } = relationship;
  const alias = createAlias(RelationshipType.HasMany, source, target);

  initTplVars.associations += sp(
    2,
    `%s.%s(%s, { as: '%s', foreignKey: '%s' });\n`,
    StringHelper.tableToModel(target.table),
    'hasMany',
    StringHelper.tableToModel(source.table),
    alias,
    StringHelper.toPropertyName(source.column),
  );
};

/**
 * Generates a BelongsToMany relationship configuration
 * @param relationship - The relationship configuration
 * @param initTplVars - Template variables object to modify
 */
const generateBelongsToManyRelation = (relationship: Relationship, initTplVars: InitTemplateVars): void => {
  const { source, target, junction } = relationship;
  const alias = createAlias(RelationshipType.ManyToMany, source, target, junction);

  initTplVars.associations += sp(
    2,
    `%s.%s(%s, { as: '%s', through: %s, foreignKey: '%s', otherKey: '%s' });\n`,
    StringHelper.tableToModel(source.table),
    'belongsToMany',
    StringHelper.tableToModel(target.table),
    alias,
    StringHelper.tableToModel(junction.table),
    singular(source.table) + pascal(source.column),
    singular(target.table) + pascal(source.column),
  );
};

/**
 * Generates model relationships/associations configuration
 * @param relationships - Array of relationship configurations
 * @param initTplVars - Template variables object to modify
 */
export const generateRelations = (relationships: Relationship[], initTplVars: InitTemplateVars) => {
  for (const relationship of relationships) {
    switch (relationship.type) {
      case RelationshipType.BelongsTo:
        generateBelongsToRelation(relationship, initTplVars);
        break;
      case RelationshipType.HasOne:
        generateHasOneRelation(relationship, initTplVars);
        break;
      case RelationshipType.HasMany:
        generateHasManyRelation(relationship, initTplVars);
        break;
      case RelationshipType.ManyToMany:
        generateBelongsToManyRelation(relationship, initTplVars);
        break;
    }
  }

  initTplVars.importClasses = initTplVars.importClasses.trimEnd();
  initTplVars.importTypes = initTplVars.importTypes.trimEnd();
  initTplVars.exportClasses = initTplVars.exportClasses.trimEnd();
};
