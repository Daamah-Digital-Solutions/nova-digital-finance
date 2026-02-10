#!/bin/sh

CERT_DIR="/etc/letsencrypt/live/novadf.com"

if [ -f "$CERT_DIR/fullchain.pem" ] && [ -f "$CERT_DIR/privkey.pem" ]; then
    echo "SSL certificates found. Enabling HTTPS configuration."
    cp /etc/nginx/templates/https.conf /etc/nginx/conf.d/default.conf
else
    echo "No SSL certificates found. Using HTTP-only configuration."
    echo "Run certbot to obtain certificates, then restart this container."
    cp /etc/nginx/templates/http.conf /etc/nginx/conf.d/default.conf
fi
