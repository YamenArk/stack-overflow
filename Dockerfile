# Use official Node.js image as a base
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the application files
COPY . .

# Expose the port the app will run on (optional in Docker Compose)
EXPOSE 3000

# Start the application in development mode
CMD ["npm", "run", "start:dev"]
