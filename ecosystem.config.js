const config = require('package.json');

/**
 * @see https://pm2.keymetrics.io/docs/usage/application-declaration/
 */
module.exports = {
  apps: [
    {
      name: config.name,
      script: config.main,
      //watch: true,
      //instances: 4,
      //exec_mode: 'cluster',
    },
  ],
};
