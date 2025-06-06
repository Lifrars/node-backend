// src/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();


app.use((req, res, next) => {
    console.log(">>> CORS middleware fue ejecutado para:", req.method, req.path);
    cors()(req, res, next);
});


app.use(express.json());


const areasComunesRouter = require("./routes/areas_comunes");
const areasDiasRouter   = require("./routes/areas_dias");
const diasRouter        = require("./routes/dias");

app.use("/areas_comunes", areasComunesRouter);
app.use("/areas_dias",   areasDiasRouter);
app.use("/dias",         diasRouter);


app.get("/", (req, res) => {
    res.send("API Oracle: usa /areas_comunes, /areas_dias o /dias");
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Express corriendo en puerto ${PORT}`);
});

