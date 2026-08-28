FROM caddy:2-alpine
COPY . /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 8080
