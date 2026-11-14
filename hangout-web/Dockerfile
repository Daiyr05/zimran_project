# Production build of the React app, served by nginx with SPA fallback.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Build-time config (Vite inlines VITE_* vars). Override with --build-arg.
ARG VITE_USE_MOCKS=false
ARG VITE_API_URL=http://localhost:8080/api/v1
ARG VITE_TIME_ZONE=America/New_York
ARG VITE_DEMO_UPGRADE=true
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_USE_MOCKS=$VITE_USE_MOCKS VITE_API_URL=$VITE_API_URL VITE_TIME_ZONE=$VITE_TIME_ZONE \
    VITE_DEMO_UPGRADE=$VITE_DEMO_UPGRADE VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
