FROM node:18.18-alpine3.18 AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=development
RUN npm install argon2 --build-from-source
COPY . .

RUN npm run build

FROM node:18.18-alpine3.18 as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force
RUN npm install argon2 --build-from-source

COPY . .

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "src/dist/main"]