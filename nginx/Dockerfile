FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Create templates directory for HTTP/HTTPS configs
RUN mkdir -p /etc/nginx/templates

# Copy both config templates
COPY http.conf /etc/nginx/templates/http.conf
COPY https.conf /etc/nginx/templates/https.conf

# Copy init script that selects the right config based on cert availability
COPY init-ssl.sh /docker-entrypoint.d/00-init-ssl.sh
RUN chmod +x /docker-entrypoint.d/00-init-ssl.sh

EXPOSE 80 443
