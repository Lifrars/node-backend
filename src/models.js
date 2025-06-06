
function mapAreaComun(row) {

    return {
        info_areas_comunes: {
            id:       row[0],
            nombre:   row[1],
            descripcion: row[2],
            estado:   row[3],
        },
        capacidad_area:  row[4],
        ubicacion_area:  row[5],
    };
}

function mapAreaDia(row) {
    return {
        areas_comunes_id_area:   row[0],
        id_dias_areas_dias:      row[1],
        disponibilidad_areas_dias: {
            hora_inicio: row[2],
            hora_fin:    row[3],
        },
    };
}

function mapDia(row) {

    return { id_dia: { id: row[0], nombre: row[1] } };
}

module.exports = {
    mapAreaComun,
    mapAreaDia,
    mapDia,
};
