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
<<<<<<< HEAD
    migrations: {
        directory: path.join(__dirname, "migrations"),
    },
};
=======
    pool: {
        min: 0,
        max: 50,
        createTimeoutMillis: 3000,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100,
        propagateCreateError: false,
        // afterCreate: (conn, done) => {
        // console.log(`[Knex] Connection created:`, conn);
        //     done(null, conn);
        // },
        // destroy: (conn) => {
        //     console.log(`[Knex] Connection destroyed:`, conn);
        // },
    },
    acquireConnectionTimeout: 60000,
    migrations: {
        directory: path.join(__dirname, "migrations"),
        pool: {
            min: 0,
            max: 2,
        },
    }
};

const knex = require('knex')(module.exports);
>>>>>>> test
