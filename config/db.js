import { createPool } from 'mysql2';
import { createConnection } from 'mysql2/promise';

function getEnvValue(...keys) {
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(process.env, key)) {
            return process.env[key];
        }
    }

    return undefined;
}

export const databaseName = getEnvValue('DB_NAME', 'DATABASE') || 'express';

const connectionConfig = {
    host: getEnvValue('DB_HOST', 'DATABASE_HOST') || 'localhost',
    user: getEnvValue('DB_USER', 'DATABASE_USER') || 'root',
    password: getEnvValue('DB_PASSWORD', 'DATABASE_PASSWORD') ?? '111111',
    port: Number(getEnvValue('DB_PORT', 'PORT_DB') || 3306)
};

export async function ensureDatabaseExists() {
    const connection = await createConnection(connectionConfig);
    const escapedDatabaseName = databaseName.replaceAll('`', '``');

    await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${escapedDatabaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.end();
}

export const dbPool = createPool({
    ...connectionConfig,
    database: databaseName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default dbPool.promise();
