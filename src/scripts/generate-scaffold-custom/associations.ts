/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import { pascal } from 'case';
import { singular } from 'pluralize';
import { pascalCase } from 'change-case';

// helpers
import StringHelper from '~/helpers/StringHelper';

// utils
import { sp } from './utils';
import { RelationshipType } from '~/classes/DbUtils';

// types
import type { Relationship } from '~/typings/utils';
import type { InitTemplateVars, ModelTemplateVars } from './utils';

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

  for (const { type, source, target } of relations) {
    const sourceModel = StringHelper.tableToModel(source.table);
    const targetModel = StringHelper.tableToModel(target.table);

    if (type === RelationshipType.HasMany) {
      const alias = StringHelper.relationBelongsTo(source.table, target.table);

      if (alreadyAdded.includes(alias)) continue;
      alreadyAdded.push(alias);

      declaration += sp(4, '%s: Sequelize.Association<%s, %s>;\n', alias, sourceModel, targetModel);

      mixins += '\n';
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
    } else if (type === RelationshipType.BelongsTo) {
      const alias = StringHelper.relationHasOne(target.table);

      if (alreadyAdded.includes(alias)) continue;
      alreadyAdded.push(alias);

      declaration += sp(4, '%s: Sequelize.Association<%s, %s>;\n', alias, sourceModel, targetModel);

      mixins += '\n';
      mixins += sp(2, `// %s belongsTo %s (as %s)\n`, sourceModel, targetModel, alias);
      mixins += sp(2, `declare %s?: Sequelize.NonAttribute<%s>;\n`, alias, targetModel);
      mixins += sp(2, `declare get%s: Sequelize.BelongsToGetAssociationMixin<%s>;\n`, pascalCase(alias), targetModel);
      mixins += sp(2, `declare set%s: Sequelize.BelongsToSetAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
      mixins += sp(2, `declare create%s: Sequelize.BelongsToCreateAssociationMixin<%s>;\n`, pascalCase(alias), targetModel);
    } else if (type === RelationshipType.HasOne) {
      const alias = StringHelper.relationBelongsTo(target.table, source.table);

      if (alreadyAdded.includes(alias)) continue;
      alreadyAdded.push(alias);

      declaration += sp(4, '%s: Sequelize.Association<%s, %s>;\n', alias, sourceModel, targetModel);

      mixins += '\n';
      mixins += sp(2, `// %s hasOne %s (as %s)\n`, sourceModel, targetModel, alias);
      mixins += sp(2, `declare %s?: Sequelize.NonAttribute<%s>;\n`, alias, targetModel);
      mixins += sp(2, `declare get%s: Sequelize.HasOneGetAssociationMixin<%s>;\n`, pascalCase(alias), targetModel);
      mixins += sp(2, `declare set%s: Sequelize.HasOneSetAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
      mixins += sp(2, `declare create%s: Sequelize.HasOneCreateAssociationMixin<%s>;`, pascalCase(alias), targetModel);
    } else if (type === RelationshipType.ManyToMany) {
      // TODO: Figure out
      // const alias1 = StringHelper.relationBelongsToMany(target.table, source.table);
      // const alias2 = StringHelper.relationBelongsToMany(source.table, target.table);
      // declaration += sp(4, '%s: Sequelize.Association<%s, %s>;\n', alias1, sourceModel, targetModel);
      // declaration += sp(4, '%s: Sequelize.Association<%s, %s>;\n', alias2, targetModel, sourceModel);
      //
      // mixins += '\n';
      // mixins += sp(2, `// %s belongsToMany %s (as %s)\n`, sourceModel, targetModel, alias1);
      // mixins += sp(2, `declare %s?: Sequelize.NonAttribute<%s[]>;\n`, alias1, targetModel);
      // mixins += sp(2, `declare %s?: Sequelize.NonAttribute<%s[]>;\n`, alias2, sourceModel);
      // mixins += sp(2, `declare get%s: Sequelize.BelongsToManyGetAssociationsMixin<%s>;\n`, pascalCase(alias1), targetModel);
      /*mixins += sp(2, `declare set%s: Sequelize.BelongsToManySetAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
      mixins += sp(2, `declare add%s: Sequelize.BelongsToManyAddAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
      mixins += sp(2, `declare add%ses: Sequelize.BelongsToManyAddAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
      mixins += sp(2, `declare create%s: Sequelize.BelongsToManyCreateAssociationMixin<%s>;\n`, pascalCase(alias), targetModel);
      mixins += sp(2, `declare remove%s: Sequelize.BelongsToManyRemoveAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
      mixins += sp(2, `declare remove%ses: Sequelize.BelongsToManyRemoveAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
      mixins += sp(2, `declare has%s: Sequelize.BelongsToManyHasAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
      mixins += sp(2, `declare has%ses: Sequelize.BelongsToManyHasAssociationsMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
      mixins += sp(2, `declare count%s: Sequelize.BelongsToManyCountAssociationsMixin;\n`, pascalCase(alias));*/
    }
  }

  modTplVars.associations += `\n${mixins}\n`;
  modTplVars.associations += sp(2, `/** Static associations defined for the %s model */\n`, StringHelper.tableToModel(tableName));
  modTplVars.associations += sp(2, `declare static associations: {\n`);
  modTplVars.associations += declaration;
  modTplVars.associations += sp(2, `}`);
};


/**
 * Generates model relationships/associations configuration
 * @param relationships - Array of relationship configurations
 * @param initTplVars - Template variables object to modify
 */
export const generateInitializer = (relationships: Relationship[], initTplVars: InitTemplateVars) => {
  for (const relationship of relationships) {
    const { type, source, target, junction } = relationship;
    let relation = '';
    let alias = '';

    switch (type) {
      case RelationshipType.BelongsTo: {
        relation = 'belongsTo';
        alias = StringHelper.relationBelongsTo(target.table, source.table);
        initTplVars.associations += sp(
          2,
          `%s.%s(%s, { as: '%s', foreignKey: '%s' });\n`,
          StringHelper.tableToModel(target.table),
          relation,
          StringHelper.tableToModel(source.table),
          alias,
          StringHelper.toPropertyName(target.column),
        );
        break;
      }
      case RelationshipType.HasOne: {
        relation = 'hasOne';
        alias = StringHelper.relationHasOne(source.table);

        initTplVars.associations += sp(
          2,
          `%s.%s(%s, { as: '%s', foreignKey: '%s' });\n`,
          StringHelper.tableToModel(target.table),
          relation,
          StringHelper.tableToModel(source.table),
          alias,
          StringHelper.toPropertyName(source.column),
        );
        break;
      }
      case RelationshipType.HasMany: {
        relation = 'hasMany';
        alias = StringHelper.relationHasMany(target.table, source.table);

        initTplVars.associations += sp(
          2,
          `%s.%s(%s, { as: '%s', foreignKey: '%s' });\n`,
          StringHelper.tableToModel(target.table),
          relation,
          StringHelper.tableToModel(source.table),
          alias,
          StringHelper.toPropertyName(source.column),
        );
        break;
      }
      case RelationshipType.ManyToMany: {
        relation = 'belongsToMany';

        initTplVars.associations += sp(
          2,
          `%s.%s(%s, { as: '%s', through: %s, foreignKey: '%s', otherKey: '%s' });\n`,
          StringHelper.tableToModel(source.table),
          relation,
          StringHelper.tableToModel(target.table),
          StringHelper.relationBelongsToMany(source.table, target.table),
          StringHelper.tableToModel(junction.table),
          singular(source.table) + pascal(target.column),
          singular(target.table) + pascal(source.column),
        );

        initTplVars.associations += sp(
          2,
          `%s.%s(%s, { as: '%s', through: %s, foreignKey: '%s', otherKey: '%s' });\n`,
          StringHelper.tableToModel(target.table),
          relation,
          StringHelper.tableToModel(source.table),
          StringHelper.relationBelongsToMany(target.table, source.table),
          StringHelper.tableToModel(junction.table),
          singular(target.table) + pascal(source.column),
          singular(source.table) + pascal(target.column),
        );
        break;
      }
    }
  }

  initTplVars.importClasses = initTplVars.importClasses.trimEnd();
  initTplVars.importTypes = initTplVars.importTypes.trimEnd();
  initTplVars.exportClasses = initTplVars.exportClasses.trimEnd();
};
