/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import 'dotenv/config';

import path from 'node:path';
import figlet from 'figlet';
import fsx from 'fs-extra';
import { pascal } from 'case';

// classes
import KnexClient from '~/classes/KnexClient';
import TableColumns from '~/classes/TableColumns';

// helpers
import FileHelper from '~/helpers/FileHelper';
import StringHelper from '~/helpers/StringHelper';
import NunjucksHelper from '~/helpers/NunjucksHelper';

// utils
import DbUtils, { RelationshipType } from '~/classes/DbUtils';
import {
  generateAttributes,
  generateEnums,
  generateFields,
  generateIndexes,
  generateInitializer,
  generateInterfaces,
  generateOptions,
  generateRelationsImports,
  getInitializerTemplateVars,
  getModelTemplateVars,
  ModelTemplateVars,
  sp,
} from './utils';
import { Relationship } from '~/typings/utils';
import { pascalCase } from 'change-case';

export const generateAssociations = (relations: Relationship[], modTplVars: ModelTemplateVars, tableName: string) => {
  if (!relations.length) return;

  let mixins: string = '';
  let declaration: string = '';

  for (const {type, source, target} of relations) {
    const sourceModel = StringHelper.tableToModel(source.table);
    const targetModel = StringHelper.tableToModel(target.table);

    if (type === RelationshipType.HasMany) {
      const alias = StringHelper.relationBelongsTo(source.table, target.table);
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
      declaration += sp(4, '%s: Sequelize.Association<%s, %s>;\n', alias, sourceModel, targetModel);

      mixins += '\n';
      mixins += sp(2, `// %s belongsTo %s (as %s)\n`, sourceModel, targetModel, alias);
      mixins += sp(2, `declare %s?: Sequelize.NonAttribute<%s>;\n`, alias, targetModel);
      mixins += sp(2, `declare get%s: Sequelize.BelongsToGetAssociationMixin<%s>;\n`, pascalCase(alias), targetModel);
      mixins += sp(2, `declare set%s: Sequelize.BelongsToSetAssociationMixin<%s, %s>;\n`, pascalCase(alias), targetModel, 'number');
      mixins += sp(2, `declare create%s: Sequelize.BelongsToCreateAssociationMixin<%s>;\n`, pascalCase(alias), targetModel);

    } else if (type === RelationshipType.HasOne) {
      const alias = StringHelper.relationBelongsTo(target.table, source.table);
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

async function run() {
  console.log(await figlet.text('Generate Scaffold App', { font: 'Slant' }));
  // 1️⃣ Configure Knex
  const knex = KnexClient.create();

  const outputDir = FileHelper.rootPath('dist/custom-scaffold/models');

  console.log('Cleaning up target directory...');
  fsx.emptydirSync(outputDir);
  fsx.emptydirSync(FileHelper.rootPath('dist/custom-scaffold/base'));
  fsx.emptydirSync(FileHelper.rootPath('dist/custom-scaffold/repositories'));
  console.log('Target directories cleaned!');

  console.log('Fetching database information...');
  const schemas = await DbUtils.getSchemas(knex);
  const indexes = await DbUtils.getIndexes(knex);
  const relationships = await DbUtils.getRelationships(knex);
  const foreignKeys = await DbUtils.getForeignKeys(knex);

  writeBaseFiles();

  const initTplVars = getInitializerTemplateVars();

  for (const schemaName of schemas) {
    const schemaTables = await DbUtils.getTables(knex, schemaName);

    for await (const tableName of schemaTables) {
      const tableRelations = relationships.filter((x) => x.source.table === tableName) ?? [];

      const modelName = pascal(StringHelper.normalizeSingular(tableName));
      const tableIndexes = indexes.filter((x) => x.table === tableName && x.schema === schemaName);
      const tableForeignKeys = foreignKeys.filter((x) => x.tableName === tableName && x.schema === schemaName);

      initTplVars.importClasses += sp(0, `import %s from './%s';\n`, modelName, modelName);
      initTplVars.importTypes += sp(0, `export * from './%s';\n`, modelName);
      initTplVars.exportClasses += sp(2, `%s,\n`, modelName);

      const modTplVars = getModelTemplateVars({
        schemaName,
        modelName,
        tableName,
      });

      const columnsInfo = await TableColumns.list(knex, tableName, schemaName);

      const hasCreatedAt: boolean = columnsInfo.findIndex((x) => /^created(_a|A)t$/.test(x.name)) !== -1;
      const hasUpdatedAt: boolean = columnsInfo.findIndex((x) => /^updated(_a|A)t$/.test(x.name)) !== -1;

      for (const columnInfo of columnsInfo) {
        const relation = tableRelations.find((x) => x.source.column === columnInfo.name) ?? null;

        generateEnums(columnInfo, modTplVars, modelName);
        generateInterfaces(columnInfo, modTplVars);
        generateFields(columnInfo, modTplVars, modelName, {
          targetTable: relation?.target?.table ?? null,
          targetColumn: relation?.target?.column ?? null,
          isFK: relation !== null,
        });
        generateAttributes({ columnInfo, modTplVars, tableForeignKeys });
      }

      generateRelationsImports(tableRelations, modTplVars);
      generateOptions(modTplVars, { schemaName, tableName, hasCreatedAt, hasUpdatedAt });
      generateIndexes(tableIndexes, modTplVars);
      generateAssociations(tableRelations, modTplVars, tableName);

      modTplVars.modelsImport = modTplVars.modelsImport.trimEnd();
      modTplVars.fields = modTplVars.fields.trimEnd();
      modTplVars.options = modTplVars.options.trimEnd();
      modTplVars.attributes = modTplVars.attributes.trimEnd();

      const text = NunjucksHelper.renderFile(__dirname + '/templates/model-template.njk', modTplVars, { autoescape: false });
      const fileName = path.normalize(`${outputDir}/${modelName}.ts`);
      console.log('Model generated:', fileName);
      FileHelper.saveTextToFile(fileName, text);

      writeRepoFile(StringHelper.tableToModel(tableName));
    }
  }

  generateInitializer(relationships, initTplVars);

  const text = NunjucksHelper.renderFile(__dirname + '/templates/models-initializer.njk', initTplVars, { autoescape: false });
  const fileName = path.normalize(`${outputDir}/index.ts`);
  console.log('Models Initializer generated:', fileName);
  FileHelper.saveTextToFile(fileName, text);

  process.exit();
}

const writeBaseFiles = () => {
  const fileName = FileHelper.rootPath('dist/custom-scaffold/base/ModelBase.ts');
  const text = NunjucksHelper.renderFile(`${__dirname}/templates/model-base.njk`, {}, { autoescape: false });
  FileHelper.saveTextToFile(fileName, text);
  console.log('Generated ModelBase:', fileName);

  const rbFileName = FileHelper.rootPath('dist/custom-scaffold/base/RepositoryBase.ts');
  const rbText = NunjucksHelper.renderFile(`${__dirname}/templates/repo-base.njk`, {}, { autoescape: false });
  FileHelper.saveTextToFile(rbFileName, rbText);
  console.log('Generated RepositoryBase:', rbFileName);

  const cfgFileName = FileHelper.rootPath('dist/custom-scaffold/configuration.ts');
  const cfgText = NunjucksHelper.renderFile(`${__dirname}/templates/config-template.njk`, {}, { autoescape: false });
  FileHelper.saveTextToFile(cfgFileName, cfgText);
  console.log('Generated configuration file:', cfgFileName);

  const insFileName = FileHelper.rootPath('dist/custom-scaffold/instance.ts');
  const insText = NunjucksHelper.renderFile(`${__dirname}/templates/instance-template.njk`, {}, { autoescape: false });
  FileHelper.saveTextToFile(insFileName, insText);
  console.log('Generated instance file:', insFileName);
};

export const writeRepoFile = (modelName: string) => {
  const text = NunjucksHelper.renderFile(__dirname + '/templates/repo-template.njk', { modelName }, { autoescape: false });
  const fileName = FileHelper.rootPath(`dist/custom-scaffold/repositories/${modelName}Repository.ts`);
  console.log('Repository generated:', fileName);
  FileHelper.saveTextToFile(fileName, text);
};

run();
