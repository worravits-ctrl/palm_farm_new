FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

# Initialize database
RUN npm run init-db

# Build frontend
WORKDIR /app/frontend
RUN npm install --include=dev
RUN npm run build

# Back to root for backend
WORKDIR /app

EXPOSE 3001

CMD [ "node", "api-server.js" ]
