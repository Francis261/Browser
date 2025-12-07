# Dockerfile-browserless
FROM browserless/chrome:latest

# Optional: environment variables
ENV PREBOOT_CHROME=true
ENV MAX_CONCURRENT_SESSIONS=5

EXPOSE 3000
