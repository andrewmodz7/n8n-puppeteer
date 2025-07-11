FROM node:18-slim

# Puppeteer dependencies
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
  libgbm1 \
  xdg-utils \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# Avoid Puppeteer downloading Chromium again
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install n8n and puppeteer
RUN npm install -g n8n puppeteer

# Set working dir and copy your code
WORKDIR /app
COPY . .

# Expose port for n8n
EXPOSE 5678

# Start n8n
CMD ["n8n"]
