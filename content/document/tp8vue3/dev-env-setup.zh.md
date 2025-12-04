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

## MySQL 数据库搭建

### 作业目录

```
db ┬ mysql ┬ conf ─ my-custom.cnf  数据库配置文件
   │       └ init ─ index.sql      数据库初始化文件 
   ├ .env                          建立数据库的环境变量 
   └ docker-compose.yaml           用于生成容器的 Docker Compose 文件
```

### 相关文件

- Docker Compose 文件：docker-compose.yaml
	```
  services:
    mysql:
      image: mysql:8.0
      container_name: mysql-server
      environment:
        MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD} 
        MYSQL_DATABASE: ${MYSQL_DATABASE} 
        MYSQL_USER: ${MYSQL_USER} 
        MYSQL_PASSWORD: ${MYSQL_PASSWORD} 
      volumes:
        - mysql_data:/var/lib/mysql
        - ./mysql/init.sql:/docker-entrypoint-initdb.d/init.sql
        - ./mysql/conf:/etc/mysql/conf.d
      ports:
        - "3306:3306"
      networks:
        - db_net
      command: 
        - --default-authentication-plugin=mysql_native_password
        - --character-set-server=utf8mb4
        - --collation-server=utf8mb4_unicode_ci
      restart: unless-stopped
      healthcheck:
        test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
        interval: 10s
        timeout: 5s
        retries: 5
        start_period: 60s 
    
    adminer:
      image: adminer:5.4.1
      container_name: mysql-adminer
      environment:
        ADMINER_DEFAULT_SERVER: mysql
        ADMINER_DEFAULT_DB: test
      ports:
        - "8080:8080"
      depends_on:
        mysql:
          condition: service_healthy
      networks:
        - db_net
        
  volumes:
    mysql_data:

  networks:
    db_net:
      driver: bridge
	```

- 环境变量文件：.env
	```
	MYSQL_ROOT_PASSWORD = 数据库 root 密码
	MYSQL_DATABASE = 数据库名
	MYSQL_USER = 用户名
	MYSQL_PASSWORD = 用户密码
	```

- 数据库初始化文件：index.sql
	```
	CREATE DATABASE IF NOT EXISTS `test` 
	DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

	USE `test`;

  DROP TABLE IF EXISTS `user`;
  CREATE TABLE `user` (
      `user_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'User ID',
      `user_name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Username',
      `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Email',
      `password` varchar(255) NOT NULL COMMENT 'Password',
      `token` varchar(100) DEFAULT '' COMMENT 'Session Identifier',
      `user_status` tinyint(1) DEFAULT '0' COMMENT 'User Status',
      `user_type` tinyint(1) DEFAULT '0' COMMENT 'User Type',
      `last_login` datetime DEFAULT NULL COMMENT 'Last Login Time',
      `created_at` datetime DEFAULT NULL COMMENT 'Account Create Time',
      `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT 'Account Update Time',
      `deleted_at` datetime DEFAULT NULL COMMENT 'Account Delete Time',
      PRIMARY KEY (`user_id`),
      UNIQUE KEY `user_name` (`user_name`),
      UNIQUE KEY `email` (`email`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User Table';
	```

- 数据库配置文件：my-custom.cnf
	```
	[mysqld]
	bind-address = 0.0.0.0  //不限制访问地址 
	default-time-zone = '+8:00' //设置东八区时间
	```

### 生成容器

```
cd db
docker compose up -d
[+] Running 4/4
 ✔ Network cloud-db_db_net     Created                                     0.1s 
 ✔ Volume cloud-db_mysql_data  Created                                     0.0s 
 ✔ Container mysql-server      Healthy                                    21.2s 
 ✔ Container mysql-adminer     Started                                    21.6s 
```
### 访问

- 容器中安装了 MySQL 的管理工具 Adminer，开放了 8080 端口，可以通过 IP:8080 地址访问。
- 同时可以通过 MySQL 客户端使用 MySQL 命令访问，开放了 3306 端口。

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
      command: sh -c "npm install && npm run dev"
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
  ~/test$ docker compose --profile dev up vue-dev 
  docker compose exec vue-dev npm create vue@latest

  docker compose exec vue-dev npm install vue-router@4
  docker compose exec vue-dev npm install axios
  docker compose exec vue-dev npm install pinia
  ```

### 配置 Vue 访问限制

- 修改 vue 配置文件 vue/vite.config.ts
  ```
  ```

### 配置 ThinkPHP 与 Vue 跨域通信

- 新增 ThinkPHP 中间件 thinkphp/app/middleware/Cors.php
  ```
  ```

- 注册 Cors.php 中间件 thinkphp/app/config/middleware.php
  ```
  ```
  
- 修改 vue 配置文件 vue/vite.config.ts
  ```
  ```
