# Base image with Node.js
FROM node:22-bullseye

# Install dependencies for Puppeteer / Chromium
RUN apt-get update && \
    apt-get install -y wget ca-certificates fonts-liberation libx11-xcb1 \
    libxcomposite1 libxcursor1 libxdamage1 libxi6 libxtst6 libnss3 \
    libxrandr2 libasound2 libpangocairo-1.0-0 libatk1.0-0 libcups2 \
    libdrm2 libgbm1 libpango-1.0-0 libatk-bridge2.0-0 xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port
EXPOSE 3000

# Launch the server
CMD ["node", "server.js"]
