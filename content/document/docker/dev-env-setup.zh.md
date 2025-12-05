+++
date = '2025-12-04T12:06:31+08:00'
draft = false
title = 'ThinkPHP8 + Vue3 开发环境的搭建'
weight = 1
[params]
    author = 'Homecat'
+++

ThinkPHP 是一个免费开源的，快速、简单的面向对象的轻量级 PHP 开发框架，最新稳定版本是 v8.1.3；Vue 是性能出色、适用场景丰富的 Web 前端框架，最新稳定版本是 v3.5.24。 利用 Docker 搭建一个将 Thinkphp 作为后端、Vue 作为前端，前后端分离的开发环境。

<!--more-->

## 整体设想

- 利用 dacker 容器引擎作为搭建工具。
- 数据库使用 MySQL 8.0 版，独立安装，开放 3306 端口；ThinkPHP 通过数据库配置跨域连接。
- ThinkPHP 和 Vue 作为后端和前端同时安装在 Docker 的同一个 network 里，两者之间的数据通信通过 ThinkPHP 中间件和 Vue 的插件 axios 实现跨域连接。



## ThinkPHP 和 Vue 作业环境搭建

### 作业目录

```
test ┬ backend ┬ php ┬ Dockerfile        重写 php:8.0-apache 镜像
     │         │     └ 000-default.conf  php:8.0-apache 配置文件
     │         └ thinkphp                后端目录 安装 ThinkPHP
     ├ frontend ┬ apache - httpd.conf     apache 配置文件 
     │          └ vue                    前端目录 安装 Vue
     └ docker-compose.yaml               生成容器 docker compose 文件
```

### 相关文件

- Docker Compose 文件：docker-compose.yaml
  ```
  services:
    # PHP + Apache 服务
    php-apache:
      build:
        context: .   
        dockerfile: ./backend/php/Dockerfile
      image: php:8.0-apache-custom
      container_name: php-apache-server
      volumes:
        - ./backend/thinkphp:/var/www/html
      ports:
        - "8000:80"
      networks:
        - app_net

    # Vue 开发环境
    vue-dev:
      image: node:22.20
      container_name: vue-dev-server
      working_dir: /app
      volumes:
        - ./frontend/vue:/app
      ports:
        - "5173:5173"
      command: tail -f /dev/null
      # command: sh -c "npm install && npm run dev"

      networks:
        - app_net
      profiles: ["dev"]

    # Vue 构建服务
    vue-build:
      image: node:22.20
      container_name: vue-builder
      working_dir: /app
      volumes:
        - ./frontend/vue:/app
        - ./frontend/vue/dist:/app/dist
      command: sh -c "npm install && npm run build"
      networks:
        - app_net
      profiles: ["build"]

    # Apache 用于 Vue 生产服务
    vue-prod:
      image: httpd:2.4
      container_name: vue-prod-server
      volumes:
        - ./frontend/vue/dist:/usr/local/apache2/htdocs 
        - ./frontend/apache/httpd.conf:/usr/local/apache2/conf/httpd.conf
      ports:
        - "80:80"
      networks:
        - app_net

  networks:
    app_net:
      driver: bridge
  ```

- 重写 php:8.0-apache 镜像文件：Dockerfile
  ```
  FROM php:8.0-apache

  # 备份原有的源列表，并更换为阿里云镜像源
  RUN cp /etc/apt/sources.list /etc/apt/sources.list.bak && \
      sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list

  # 安装系统依赖
  RUN apt-get update && apt-get install -y \
      curl \
      libpng-dev \
      libonig-dev \
      libxml2-dev \
      zip \
      unzip \
      libzip-dev \
      default-mysql-client

  # 安装 PHP 扩展
  RUN docker-php-ext-install \
      mysqli \
      pdo_mysql \
      mbstring \
      exif \
      pcntl \
      bcmath \
      gd \
      zip \
      sockets


  # 安装 Composer
  COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

  # 启用 Apache mod_rewrite
  RUN a2enmod rewrite

  # 设置工作目录
  WORKDIR /var/www/html

  # 复制 Apache 配置
  COPY ./backend/php/000-default.conf /etc/apache2/sites-available/000-default.conf

  EXPOSE 80
  ```

