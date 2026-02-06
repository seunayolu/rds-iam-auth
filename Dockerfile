FROM node:23-alpine

WORKDIR /app

# Install dependencies needed for wget and CA certs
RUN apk add --no-cache wget ca-certificates

COPY package*.json ./
RUN npm install --omit=dev

# Use the specific global bundle
RUN wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O /app/rds-ca-bundle.pem

COPY src ./src

EXPOSE 3000

CMD ["node", "src/server.js"]