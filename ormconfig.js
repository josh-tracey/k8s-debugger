const homedir = require('os').homedir();
var path = require('path');

var databasePath = path.join(homedir, '.local/k8s-debugger.sqlite' );

module.exports = {
  type: 'sqlite',
  name: "default",
  database: databasePath,
  synchronize: false,
  logging: false,
  entities: ['build/database/entities/**/*.js'],
  migrationsTableName: 'migrations',
  migrations: ['build/migrations/*.js'],
  migrationsRun: true,
  logging: process.env.ENVIRONMENT === 'development',
  cli: {
    entitiesDir: 'src/database/entities',
    migrationsDir: 'src/migrations',
  },
  extra: {
    idleTimeoutMillis: 10000,
  },
}
