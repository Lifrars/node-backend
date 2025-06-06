
require("dotenv").config();
const oracledb = require("oracledb");



const {
    ORACLE_USER,
    ORACLE_PASSWORD,
    ORACLE_HOST,
    ORACLE_PORT,
    ORACLE_SVC,
} = process.env;

const dsn = `${ORACLE_HOST}:${ORACLE_PORT}/${ORACLE_SVC}`;


async function getConnection() {
    try {
        const conn = await oracledb.getConnection({
            user: ORACLE_USER,
            password: ORACLE_PASSWORD,
            connectString: dsn,
        });
        return conn;
    } catch (err) {
        console.error("Error conectando a Oracle (modo Thin):", err);
        throw err;
    }
}

module.exports = { getConnection };
