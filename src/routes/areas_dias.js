
const express = require("express");
const oracledb = require("oracledb");
const router = express.Router();
const { getConnection } = require("../db");
const { mapAreaDia } = require("../models");

router.get("/", async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const sql = `
      SELECT
        ad.areas_comunes_id_area,
        ad.id_dias_areas_dias,
        ad.disponibilidad_areas_dias.hora_inicio,
        ad.disponibilidad_areas_dias.hora_fin
      FROM areas_dias ad
    `;
        const result = await conn.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_ARRAY });
        const data = result.rows.map(mapAreaDia);
        res.json(data);
    } catch (err) {
        console.error("Error en GET /areas_dias:", err);
        res.status(500).json({ error: "Error interno en el servidor" });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (_) {}
        }
    }
});

router.post("/", async (req, res) => {
    const body = req.body;


    if (
        body.areas_comunes_id_area == null ||
        body.id_dias_areas_dias == null ||
        !body.disponibilidad_areas_dias ||
        !body.disponibilidad_areas_dias.hora_inicio ||
        !body.disponibilidad_areas_dias.hora_fin
    ) {
        return res.status(400).json({ error: "Faltan campos obligatorios en el cuerpo" });
    }

    const { areas_comunes_id_area, id_dias_areas_dias, disponibilidad_areas_dias } = body;
    const { hora_inicio, hora_fin } = disponibilidad_areas_dias;

    let conn;
    try {
        conn = await getConnection();

        // Convertimos los valores de hora_inicio y hora_fin a objetos Date de JS
        const fechaInicio = new Date(hora_inicio);
        const fechaFin    = new Date(hora_fin);

        const sql = `
      INSERT INTO areas_dias (
        areas_comunes_id_area,
        id_dias_areas_dias,
        disponibilidad_areas_dias
      ) VALUES (
        :areas_comunes_id_area,
        :id_dias_areas_dias,
        disponibilidad(TO_TIMESTAMP(:hora_inicio, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
                      TO_TIMESTAMP(:hora_fin,    'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'))
      )
    `;

        const binds = {
            areas_comunes_id_area: Number(areas_comunes_id_area),
            id_dias_areas_dias:    Number(id_dias_areas_dias),
            // Convertimos a string ISO con fracciones de segundo (3 decimales)
            hora_inicio: fechaInicio.toISOString(),
            hora_fin:    fechaFin.toISOString()
        };

        await conn.execute(sql, binds, { autoCommit: true });
        res.status(201).json({ message: "Registro en areas_dias creado correctamente." });
    } catch (err) {
        console.error("Error en POST /areas_dias:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (_) {}
        }
    }
});

router.put("/:areas_comunes_id_area", async (req, res) => {
    const areaIdParam = Number(req.params.areas_comunes_id_area);
    const diasData = req.body.dias; // Array con objetos: { id_dia, hora_inicio, hora_fin }

    if (isNaN(areaIdParam) || areaIdParam <= 0) {
        return res.status(400).json({ error: "El parámetro de área debe ser un número válido" });
    }

    if (!Array.isArray(diasData) || diasData.length === 0) {
        return res.status(400).json({ error: "El cuerpo debe contener un array 'dias'" });
    }

    let conn;
    try {
        conn = await getConnection();


        await conn.execute(
            `DELETE FROM areas_dias WHERE areas_comunes_id_area = :areaId`,
            { areaId: areaIdParam },
            { autoCommit: false }
        );


        for (const dia of diasData) {
            const { id_dia, hora_inicio, hora_fin } = dia;
            if (!id_dia || !hora_inicio || !hora_fin) {
                await conn.rollback();
                return res.status(400).json({ error: "Cada día debe tener id_dia, hora_inicio y hora_fin" });
            }

            await conn.execute(
                `INSERT INTO areas_dias (
          areas_comunes_id_area,
          id_dias_areas_dias,
          disponibilidad_areas_dias
        ) VALUES (
          :areaId,
          :diaId,
          disponibilidad(
            TO_TIMESTAMP(:hora_inicio, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"'),
            TO_TIMESTAMP(:hora_fin,    'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"')
          )
        )`,
                {
                    areaId: areaIdParam,
                    diaId: id_dia,
                    hora_inicio: new Date(hora_inicio).toISOString(),
                    hora_fin: new Date(hora_fin).toISOString()
                },
                { autoCommit: false }
            );
        }

        await conn.commit();
        res.json({ message: "Días actualizados correctamente para el área." });

    } catch (err) {
        console.error("Error en PUT /areas_dias/:areaId:", err);

        if (err && err.errorNum === 20007) {
            return res.status(400).json({
                error: "La hora de inicio debe ser menor que la hora de fin."
            });
        }


        res.status(500).json({ error: "Error interno del servidor." });
    }

});


module.exports = router;
