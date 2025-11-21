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
- 生成容器时需要的数据库环境参数 .env
- 数据库初始化文件 /mysql/init.sql
- 重写 php:8.0-apache 镜像文件 /php/Dockerfile
- 重写 web 服务根目录文件 /php/000-default.conf 

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
> 在更新 vite.config.ts 时，会提示不能修改的信息，原因是 Docker 是以 root 运行的，而 vite.config.ts 是由 root 生成的，非 root 用户不能修改，解决办法是用 `sudo chown 用户名:用户组 vite.config.ts` 命令修改文件的所有者。

### 启动 vue 服务
```
cd test
docker compose exec node npm run dev
```

### 访问网站

- Vue [http://localhost](http://localhost)

