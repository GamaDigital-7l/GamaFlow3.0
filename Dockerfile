# Stage 1: Build the application
FROM node:20-alpine as builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine as production

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built application files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy root static files (like favicon.svg, placeholder.svg) from the public folder
# Note: Vite copies public files to the root of the dist folder during build.
# We assume they are already in /app/dist/
# If they were not copied by Vite, we would copy them manually from the source public folder.
# Since Vite handles this, we rely on the previous COPY.

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]