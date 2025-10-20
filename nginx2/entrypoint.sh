#!/bin/sh
# Replace environment variables in the Nginx template
envsubst '${NGINX_PORT},${SERVER_HOST},${FRONTEND_HOST},${FRONTEND_PORT},${SERVER_PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
# Start Nginx in the foreground
nginx -g 'daemon off;'