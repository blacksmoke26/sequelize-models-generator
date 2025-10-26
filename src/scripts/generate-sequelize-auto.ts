import 'dotenv/config';

import SequelizeAuto from 'sequelize-auto';

const auto = new SequelizeAuto(process.env.DATABASE_NAME, process.env.DATABASE_USERNAME, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: 'postgres',
  directory: '../../models-auto', // where to write files
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
