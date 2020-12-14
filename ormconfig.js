module.exports = {
  type: 'sqlite',
  name: "default",
  database: 'local/k8s-debugger.sqlite',
  synchronize: true,
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
