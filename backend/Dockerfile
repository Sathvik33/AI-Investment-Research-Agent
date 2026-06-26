FROM node:20-alpine

WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm ci
RUN npx prisma generate

# Copy source code
COPY . .

# Build the TypeScript project
RUN npm run build

# Expose the API port
EXPOSE 4000

# Start the server
CMD ["npm", "start"]
