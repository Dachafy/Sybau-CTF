import { createPool } from "mysql2";

const pool = createPool({
    host: process.env.HOST || 'localhost',
    user: process.env.USER || 'root',
    password: process.env.PASSWORD || '111111',
    database: process.env.DATABASE || 'express',
    port: process.env.PORT_DB || 3306
});
export default pool.promise();