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

# Set working directory
WORKDIR /app

# ✅ COPY all your repo files into the container
COPY . .

# ✅ Install any local dependencies (like your script or puppeteer tools)
RUN npm install

# Install n8n and puppeteer globally (if needed globally, though likely already covered above)
RUN npm install -g n8n puppeteer

# Expose n8n default port
EXPOSE 5678

# Start n8n
CMD ["n8n"]