- php:8.0-apache 配置文件
  ```
  <VirtualHost *:80>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html/public

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined

    <Directory /var/www/html/public>
      Options Indexes FollowSymLinks
      AllowOverride All
      Require all granted
    </Directory>
  </VirtualHost>
  ```

- apache 配置文件 
  ```
  ServerRoot "/usr/local/apache2"
  Listen 80

  LoadModule mpm_event_module modules/mod_mpm_event.so
  LoadModule authn_file_module modules/mod_authn_file.so
  LoadModule authn_core_module modules/mod_authn_core.so
  LoadModule authz_host_module modules/mod_authz_host.so
  LoadModule authz_groupfile_module modules/mod_authz_groupfile.so
  LoadModule authz_user_module modules/mod_authz_user.so
  LoadModule authz_core_module modules/mod_authz_core.so
  LoadModule access_compat_module modules/mod_access_compat.so
  LoadModule auth_basic_module modules/mod_auth_basic.so
  LoadModule reqtimeout_module modules/mod_reqtimeout.so
  LoadModule filter_module modules/mod_filter.so
  LoadModule mime_module modules/mod_mime.so
  LoadModule log_config_module modules/mod_log_config.so
  LoadModule env_module modules/mod_env.so
  LoadModule headers_module modules/mod_headers.so
  LoadModule setenvif_module modules/mod_setenvif.so
  LoadModule version_module modules/mod_version.so
  LoadModule unixd_module modules/mod_unixd.so
  LoadModule status_module modules/mod_status.so
  LoadModule autoindex_module modules/mod_autoindex.so
  LoadModule dir_module modules/mod_dir.so
  LoadModule alias_module modules/mod_alias.so
  LoadModule rewrite_module modules/mod_rewrite.so
  LoadModule proxy_module modules/mod_proxy.so
  LoadModule proxy_http_module modules/mod_proxy_http.so

  <IfModule unixd_module>
    User daemon
    Group daemon
  </IfModule>

  ServerAdmin you@example.com
  ServerName localhost

  <Directory />
    AllowOverride none
    Require all denied
  </Directory>

  DocumentRoot "/usr/local/apache2/htdocs"
  <Directory "/usr/local/apache2/htdocs">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
    
    # Vue Router history 模式支持
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
  </Directory>

  <IfModule dir_module>
    DirectoryIndex index.html
  </IfModule>

  <Files ".ht*">
    Require all denied
  </Files>

  # API 代理配置 - 将 /api 请求转发到后端
  ProxyPass /api http://php-apache:80
  ProxyPassReverse /api http://php-apache:80

  ErrorLog /proc/self/fd/2
  LogLevel warn

  <IfModule log_config_module>
    LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\"" combined
    LogFormat "%h %l %u %t \"%r\" %>s %b" common
    <IfModule logio_module>
      LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\" %I %O" combinedio
    </IfModule>
    CustomLog /proc/self/fd/1 common
  </IfModule>

  <IfModule mime_module>
    TypesConfig conf/mime.types
    AddType application/x-compress .Z
    AddType application/x-gzip .gz .tgz
  </IfModule>
  ```
fb7bed3c0776
### 搭建步骤

- 生成 php-apache 容器并安装 ThinkPHP8
  ```
  ~$ cd test
  ~/test$ docker compose up php-apache -d

  [+] Running 1/1
  ✔ Container php-apache-server  Started        0.8s 

  ~/test$ docker compose exec php-apache composer create-project topthink/think .

  Creating a "topthink/think" project at "./"
  Installing topthink/think (v8.1.3)
  ...
  14 package suggestions were added by new dependencies, use composer suggest to see details.
  Generating autoload files
  @php think service:discover
  Succeed!
  @php think vendor:publish
  File /var/www/html/config/trace.php exist!
  Succeed!
  ...
  
  ~/test$ sudo chown -R 用户uid:用户gid backend/thinkphp
  ~/test$ sudo chmod 777 backend/thinkphp/runtime
  ```

