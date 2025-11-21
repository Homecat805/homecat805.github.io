+++
date = '2025-11-21T12:25:08+08:00'
draft = false
title = 'ThinkPHP8 + Vue3 开发环境搭建'
weight = 1
[params]
    author = 'Homecat'
+++

ThinkPHP是一个免费开源的，快速、简单的面向对象的轻量级PHP开发框架，最新稳定版本是 v8.1.3；Vue 是性能出色、适用场景丰富的 Web 前端框架，最新稳定版本是 v3.5.24。 利用 Docker 搭建一个将 Thinkphp 作为后端、Vue 作为前端，前后端分离的开发环境。

<!--more-->

## 镜像选用

利用 Docker 搭建开发环境的好处是不受操作系统的限制，无论 Windows 还是 Linux 操作系统，只要安装好 Docker 就可以拥有相同的开发环境。在 Ubuntu 22.04 操作系统上安装 Docker 的方法，参看[Ubuntu 22.04 安装 Docker 容器引擎](https://genway.com.cn/document/docker/docker-install/)。

搭建 ThinkPHP8 + Vue3 开发环境需要用到以下镜像：

- php:8.0-apache 用于 Web 和 PHP 服务
- mysql:8.0 用于 Mysql 数据库服务
- adminer:5.4.1 数据库管理工具
- node:22.20 用于 Vue 服务

## 搭建准备

### 作业目录

```
test ─┬─ backend                  后端目录 用于安装 ThinkPHP
      ├─ frontend                 前端目录 用于安装 Vue
      ├─ php ─┬─ Dockerfile       用于重写 php:8.0-apache 镜像
      │       └─ 000-default.conf 用于重写 Web 根目录
      ├─ mysql ─ init.sql         数据库初始化文件
      ├─ .env                     建立数据库的环境变量 
      └─ docker-compose.yaml      用于生成容器
```

### 相关文件

- 容器生成文件 docker-compose.yaml 
  ```
  services:
    # PHP + Apache 服务
    web:
      build:
        context: ./php
        dockerfile: Dockerfile
      container_name: test_web
      volumes:
        - ./backend:/var/www/html
      ports:
        - "8000:80"
      depends_on:
        - db
      networks:
        - test_network

    # MySQL 服务
    db:
      image: mysql:8.0
      container_name: test_db
      environment:
        MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD} 
        MYSQL_DATABASE: ${DB_DATABASE} 
        MYSQL_USER: ${DB_USER} 
        MYSQL_PASSWORD: ${DB_PASSWORD} 
      volumes:
        - mysql_data:/var/lib/mysql
        - ./mysql/init.sql:/docker-entrypoint-initdb.d/init.sql
      ports:
        - "3306:3306"
      networks:
        - test_network

    # Adminer 数据库管理
    adminer:
      image: adminer:5.4.1
      container_name: test_adminer
      ports:
        - "8080:8080"
      depends_on:
        - db
      networks:
        - test_network

    # Node.js 服务 (用于 Vue 开发)
    node:
      image: node:22.20
      container_name: test_vue
      working_dir: /app
      volumes:
        - ./frontend:/app
      ports:
        - "80:5173"  # Vite 默认端口
      command: tail -f /dev/null  # 保持容器运行
      networks:
        - test_network

  volumes:
    mysql_data:

  networks:
    test_network:
      driver: bridge
  ```
- 生成容器时需要的数据库环境参数 .env
  ```
  DB_ROOT_PASSWORD=123456
  DB_DATABASE=test
  DB_USER=homecat
  DB_PASSWORD=680805
  ```
- 数据库初始化文件 /mysql/init.sql
  ```
  CREATE DATABASE IF NOT EXISTS `test` 
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  USE `test`;

  CREATE TABLE IF NOT EXISTS `user` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'User ID',
    `username` VARCHAR(50) NOT NULL UNIQUE COMMENT 'User Name',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Password Hash',
    `email` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Email',
    `email_verified` TINYINT(1) DEFAULT 0 COMMENT 'Email Verified:0-no,1-yes',
    `usertype` TINYINT(1) DEFAULT 0 COMMENT 'User Type:0-visitor,1-employee,2-admin',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT 'Avatar URL',
    `status` TINYINT(1) DEFAULT 1 COMMENT 'Account Status:0-disabled,1-enabled',
    `last_login` TIMESTAMP DEFAULT NULL COMMENT 'Last Login Time',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Account Create Time',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Account Update Time',
    PRIMARY KEY (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User Table';
  ```
- 重写 php:8.0-apache 镜像文件 /php/Dockerfile
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
  COPY 000-default.conf /etc/apache2/sites-available/000-default.conf

  # 修改文件权限
  RUN chown -R www-data:www-data /var/www/html \
      && chmod -R 755 /var/www/html

  EXPOSE 80
  ```
- 重写 web 服务根目录文件 /php/000-default.conf 
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

### 生成容器

使用 docker compose 命令生成容器。

```
cd test
docker compose up -d

... //无数安装信息

 ✔ test-web                   Built       0.0s 
 ✔ Network test_test_network  Created     0.3s 
 ✔ Volume test_mysql_data     Created     0.0s 
 ✔ Container test_db          Started     6.5s 
 ✔ Container test_vue         Started     6.8s 
 ✔ Container test_adminer     Started     6.9s 
 ✔ Container test_web         Started     6.7s   

```

查看生成的容器。

```
docker compose ps

NAME           IMAGE           COMMAND                  SERVICE   CREATED         STATUS         PORTS
test_adminer   adminer:5.4.1   "entrypoint.sh docke…"   adminer   4 minutes ago   Up 4 minutes   0.0.0.0:8080->8080/tcp, [::]:8080->8080/tcp
test_db        mysql:8.0       "docker-entrypoint.s…"   db        4 minutes ago   Up 4 minutes   0.0.0.0:3306->3306/tcp, [::]:3306->3306/tcp, 33060/tcp
test_vue       node:22.20      "docker-entrypoint.s…"   node      4 minutes ago   Up 4 minutes   0.0.0.0:80->5173/tcp, [::]:80->5173/tcp
test_web       test-web        "docker-php-entrypoi…"   web       4 minutes ago   Up 4 minutes   0.0.0.0:8000->80/tcp, [::]:8000->80/tcp
```

## 搭建 ThinkPHP8 环境

### 安装 ThinkPHP8

```
cd test
docker compose exec web composer create-project topthink/think . 

... //无数安装信息

Succeed!
4 packages you are using are looking for funding.
Use the `composer fund` command to find out more!
No security vulnerability advisories found.
```

### 修改目录属性

修改 /backend/runtime 目录属性，保证 ThinkPHP 正常运行。

```
cd test
sudo chmod 777 backend/runtime
```
### 修改环境参数

ThinkPHP 安装后会生成 .example.env 文件，复制该文件并命名为 .env 并修改文件内容，与 /test/.env 文件匹配。

```
APP_DEBUG = true

DB_TYPE = mysql
DB_HOST = db
DB_NAME = test
DB_USER = homecat
DB_PASS = 680805
DB_PORT = 3306
DB_CHARSET = utf8

DEFAULT_LANG = zh-cn
```

### 访问网站

安装成功后，可访问 Thinkphp 和 Mysql 网站。

- ThinkPHP [http://localhost:8000](http://localhost:8000)
- Mysql [http://localhost:8080](http://localhost:8080)

## 搭建 Vue3 环境

### 安装 Vue3

```
cd test
//更新 npm 到 11.6.2 版
docker compose exec node npm install -g npm@11.6.2 
// 安装 vue
docker compose exec node npm create vue@latest .

// 安装信息
> npx
> "create-vue" .

┌  Vue.js - The Progressive JavaScript Framework
│
◇  Package name:
│  app
│
◇  Select features to include in your project: (↑/↓ to navigate, space to select, a to toggle all, enter to confirm)
│  TypeScript // 选择 TypeScript
│
◇  Select experimental features to include in your project: (↑/↓ to navigate, space to select, a to toggle all, enter to confirm)
│  none // 放弃选择
│
◇  Skip all example code and start with a blank Vue project?
│  Yes // 放弃示例

Scaffolding project in /app...
│
└  Done. Now run:

   npm install
   npm run dev

| Optional: Initialize Git in your project directory with:
  
   git init && git add -A && git commit -m "initial commit"
```

### 安装插件

```
cd test
docker compose exec node npm install
```

### 配置服务

配置文件 /frontend/vite.config.ts

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
### 启动 vue 服务
```
cd test
docker compose exec node npm run dev
```

### 访问网站

- Vue [http://localhost](http://localhost)

## 总结

- 通过以上工作，ThinkPHP8 和 Vue3 开发环境基本搭建完成，搭建好的文件存放在 gitee.com 上，仓库地址为[tp8-vue3](https://gitee.com/homecat805/tp8-vue3-setup)。
- 可以通过以上步骤全新搭建，也可以直接克隆文件仓库，具体方法参看仓库的 README 文件。
- 在搭建过程中，会发生文件不能修改的问题，原因是 Docker 是以 root 运行的，而 /frontend/vite.config.ts 及 /backend/.example.env 等文件是由 root 生成的，非 root 用户不能修改。可以通过修改文件和目录所有者解决，具体的命令为：
  ```
  cd test
  sudo chown -R 你的用户名:你的用户组 frontend backend
  ```
