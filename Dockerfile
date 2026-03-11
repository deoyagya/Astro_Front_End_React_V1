# =============================================================================
# Multi-stage production Dockerfile for React SPA (Vite)
# Stage 1: Build with Node  |  Stage 2: Serve with Nginx
# Reusable: change build command, build args, and nginx.conf as needed
# =============================================================================

# --------------- Stage 1: Build ---------------
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts=false

# Pass build-time environment variables
# These get embedded into the JS bundle by Vite
ARG VITE_API_BASE_URL
ARG VITE_RAZORPAY_KEY_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID

# Copy source and build
COPY . .
RUN npm run build

# --------------- Stage 2: Serve ---------------
FROM nginx:alpine AS runtime

# Copy nginx config template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Railway injects PORT; default to 3000 for local development
# Nginx template uses envsubst to replace ${PORT} at runtime
ENV PORT=3000

EXPOSE ${PORT}

# Nginx's docker-entrypoint auto-runs envsubst on /etc/nginx/templates/*.template
# and outputs to /etc/nginx/conf.d/, then starts nginx
CMD ["nginx", "-g", "daemon off;"]