- 生成 vue-dev 容器并安装 Vue3 及插件 vue-router, pinia 和 axios
  ```
  ~/test$ docker compose --profile dev up  vue-dev -d
  ~/test$ docker compose exec vue-dev npm create vue@latest

  > npx
  > create-vue .

  ┌  Vue.js - The Progressive JavaScript Framework
  │
  ◇  Current directory is not empty. Remove existing files and continue
  │  Yes
  │
  ◇  Package name:
  │  app
  │
  ◇  Select features to include in your project: (↑/↓ to navigate, space to select, a to toggle all, enter to confirm)
  │  TypeScript
  │
  ◇  Select experimental features to include in your project: (↑/↓ to navigate, space to select, a to toggle all, enter to confirm)
  │  none
  │
  ◇  Skip all example code and start with a blank Vue project?
  │  Yes

  Scaffolding project in /app...
  │
  └  Done. Now run:
    npm install
    npm run dev
  | Optional: Initialize Git in your project directory with:
    git init && git add -A && git commit -m "initial commit"


  ~/test$ docker compose exec vue-dev npm install vue-router@4

  added 154 packages, and audited 155 packages in 1m
  ...

  ~/test$ docker compose exec vue-dev npm install axios

  added 24 packages, and audited 179 packages in 7s
  ...

  ~/test$ docker compose exec vue-dev npm install pinia
  added 5 packages, and audited 184 packages in 2s
  ...

    ~/test$ sudo chown -R 用户uid:用户gid frontend/vue
  ```
### 配置 ThinkPHP 访问 MySQL backend/thinkphp/.env

- 复制环境文件
```
cd backend/thinkphp
cp .example.env
```

- 修改 .env 文件
```
APP_DEBUG = true    //是否开启报错

DB_TYPE = mysql     //数据库类别
DB_HOST = 127.0.0.1 // MySQL 服务器地址
DB_NAME = test      // 数据库名
DB_USER = username  // 用户名
DB_PASS = password  // 用户密码
DB_PORT = 3306      // 服务器端口
DB_CHARSET = utf8   // 数据库字符定义

DEFAULT_LANG = zh-cn
```

### 配置 Vue 访问限制

- 修改 vue 配置文件 vue/vite.config.ts
  ```
  export default defineConfig({
  ...
    server: {
      host: '0.0.0.0',  // 允许所有IP访问
      port: 5173
    },
    ...
  })
  ```

### 配置 ThinkPHP 与 Vue 跨域通信

- 新增 ThinkPHP 中间件 thinkphp/app/middleware/Cors.php
  ```
  <?php
  namespace app\middleware;
  class Cors
  {
      public function handle($request, \Closure $next)
      {
          header('Access-Control-Allow-Origin: *');
          header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
          header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
          header('Access-Control-Allow-Credentials: true');
          if ($request->method() == 'OPTIONS') {
              return response();
          }
          return $next($request);
      }
  }
  ```

- 注册 Cors.php 中间件 thinkphp/app/middleware.php
  ```
  <?php
  // 全局中间件定义文件
  return [
    ...
    \app\middleware\Cors::class,
    ...
  ];

  ```
  
- 修改 vue 配置文件 vue/vite.config.ts
  ```
  export default defineConfig({
    ...
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://php-apache:80',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    ...
  })
  ```

  ## 启动容器

  ### 修改 docker-compose.yaml 文件
  将
  ```
  services:
    ...
    vue-dev:
      ...
      command: tail -f /dev/null
      # command: sh -c "npm install && npm run dev"
      ...
    ...
  ```
  修改为：
  ```
  services:
    ...
    vue-dev:
      ...
      # command: tail -f /dev/null
      command: sh -c "npm install && npm run dev"
      ...
    ...
  ```

  ### 启动开发环境
  ```
  ~/test$ docker compose --profile dev up

  [+] Running 4/4
  ✔ Network newtest_app_net      Created            0.2s 
  ✔ Container vue-dev-server     Created            1.3s 
  ✔ Container vue-prod-server    Created            1.3s 
  ✔ Container php-apache-server  Created            1.3s 

  ...

  vue-dev-server     |   ➜  Local:   http://localhost:5173/
  vue-dev-server     |   ➜  Network: http://172.18.0.3:5173/
  vue-dev-server     |   ➜  Vue DevTools: Open http://localhost:5173/__devtools__/ as a separate window
  vue-dev-server     |   ➜  Vue DevTools: Press Alt(⌥)+Shift(⇧)+D in App to toggle the Vue DevTools

  ```


