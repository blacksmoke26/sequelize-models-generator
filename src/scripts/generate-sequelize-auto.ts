/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @copyright 2025 Junaid Atari
 * @see https://github.com/blacksmoke26
 */

import 'dotenv/config';

import SequelizeAuto from 'sequelize-auto';

// utils
import { DIST_DIR } from '~/constants/file-system';
import EnvHelper from '~/helpers/EnvHelper';

(async () => {
  const { host, username, password, name } = EnvHelper.getDbConfig();

  const auto = new SequelizeAuto(name, username, password, {
    host: host,
    dialect: 'postgres',
    directory: DIST_DIR + '/models-auto', // where to write files
    // @ts-expect-error skip port
    port: '5432',
    lang: 'ts',
    caseProp: 'c',
    caseModel: 'p', // convert snake_case column names to camelCase field names: user_id -> userId
    caseFile: 'p', // file names created for each model use camelCase.js not snake_case.js
    singularize: true, // convert plural table names to singular model names
    additional: {
      timestamps: true,
      // ...options added to each model
    },
    //tables: ['table1', 'table2', 'myschema.table3'], // use all tables, if omitted
    //...
  });

  auto.run();
})();
