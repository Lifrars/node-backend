
const express = require("express");
const oracledb = require("oracledb");
const router = express.Router();
const { getConnection } = require("../db");
const { mapAreaComun } = require("../models");

router.get("/", async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const sql = `
            SELECT
                ac.info_areas_comunes.ID,
                ac.info_areas_comunes.NOMBRE,
                ac.info_areas_comunes.DESCRIPCION,
                ac.info_areas_comunes.ESTADO,
                ac.capacidad_area,
                ac.ubicacion_area
            FROM areas_comunes ac
        `;
        const result = await conn.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_ARRAY });
        const data = result.rows.map(mapAreaComun);
        res.json(data);
    } catch (err) {
        console.error("Error en GET /areas_comunes:", err);
        res.status(500).json({ error: "Error interno en el servidor" });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (_) {}
        }
    }
});

router.post("/", async (req, res) => {
    const body = req.body;

    if (!body.info_areas_comunes || body.capacidad_area == null || !body.ubicacion_area) {
        return res.status(400).json({ error: "Faltan campos obligatorios en el cuerpo" });
    }

    const {  nombre, descripcion, estado } = body.info_areas_comunes;
    const { capacidad_area, ubicacion_area } = body;

    let conn;
    try {
        conn = await getConnection();


        const sql = `
      INSERT INTO areas_comunes (
        info_areas_comunes,
        capacidad_area,
        ubicacion_area
      ) VALUES (
        informacion(seq_areas_comunes.NEXTVAL, :descripcion, :nombre, :estado),
        :capacidad_area,
        :ubicacion_area
      )
    `;

        const binds = {
            nombre:        nombre,
            descripcion:   descripcion,
            estado:        estado,
            capacidad_area: Number(capacidad_area),
            ubicacion_area: ubicacion_area
        };


        await conn.execute(sql, binds, { autoCommit: true });
        res.status(201).json({ message: "Área común creada correctamente." });
    } catch (err) {
        console.error("Error en POST /areas_comunes:", err);

        res.status(500).json({ error: err.message });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (_) {}
        }
    }
});


