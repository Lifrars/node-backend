
const express = require("express");
const oracledb = require("oracledb");
const router = express.Router();
const { getConnection } = require("../db");
const { mapDia } = require("../models");

router.get("/", async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const sql = `
      SELECT
        d.ID_DIA.ID,
        d.ID_DIA.NOMBRE
      FROM dias d
    `;
        const result = await conn.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_ARRAY });
        const data = result.rows.map(mapDia);
        res.json(data);
    } catch (err) {
        console.error("Error en GET /dias:", err);
        res.status(500).json({ error: "Error interno en el servidor" });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (_) {}
        }
    }
});

module.exports = router;
