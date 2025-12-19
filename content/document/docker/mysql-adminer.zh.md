+++
date = '2025-12-05T10:04:25+08:00'
draft = false
title = 'Mysql 和 Adminer 作业环境搭建'
weight = 1
[params]
    author = 'Homecat'
+++

利用 Docker 搭建 Mysql + Adminer 作业环境，

<!--more-->

## 作业目录

```
project
  ├─ mysql 
  │   ├─ conf
  │   │   └─ my-custom.cnf  配置文件
  │   └─ data               数据文件目录
  ├─ .env                   环境变量 
  └─ docker-compose.yaml    容器文件
```

## 相关文件

### docker-compose.yaml
```
services:
  db-server:
    image: mysql:8.0
    container_name: mysql-server
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_DATABASE}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./mysql/data:/var/lib/mysql
      - ./mysql/conf:/etc/mysql/conf.d
    ports:
      - "3306:3306"
    networks:
      - db_net
    command:
      - --default-authentication-plugin=caching_sha2_password
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 60s
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'

  db-adminer:
    image: adminer:5.4.1
    container_name: mysql-adminer
    environment:
      ADMINER_DEFAULT_SERVER: db-server
      ADMINER_DEFAULT_DB: ${DB_DATABASE}
    ports:
      - "8080:8080"
    depends_on:
      db-server:
        condition: service_healthy
    networks:
      - db_net

networks:
  db_net:
    driver: bridge
```

### 环境变量 .env

```
DB_ROOT_PASSWORD = 数据库 root 密码
DB_DATABASE = 数据库名
DB_USER = 用户名
DB_PASSWORD = 用户密码
```

### 数据库配置文件 mysql/cond/my-custom.cnf
```
[mysqld]
bind-address = 0.0.0.0  //不限制访问地址 
default-time-zone = '+8:00' //设置东八区时间
```

## 生成容器

```
docker compose up -d

[+] Running 3/3
 ✔ Network database_db_net  Created       0.1s 
 ✔ Container mysql-server   Healthy      21.3s 
 ✔ Container mysql-adminer  Started      21.3s 
```
## 访问

- 容器中安装了 MySQL 的管理工具 Adminer，开放了 8080 端口，可以通过 SERVER_IP:8080 地址访问。
- 同时可以通过 MySQL 客户端使用 MySQL 命令访问，开放了 3306 端口。