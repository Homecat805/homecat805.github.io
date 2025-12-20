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


## 作业目录

```
project
  ├─ docker                       docker 相关文件目录
  │   ├─ apache
  │   │   └─ httpd.conf           vue 生产环境配置文件
  │   ├─ node
  │   │   └─ Dockerfile           node 镜像重写文件
  │   └─ php
  │       ├─ Dockerfile           php 镜像重写文件
  │       └─ 000-default.conf     php 配置文件
  ├─ tp8                          ThinkPHP 应用文件目录
  ├─ vue3                         Vue3 应用文件目录
  └ docker-compose.yaml           容器文件
```

## 相关文件

### Vue 生产环境配置文件

配置文件：docker/apache/httpd.conf 用于配置 vue3-prod 服务。

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
ProxyPass /api http://tp8:80
ProxyPassReverse /api http://tp8:80

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

### Node 重写镜像文件

镜像文件：docker/node/Dockerfile 用于重写 node:22.20 镜像，安装插件及工具。
```
FROM node:22.20

ENV DEBIAN_FRONTEND=noninteractive

# 换源
RUN sed -i 's|http://deb.debian.org/debian|http://mirrors.aliyun.com/debian|g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's|http://deb.debian.org/debian-security|http://mirrors.aliyun.com/debian-security|g' /etc/apt/sources.list.d/debian.sources

# 更新及安装
RUN apt-get update && \
    apt-get install -y xdg-utils && \
    apt-get upgrade -y && apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

# 6. 安装Node工具
RUN npm install -g npm@11.7.0 && npm install -g pnpm

WORKDIR /app
```

### PHP 镜像重写文件

镜像文件：docker/php/Dockerfile 用于重写 php:8.0-apache 镜像，安装插件及工具。
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
COPY ./docker/php/000-default.conf /etc/apache2/sites-available/000-default.conf

EXPOSE 80
```

### PHP 配置文件

配置文件：docker/php/000-default.conf 用户配置 tp8 服务。
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

### Docker 文件

容器文件：docker-compose.yaml 用于容器管理。
```
services:
  # PHP + Apache 服务名 tp8
  tp8:
    build:
      context: .   
      dockerfile: ./docker/php/Dockerfile
    image: php:8.0-apache-custom
    container_name: tp8-server
    volumes:
      - ./tp8:/var/www/html
    ports:
      - "8000:80"
    networks:
      - app_net

  # Vue 开发环境
  vue3-dev:
    build:
      context: .   
      dockerfile: ./docker/node/Dockerfile
    image: node:22.20-custom
    container_name: vue-dev-server
    working_dir: /app
    volumes:
      - ./vue3:/app
    ports:
      - "5173:5173"
    command: tail -f /dev/null
    # command: sh -c "pnpm install && pnpm dev"
    networks:
      - app_net
    profiles: ["dev"]

  # Vue 构建服务
  vue3-build:
    build:
      context: .   
      dockerfile: ./docker/node/Dockerfile
    image: node:22.20-custom
    container_name: vue-build-server
    working_dir: /app
    volumes:
      - ./vue3:/app
      - ./vue3/dist:/app/dist
    command: sh -c "pnpm install && pnpm build"
    networks:
      - app_net
    profiles: ["build"]

  # Apache 用于 Vue 生产服务
  vue3-prod:
    image: httpd:2.4
    container_name: vue-prod-server
    volumes:
      - ./vue3/dist:/usr/local/apache2/htdocs 
      - ./docker/apache/httpd.conf:/usr/local/apache2/conf/httpd.conf
    ports:
      - "80:80"
    networks:
      - app_net

networks:
  app_net:
    driver: bridge
```

## 搭建步骤

### 启动容器
```
cd project
docker compose --profile dev up

[+] Running 6/6
 ✔ node:22.20-custom          Built  
 ✔ php:8.0-apache-custom      Built   
 ✔ Network mytest_app_net     Created
 ✔ Container tp8-server       Created
 ✔ Container vue-dev-server   Created
 ✔ Container vue-prod-server  Created
...

```
> 启动之后，保持容器运行，另外新开一个终端，在新的终端里执行以下步骤。   

- 查看容器
```
cd project
docker compose ps

