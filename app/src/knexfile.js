const path = require('path');
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
    client: "pg",
    connection: {
        host: process.env.POSTGRES_HOST,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
        port: process.env.POSTGRES_PORT,
    },
    pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 60000,
        afterCreate: (conn, done) => {
            console.log(`[Knex] Connection created:`, conn);
            done(null, conn);
        },
        destroy: (conn) => {
            console.log(`[Knex] Connection destroyed:`, conn);
        },
    },
    acquireConnectionTimeout: 60000,
    migrations: {
        directory: path.join(__dirname, "migrations"),
        pool: {
            min: 1,
            max: 2,
        },
    },
    debug: true, // Enable SQL query debugging
    log: {
        warn(message) {
            console.warn(`[Knex][WARN] ${message}`);
        },
        error(message) {
            console.error(`[Knex][ERROR] ${message}`);
        },
        deprecate(message) {
            console.warn(`[Knex][DEPRECATE] ${message}`);
        },
        debug(message) {
            console.debug(`[Knex][DEBUG] ${message}`);
        },
    },
};

const knex = require('knex')(module.exports);

knex.on('query', (query) => {
    console.log('[Knex][QUERY] Executing:', query.sql);
});

knex.on('query-error', (error, obj) => {
    console.error('[Knex][QUERY-ERROR]', error.message, obj);
});

knex.on('query-response', (response, query) => {
    console.log('[Knex][QUERY-RESPONSE] Response:', response);
});
