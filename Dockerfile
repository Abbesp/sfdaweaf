FROM denoland/deno:2.5.1

WORKDIR /app

# Copy all files
COPY . .

# Cache dependencies
RUN deno cache index.ts

# Expose port
EXPOSE 8000

# Start the application
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "index.ts"]
