FROM node:18-slim

# Puppeteer deps
RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# Install global packages
RUN npm install -g n8n puppeteer

# Set working directory
WORKDIR /home/node/app

# Copy all project files into the container
COPY . /home/node/app

# Open the n8n port
EXPOSE 5678

# Run n8n
CMD ["n8n"]
