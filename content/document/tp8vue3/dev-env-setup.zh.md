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
db ─┬─ mysql ─┬─ conf ── my-custom.cnf 数据库配置文件
    │         └─ init ── index.sql     数据库初始化文件 
    ├─ .env  建立数据库的环境变量 
    └─ docker-compose.yaml  用于生成容器的 Docker Compose 文件
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

