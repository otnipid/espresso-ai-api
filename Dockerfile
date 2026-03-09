# /Users/nicholasdipinto/CascadeProjects/espresso-ml/backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Install only production dependencies for runtime
RUN npm ci --only=production && npm cache clean --force

EXPOSE 3001

CMD ["node", "dist/index.js"]