NAME              IMAGE                   COMMAND                  SERVICE     CREATED         STATUS         PORTS
tp8-server        php:8.0-apache-custom   "docker-php-entrypoi…"   tp8         3 minutes ago   Up 3 minutes   0.0.0.0:8000->80/tcp, [::]:8000->80/tcp
vue-dev-server    node:22.20-custom       "docker-entrypoint.s…"   vue3-dev    3 minutes ago   Up 3 minutes   0.0.0.0:5173->5173/tcp, [::]:5173->5173/tcp
vue-prod-server   httpd:2.4               "httpd-foreground"       vue3-prod   3 minutes ago   Up 3 minutes   0.0.0.0:80->80/tcp, [::]:80->80/tcp
```

- 安装 ThinkPHP
```
cd project
docker compose exec tp8 bash
root@a0f20d842dd2:/var/www/html# composer create-project topthink/think . 

Creating a "topthink/think" project at "./"
Installing topthink/think (v8.1.3)
  - Downloading topthink/think (v8.1.3)
  - Installing topthink/think (v8.1.3): Extracting archive

...

14 package suggestions were added by new dependencies, use `composer suggest` to see details.
Generating autoload files
> @php think service:discover
Succeed!
> @php think vendor:publish
File /var/www/html/config/trace.php exist!
Succeed!

root@a0f20d842dd2:/var/www/html# exit
```

- 安装 Vue
```
cd project
docker compose exec vue3-dev bash
root@25773b67f169:/app# pnpm create vue@latest .

...
┌  Vue.js - The Progressive JavaScript Framework
◇  Current directory is not empty. Remove existing files and continue
│  Yes
◇  Package name:
│  app
◇  Select features to include in your project: (↑/↓ to navigate, space to select, a to toggle all, enter to confirm)
│  TypeScript
◇  Select experimental features to include in your project: (↑/↓ to navigate, space to select, a to toggle all, enter to confirm)
│  none
◇  Skip all example code and start with a blank Vue project?
│  Yes
Scaffolding project in /app...
└  Done. Now run:

  pnpm install
  pnpm dev
...

root@25773b67f169:/app# pnpm install

...
dependencies:
+ vue 3.5.26

devDependencies:
+ @tsconfig/node24 24.0.3
+ @types/node 24.10.4 (25.0.3 is available)
+ @vitejs/plugin-vue 6.0.3
+ @vue/tsconfig 0.8.1
+ npm-run-all2 8.0.4
+ typescript 5.9.3
+ vite 7.3.0
+ vite-plugin-vue-devtools 8.0.5
+ vue-tsc 3.1.8

╭ Warning ───────────────────────────────────────────────────────────────────────────────────╮
│                                                                                            │
│   Ignored build scripts: esbuild@0.27.2.                                                   │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.   │
│                                                                                            │
╰────────────────────────────────────────────────────────────────────────────────────────────╯
Done in 48.9s using pnpm v10.26.0
...

root@25773b67f169:/app# pnpm approve-builds

...
✔ Choose which packages to build (Press <space> to select, <a> to toggle all, <i> to invert selection) · esbuild
✔ The next packages will now be built: esbuild.
Do you approve? (y/N) · true
node_modules/.pnpm/esbuild@0.27.2/node_modules/esbuild: Running postinstall script, done in 85ms
...

root@25773b67f169:/app# exit

```
### 关闭容器

```
cd project
docker compose --profile dev down
```

## 修改及配置

### 修改目录拥有人
```
cd project
sudo chown -R $(id -u):$(id -g) tp8 vue3
```
### 修改 tp8 子目录属性
```
cd project
sudo chmod 777 tp8/runtime
```
### vue3 访问配置
配置文件: project/vue3/vite.config.ts
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

## 使用

### 修改文件

将 docker-compose.yaml 文件中
```
services:
  ...
  vue-dev:
    ...
    command: tail -f /dev/null
    # command: sh -c "pnpm install && pnpm dev"
    ...
```
修改为
```
services:
  ...
  vue-dev:
    ...
    # command: tail -f /dev/null
    command: sh -c "pnpm install && pnpm dev"
    ...
```


### 命令
```
cd project
docker compose --profile dev up    进入开发环境
docker compose --profile dev down  退出开发环境
docker compose --profile build up  生产环境重构
```

### 访问

- 开发环境网站： http://localhost:5173
- 生产环境网站： http://localhost
- vue3 容器内访问 tp8 网站： http://tp8:80
- 开发时临时访问 tp8 后台： http://localhost:8000 正常生产时应关闭端口禁止访问。 



