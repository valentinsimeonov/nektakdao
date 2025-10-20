# Nginx Dockerfile
FROM nginx:1.18.0-alpine
WORKDIR /etc/nginx/templates
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]