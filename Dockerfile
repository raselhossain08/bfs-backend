# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --force

# Copy source code
COPY . .

# Build NestJS project
RUN npm run build

# Verify build output exists (fails image build if dist is missing)
RUN test -f dist/main.js || (echo "Build failed: dist/main.js not found" && exit 1)

# Expose backend port
EXPOSE 5000

# Start NestJS app
CMD ["npm", "run", "start:prod"]
