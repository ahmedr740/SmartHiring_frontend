FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG REACT_APP_API_BASE_URL
ARG REACT_APP_DEMO_MODE=false
ARG GENERATE_SOURCEMAP=false
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_DEMO_MODE=$REACT_APP_DEMO_MODE
ENV GENERATE_SOURCEMAP=$GENERATE_SOURCEMAP
RUN npm run build

FROM nginx:1.28-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
