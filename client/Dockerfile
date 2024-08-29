# client/Dockerfile
FROM node:18

# Set the working directory
WORKDIR /app

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm install

RUN npm run build

# Expose the port the app runs on
EXPOSE 4173

# Start the application
CMD ["npm", "run", "preview"]