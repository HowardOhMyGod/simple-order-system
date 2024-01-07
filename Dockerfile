ARG NODE_VERSION=20.9.0
FROM node:${NODE_VERSION}-slim as base

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="test"

# Throw-away build stage to reduce size of final image
FROM base as build

# Install node modules
COPY --link package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy application code
COPY --link . .

RUN yarn build


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app/dist /app
COPY --link package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production


# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "node", "main.js" ]