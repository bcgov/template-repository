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
    migrations: {
        directory: path.join(__dirname, "migrations"),
    },
};
