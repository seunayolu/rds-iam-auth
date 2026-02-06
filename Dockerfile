FROM node:23-alpine

WORKDIR /app

# ca-certificates is required to trust the ACM root used by RDS Proxy
RUN apk add --no-cache ca-certificates

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src

EXPOSE 3000

# Note: The global-bundle.pem download has been removed 
# because RDS Proxy uses publicly trusted certificates.
CMD ["node", "src/server.js"]