router.put("/:id", async (req, res) => {
    const idParam = Number(req.params.id);
    const body = req.body;


    if (isNaN(idParam) || idParam <= 0) {
        return res.status(400).json({ error: "El parámetro :id debe ser un número válido" });
    }
    if (
        !body.info_areas_comunes ||
        typeof body.info_areas_comunes.nombre !== "string" ||
        typeof body.info_areas_comunes.descripcion !== "string" ||
        typeof body.info_areas_comunes.estado !== "number" ||
        body.capacidad_area == null ||
        typeof body.ubicacion_area !== "string"
    ) {
        return res.status(400).json({ error: "Faltan o son inválidos los campos en el cuerpo" });
    }

    const { nombre, descripcion, estado } = body.info_areas_comunes;
    const { capacidad_area, ubicacion_area } = body;

    let conn;
    try {
        conn = await getConnection();
        console.log("test-1")
        const existsSql = `
            SELECT 1
            FROM areas_comunes ac
            WHERE ac.info_areas_comunes.id = :id
        `;
        const existsResult = await conn.execute(
            existsSql,
            { id: idParam },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (existsResult.rows.length === 0) {
            return res.status(404).json({ error: "No existe ninguna área con ese ID." });
        }
        console.log("actualizado")
        const updateSql = `
            UPDATE areas_comunes
            SET info_areas_comunes = INFORMACION(:id, :descripcion, :nombre, :estado),
                capacidad_area     = :capacidad_area,
                ubicacion_area     = :ubicacion_area
            WHERE TREAT(info_areas_comunes AS INFORMACION).id = :id
        `;

        console.log("test-2")
        const binds = {
            id:             idParam,
            nombre:         nombre,
            descripcion:    descripcion,
            estado:         estado,
            capacidad_area: Number(capacidad_area),
            ubicacion_area: ubicacion_area
        };

        await conn.execute(updateSql, binds, { autoCommit: true });
        res.json({ message: "Área común actualizada correctamente." });
    } catch (err) {
        console.error("Error en PUT /areas_comunes/:id:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (_) {}
        }
    }
});

router.put("/:id/estado", async (req, res) => {
    const idParam = Number(req.params.id);

    if (isNaN(idParam) || idParam <= 0) {
        return res.status(400).json({ error: "El parámetro :id debe ser un número válido" });
    }

    let conn;
    try {
        conn = await getConnection();


        const selectSql = `
            SELECT info_areas_comunes, capacidad_area, ubicacion_area
            FROM areas_comunes
            WHERE TREAT(info_areas_comunes AS INFORMACION).id = :id
        `;
        const result = await conn.execute(selectSql, { id: idParam }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No existe ninguna área con ese ID." });
        }

        const area = result.rows[0];
        const info = area.INFO_AREAS_COMUNES;


        const nuevoEstado = info.ESTADO === 1 ? 0 : 1;


        const updateSql = `
            UPDATE areas_comunes
            SET info_areas_comunes = INFORMACION(:id, :descripcion, :nombre, :estado),
                capacidad_area     = :capacidad,
                ubicacion_area     = :ubicacion
            WHERE TREAT(info_areas_comunes AS INFORMACION).id = :id
        `;
        const binds = {
            id: idParam,
            descripcion: info.DESCRIPCION,
            nombre: info.NOMBRE,
            estado: nuevoEstado,
            capacidad: area.CAPACIDAD_AREA,
            ubicacion: area.UBICACION_AREA
        };

        await conn.execute(updateSql, binds, { autoCommit: true });

        res.json({ message: `Área ${idParam} ${nuevoEstado === 1 ? 'activada' : 'desactivada'} correctamente.` });
    } catch (err) {
        console.error("Error en PUT /areas_comunes/:id/toggle:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) try { await conn.close(); } catch (_) {}
    }
});



router.get('/:id', async (req, res) => {
    const areaId = Number(req.params.id);
    let conn;

    try {
        conn = await getConnection();

        const resultInfo = await conn.execute(
            `
      SELECT
        ac.info_areas_comunes.id AS id,
        ac.info_areas_comunes.nombre AS nombre,
        ac.info_areas_comunes.descripcion AS descripcion,
        ac.info_areas_comunes.estado AS estado,
        ac.capacidad_area AS capacidad_area,
        ac.ubicacion_area AS ubicacion_area
      FROM areas_comunes ac
      WHERE ac.info_areas_comunes.id = :areaId
      `,
            { areaId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (resultInfo.rows.length === 0) {
            return res.status(404).json({ error: 'Área no encontrada' });
        }

        const infoArea = resultInfo.rows[0];


        const resultDias = await conn.execute(
            `
      SELECT
        d.id_dia.id           AS id_dia,
        d.id_dia.nombre       AS nombre_dia,
        ad.disponibilidad_areas_dias.hora_inicio AS hora_inicio,
        ad.disponibilidad_areas_dias.hora_fin   AS hora_fin
      FROM areas_dias ad
      JOIN dias d
        ON d.id_dia.id = ad.id_dias_areas_dias
      WHERE ad.areas_comunes_id_area = :areaId
      ORDER BY d.id_dia.id
      `,
            { areaId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );


        const horariosPorDia = resultDias.rows.map((row) => ({
            id_dia: row.ID_DIA,
            nombre_dia: row.NOMBRE_DIA,
            hora_inicio: row.HORA_INICIO ? formatHora(row.HORA_INICIO) : null,
            hora_fin:    row.HORA_FIN    ? formatHora(row.HORA_FIN)    : null
        }));


        return res.json({
            info: infoArea,
            horariosPorDia: horariosPorDia
        });

    } catch (err) {
        console.error('Error en GET /areas_comunes/:id', err);
        return res.status(500).json({ error: 'Error al obtener detalle del área' });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (_) { }
        }
    }
});


function formatHora(dateObj) {
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const mins  = dateObj.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
}
module.exports = router;
