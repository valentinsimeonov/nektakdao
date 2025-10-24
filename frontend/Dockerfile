# Use node base image - Frontend -
FROM node:18-alpine AS base

# Install necessary packages
RUN apk add --no-cache curl

# Create app directory
WORKDIR /app

# # Optionally, if you need to change the UID and GID of the 'node' user to match your host
# ARG USER_UID=1000
# ARG USER_GID=1000

# # Adjust the node user's UID and GID, and change ownership of relevant directories
# RUN apk --no-cache add shadow && \
#     usermod -u $USER_UID node && \
#     groupmod -g $USER_GID node && \
#     chown -R node:node /app

# USER node

# Copy package.json and related files and run npm install as 'node' user
# COPY --chown=node:node package*.json .npmrc* ./
COPY package*.json .npmrc* ./
# COPY package*.json ./
# Run npm install and redirect output to a log file
# RUN npm install > npm_install_log.txt 2>&1

# Print the contents of the npm install log file to check for errors
# RUN cat npm_install_log.txt
RUN npm install

# COPY --chown=node:node start-dev.sh /app/start-dev.sh
# RUN chmod +x /app/start-dev.sh
COPY start-dev.sh /app/start-dev.sh
RUN chmod +x /app/start-dev.sh







# For development build
FROM base AS development

# Copy application source with appropriate ownership
# COPY --chown=node:node . .
COPY . .
# COPY --chown=node:node . .

RUN npm run build

# RUN chmod -R 755 /app/node_modules /app/.next \
#     && find /app/.next -type d -exec chmod 755 {} \; \
#     && find /app/node_modules -type d -exec chmod 755 {} \; \
#     && find /app/node_modules -type f -exec chmod 644 {} \; \
#     && find /app/.next -type f -exec chmod 644 {} \;

RUN sh -c 'ls -la /app/node_modules'
RUN sh -c 'ls -la /app/.next'

# Entrypoint command
# CMD ["/app/start-dev.sh"]

CMD ["npm", "run", "dev"]
# Entrypoint command to execute the wrapper script
# CMD ["/bin/sh", "-c", "/app/start-dev.sh"]







# For production build
FROM base AS production

COPY . .

RUN npm run build

CMD ["npm", "run", "start"]
