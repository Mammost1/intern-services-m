server {
    listen 80;

    server_name devapi.ketshoptest.com;

    {{apps_nginx}}

    location / {
        proxy_pass      http://192.168.1.170:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
	    proxy_set_header   X-Real-IP          $remote_addr;
	    proxy_set_header   X-Forwarded-Proto  $scheme;
	    proxy_set_header   X-Forwarded-For    $proxy_add_x_forwarded_for;
        proxy_set_header  X-Real-IP $remote_addr;
        proxy_set_header  X-Forwarded-For $remote_addr;
        proxy_set_header  X-Forwarded-Host $remote_addr;
    }

}