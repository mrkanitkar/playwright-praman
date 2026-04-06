# Reference Dockerfile for Praman test execution
# Based on Microsoft's official Playwright image
FROM mcr.microsoft.com/playwright:v1.59.0-noble

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Run as non-root user (included in Playwright images)
USER pwuser

CMD ["npx", "playwright", "test"]
