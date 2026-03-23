#!/bin/bash

# Domain and email configuration
domains=(rentily.rent www.rentily.rent)
email="admin@rentily.rent"  # Change this
staging=0  # Set to 1 for testing

# Create directories
mkdir -p certbot/conf
mkdir -p certbot/www
mkdir -p nginx/conf.d

# Download TLS parameters
if [ ! -e "certbot/conf/options-ssl-nginx.conf" ]; then
  echo "Downloading recommended TLS parameters..."
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > certbot/conf/options-ssl-nginx.conf
fi

if [ ! -e "certbot/conf/ssl-dhparams.pem" ]; then
  echo "Downloading recommended DH parameters..."
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > certbot/conf/ssl-dhparams.pem
fi

# Create dummy certificate for nginx startup
echo "Creating dummy certificate for $domains..."
path="/etc/letsencrypt/live/${domains[0]}"
mkdir -p "certbot/conf/live/${domains[0]}"
docker-compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:4096 -days 1\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot

# Start nginx
echo "Starting nginx..."
docker-compose up -d nginx

# Delete dummy certificate
echo "Deleting dummy certificate..."
docker-compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/${domains[0]} && \
  rm -Rf /etc/letsencrypt/archive/${domains[0]} && \
  rm -Rf /etc/letsencrypt/renewal/${domains[0]}.conf" certbot

# Request real certificate
echo "Requesting Let's Encrypt certificate..."
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Select appropriate email arg
case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

# Enable staging mode if needed
if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal" certbot

# Reload nginx
echo "Reloading nginx..."
docker-compose exec nginx nginx -s reload

echo "Done!"
