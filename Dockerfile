# Usar la imagen oficial de Node.js como base
FROM node:14

# Establecer el directorio de trabajo
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código de la aplicación
COPY . .

# Exponer el puerto en el que se ejecuta la aplicación
EXPOSE 3000

# Instalar Redis
RUN apt-get update && apt-get install -y redis-server

# Iniciar la aplicación y Redis en paralelo
CMD ["sh", "-c", "redis-server & npm start"]