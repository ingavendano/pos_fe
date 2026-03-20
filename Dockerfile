# Dockerfile para Frontend Angular
# Etapa 1: Construcción
FROM node:22 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration=production

# Etapa 2: Servidor Web Nginx
FROM nginx:alpine
# Copiar el build de Angular (la ruta puede variar según el nombre del proyecto en angular.json)
COPY --from=build /app/dist/*/browser /usr/share/nginx/html
# Copiar configuración de Nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
