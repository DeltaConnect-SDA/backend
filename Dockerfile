FROM node:18.18-alpine3.18 AS development

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install --only=development
RUN npm install argon2 --build-from-source
RUN npm install --save-dev ts-node typescript
RUN npx prisma generate --schema ./prisma/schema.prisma
RUN npx prisma generate
COPY . .
RUN npx prisma generate

RUN npm run build

FROM node:18.18-alpine3.18 as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --only=production && npm cache clean --force
RUN npm install argon2 --build-from-source
RUN npx prisma generate --schema ./prisma/schema.prisma
RUN npx prisma generate

COPY . .

COPY --from=development /usr/src/app/dist ./dist
RUN npx prisma generate --schema ../prisma/schema.prisma

CMD ["node", "dist/src/main"]