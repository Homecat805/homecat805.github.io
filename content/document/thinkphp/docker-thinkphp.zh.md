+++
date = '2025-10-15T01:51:32Z'
draft = false
title = '利用 Docker 搭建 Thinkphp8 开发平台'
weight = 1
[params]
    author = 'Homecat'
+++

ThinkPHP 是一个免费开源的，快速、简单的面向对象的轻量级PHP开发框架，是为了敏捷 WEB 应用开发和简化企业应用开发而诞生的。本文记录了利用 Docker 技术搭建 Thikphp8 开发平台的具体过程。

<!--more-->

## 搭建目标

开发平台有以下几个服务构成：
- Apache：Apache 是 Web 服务器端软件，因其跨平台和安全性被广泛使用。
- PHP：PHP 是 ThinkPHP 需要的 PHP 开发环境。 
- Mysql：Mysql 是常用的开源数据库。
- Adminer： Adminer 是 Mysql 数据库的管理工具。

## 镜像选用

使用三个镜像：
- php:8.0-apache 是 PHP 8.0 版 和 Apache 2.4 版的集成镜像。
- mysql:8.0 是 Mysql 8.4 版镜像。  
- adminer:5.4.0 是 Adminer 5.4 版镜像。

拉取镜像命令：
```
docker pull php:8.0-apache
docker pull mysql:8.0
docker pull adminer:5.4.0
```

## 工作目录及相关文件

```
thinkphp  项目根目录
├─ src    ThinkPHP 目录
├─ Dockerfile  用于完善 php:8.0-apache 镜像，生成 php:8.0-apache-pro 镜像
└─ docker-compose.yaml  用于生成容器
```

Dockerfile 文件
```
\# 使用 php:8.0-apache 作为基础镜像
FROM php:8.0-apache

\# 安装系统依赖
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    default-mysql-client

\# 清除缓存
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

\# 安装 PHP 扩展
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

\# 启用 Apache 的 rewrite 模块用于 URL 重写
RUN a2enmod rewrite

\# 安装 Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

\# 设置 Apache 文档根目录
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

WORKDIR /var/www/html
```

docker-compose.yaml 文件
```
services:
  app:
    image: php:8.0-apache-pro
    container_name: tp-php-apache
    ports:
      - "80:80"
    volumes:
      - ./src:/var/www/html
    depends_on:
      - mysql
    networks:
      - tp_network
    restart: unless-stopped

  \# MySQL 数据库服务
  mysql:
    image: mysql:8.0
    container_name: tp-mysql
    command: --default-authentication-plugin=mysql_native_password
    environment:
      MYSQL_ROOT_PASSWORD: 123456
      MYSQL_DATABASE: tp8
      MYSQL_USER: homecat
      MYSQL_PASSWORD: 680805
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    networks:
      - tp_network
    restart: unless-stopped

  \# Adminer 数据库管理工具
  adminer:
    image: adminer:5.4.0
    container_name: tp-adminer
    ports:
      - "8080:8080"
    environment:
      ADMINER_DEFAULT_SERVER: mysql
    depends_on:
      - mysql
    networks:
      - tp_network
    restart: unless-stopped


volumes:
  mysql_data:

networks:
  tp_network:
    driver: bridge
```
## 启动容器

```
cd thinkphp
docker build -t php:8.0-apache-pro .
docker compose up -d
```

## 项目初始化

进入 tp-php-apache 容器

```
docker exec -it tp-php-apache bash

```

在容器内创建 ThinkPHP 开发项目

```
\# 安装 ThinkPHP
composer create-project topthink/think .
\# 使用 thinkTemplate 模板引擎
composer require topthink/think-view

```