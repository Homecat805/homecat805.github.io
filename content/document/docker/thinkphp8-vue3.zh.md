+++
date = '2025-11-13T10:52:42+08:00'
draft = false
title = '利用 Docker 搭建 Thinkphp8-Vue3 开发环境'
weight = 1
[params]
    author = 'Homecat'
+++

ThinkPHP是一个免费开源的，快速、简单的面向对象的轻量级PHP开发框架，最新稳定版本是 v8.1.3；Vue 是性能出色、适用场景丰富的 Web 前端框架，最新稳定版本是 v3.5.24。 利用 Docker 搭建一个将 Thinkphp 作为后端、Vue 作为前端，前后端分离的开发环境。

<!--more-->

## 镜像选用

- php:8.0-apache 用于 Web 服务和 PHP 服务
- mysql:8.0 用于 Mysql 数据库服务
- adminer:5.4.1 数据库管理工具 
- node:22.20 用于 Vue 服务

## 搭建环境

### 作业目录

```
Porject ─┬─ backend                  后端目录 用于安装 ThinkPHP
         ├─ frontend                 前端目录 用于安装 Vue
         ├─ php ─┬─ Dockerfile       用于重写 php:8.0-apache 镜像
         │       └─ 000-default.conf 用于重写 Web 根目录
         ├─ mysql ─ init.sql         数据库初始化文件
         ├─ .env                     建立数据库的环境变量 
         └─ docker-compose.yaml      用于生成容器
```

### 相关文件

- ./php/Dockerfile 
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

- ./php/000-default.conf
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

- ./mysql/init.sql 
```
-- 创建测试数据库
CREATE DATABASE IF NOT EXISTS test;
USE test;

-- 创建示例表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入测试数据
INSERT IGNORE INTO users (name, email) VALUES
('User1', 'user1@example.com'),
('User2', 'user2@example.com');
```

- ./.env
```
DB_ROOT_PASSWORD=根用户密码
DB_DATABASE=数据库名
DB_USER=用户名
DB_PASSWORD=用户密码
```

- ./docker-compose.yaml
```
services:
  # PHP + Apache 服务
  php-apache:
    build:
      context: ./php
      dockerfile: Dockerfile
    container_name: test_web
    volumes:
      - ./backend:/var/www/html
    ports:
      - "80:80"
    depends_on:
      - mysql
    networks:
      - test_network

  # MySQL 服务
  mysql:
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
      - mysql
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
      - "5173:5173"  # Vite 默认端口
    command: tail -f /dev/null  # 保持容器运行
    networks:
      - test_network

volumes:
  mysql_data:

networks:
  test_network:
    driver: bridge
```

### 生成容器

```
cd Project
docker compose up -d
```

## 搭建 ThinkPHP 作业环境 

### 进入运行 php-apache 服务的容器
```
docker compose exec php-apache bash
```

### 安装 ThinkPHP
```
root@e0adfedefbe8:/var/www/html# composer create-project topthink/think . 
root@e0adfedefbe8:/var/www/html# chmod 777 runtime      //调整 runtime 目录属性
root@e0adfedefbe8:/var/www/html# exit      //退出容器
```

### 访问 ThinkPHP 和 Mysql

- [ThinkPHP](http://localhost)
- [Mysql 数据库](http://localhost:8080)

## 搭建 Vue 作业环境

### 进入运行 node 服务的容器
```
docker compose exec node bash
```

### 安装 Vue
```
root@019cd9a07351:/app# npm create vue@latest .
root@019cd9a07351:/app# npm install
root@019cd9a07351:/app# exit      //退出容器   
```

### 运行开发环境

```
docker compose exec node npm run dev
```
### 访问 Vue

- [Vue](http://localhost:5173)