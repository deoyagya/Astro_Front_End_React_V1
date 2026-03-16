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
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_RAZORPAY_KEY_ID
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_FACEBOOK_APP_ID
ARG VITE_SITE_GATE_CODE
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_FACEBOOK_APP_ID=$VITE_FACEBOOK_APP_ID
ENV VITE_SITE_GATE_CODE=$VITE_SITE_GATE_CODE

# Copy source and build
COPY . .
RUN npm run build

# --------------- Stage 2: Serve ---------------
FROM nginx:alpine AS runtime

ARG VITE_API_BASE_URL

# Copy nginx config template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Railway injects PORT; default to 3000 for local development
# Nginx template uses envsubst to replace ${PORT} at runtime
ENV PORT=3000
ENV API_BASE_ORIGIN=$VITE_API_BASE_URL

EXPOSE ${PORT}

# Nginx's docker-entrypoint auto-runs envsubst on /etc/nginx/templates/*.template
# and outputs to /etc/nginx/conf.d/, then starts nginx
CMD ["nginx", "-g", "daemon off;"]
