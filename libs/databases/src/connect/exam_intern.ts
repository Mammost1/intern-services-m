import { config } from '@internship/config';
import knex from 'knex';
import * as bookshelf from 'bookshelf';
var jsonColumns = require('bookshelf-json-columns');

const connect_knex = knex({
  client: config.database.dev_intern.client,
  connection: {
    host     :  config.database.dev_intern.connection.host,
    user     :  config.database.dev_intern.connection.user,
    password :  config.database.dev_intern.connection.password,
    database : config.database.dev_intern.connection.database,
    charset  : 'utf8mb4'
  },
  pool: config.database.dev_intern.pools
})
let _bookshelf = bookshelf(connect_knex as any)
_bookshelf.plugin(jsonColumns)
export const db_dev_intern_connect = _bookshelf
