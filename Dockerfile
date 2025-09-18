FROM node:20-alpine

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

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
