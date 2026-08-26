FROM node:22-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

FROM node:22-alpine AS prod

WORKDIR /app
ENV NODE_ENV=production

# Injetado pelo CodeBuild (--build-arg APP_VERSION=${IMG_TAG})
ARG APP_VERSION="dev"
ENV APP_VERSION=${APP_VERSION}

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=build /app/dist ./dist
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["npm", "run", "start"]
