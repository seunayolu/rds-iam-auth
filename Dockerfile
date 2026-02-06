FROM node:23-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

RUN wget -q https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O /app/rds-ca-bundle.pem

COPY src ./src

EXPOSE 3000

CMD ["node", "src/server.js"]