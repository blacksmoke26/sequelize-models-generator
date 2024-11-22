/**
 * @see https://pm2.keymetrics.io/docs/usage/application-declaration/
 */
module.exports = {
  apps: [
    {
      name: 'node-ts-boilerplate',
      script: 'dist/index.js',
      //watch: true,
      //instances: 4,
      //exec_mode: 'cluster',
    },
  ],
};
