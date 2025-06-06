# Dockerfile

# 1) Imagen base de Node.js (elige la versión que uses localmente; aquí tomamos 18-alpine)
FROM node:18-alpine

# 2) Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 3) Copia package.json y package-lock.json (o yarn.lock) para instalar dependencias primero
COPY package*.json ./

# 4) Instala dependencias (oracledb ya vendrá preparado en modo Thin, no necesita Instant Client)
RUN npm install --production

# 5) Copia el resto del código fuente
COPY . .

# 6) Expón el puerto en el que corre tu API (tal como en index.js usamos process.env.PORT o 3000)
EXPOSE 3000

# 7) Definimos el comando por defecto para iniciar la app
CMD [ "node", "src/index.js" ]
