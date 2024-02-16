# Start from the Node 19.8.1-alpine base image
FROM node:19.8.1-alpine AS base

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Expose port 3000
EXPOSE 3000

# Command to run the application
CMD ["tail", "-f", "/dev/null"]

