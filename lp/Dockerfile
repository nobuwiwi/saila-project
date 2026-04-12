FROM nginx:alpine

# Copy static files
COPY . /usr/share/nginx/html

# Replace default port 80 with Railway's $PORT environment variable in nginx config
CMD sed -i -e 's/listen  *80;/listen '${PORT:-80}';/' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
