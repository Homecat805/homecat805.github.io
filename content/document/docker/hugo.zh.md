+++
date = '2025-09-23T07:46:29Z'
draft = false
title = 'Docker - Hugo 作业环境搭建'
weight = 3
[params]
    author = 'Homecat'
+++

为了实现 Hugo 静态网站的本地调试，又不在宿主机上安装 Hugo 应用以保持宿主机整洁，用 Docker 搭建 Hugo 的作业环境，整个搭建过程在 Ubuntu 22.04 上完成。

<!--more-->

## 搭建

### 作业目录

```
project 
  ├─ docker
  │   ├─ hugo_extended_0.150.0_linux-arm64.deb  
  │   ├─ dart-sass-1.90.0-linux-x64.tar.gz 
  │   └─ Dockerfile
  ├─ myblog     
  └─ docker-compose.yaml 
```

### 镜像文件准备

- 生成工作目录，下载安装文件： Hugo v0.150.0 和 Dart-sass v1.90.0 

  ```
  mkdir project/docker
  cd project/docker
  wget "https://github.com/gohugoio/hugo/releases/download/v0.150.0/hugo_extended_0.150.0_linux-arm64.deb"
  wget "https://github.com/sass/dart-sass/releases/download/1.90.0/dart-sass-1.90.0-linux-x64.tar.gz"
  ```

- 编写 Dockerfile

  ```
  FROM ubuntu:22.04

  # 安装基础工具
  RUN apt-get update && apt-get install -y ca-certificates

  # 获取安装文件
  COPY ./docker/hugo_extended_0.150.0_linux-amd64.deb /tmp/hugo.deb
  COPY ./docker/dart-sass-1.93.0-linux-x64.tar.gz /tmp/dart-sass.tar.gz

  # 安装 Hugo 和 Dart Sass
  RUN apt-get install -y /tmp/hugo.deb && \
      tar -xzf /tmp/dart-sass.tar.gz -C /usr/local/ && \
      ln -s /usr/local/dart-sass/sass /usr/local/bin/sass && \
      rm -rf /var/lib/apt/lists/* /var/tmp/* /tmp/*

  # 设置工作目录
  WORKDIR /app

  # 设置容器默认命令
  CMD ["hugo", "version"]
  ```

### 容器文件准备

- 编写 docker-compose.yaml 文件

  ```
  services:
    hugo:
      build:
        context: .   
        dockerfile: ./docker/Dockerfile
      image: hugo:0.150.0-custom
      container_name: myhugo
      ports:
        - "1313:1313"
      volumes:
        - ./myblog:/src
      working_dir: /src
      entrypoint: /bin/bash
      tty: true
      stdin_open: true
  ```

### 生成容器  

```
cd project
docker compose up -d

 ✔ Image hugo:0.150.0-custom Built       76.1s 
 ✔ Network hugo_default      Created      0.3s 
 ✔ Container myhugo          Created      1.2s 
```

## 使用

### 查看容器信息

```
docker compose ps

NAME    IMAGE                COMMAND      SERVICE   CREATED         STATUS        PORTS                                  1.1s 
myhugo  hugo:0.150.0-custom  "/bin/bash"  hugo      6 seconds ago   Up 4 seconds  0.0.0.0:1313->1313/tcp, [::]:1313->1313/tcp

```

### 进入容器

```
cd project
docker compose exec hugo bash

root@bb5d6d4a2839:/src# 
```

### 生成新站点
```
root@bb5d6d4a2839:/src# hugo new site . 

Congratulations! Your new Hugo site was created in /src.
Just a few more steps...
1. Change the current directory to /src.
2. Create or install a theme:
   - Create a new theme with the command "hugo new theme <THEMENAME>"
   - Or, install a theme from https://themes.gohugo.io/
3. Edit hugo.toml, setting the "theme" property to the theme name.
4. Create new content with the command "hugo new content <SECTIONNAME>/<FILENAME>.<FORMAT>".
5. Start the embedded web server with the command "hugo server --buildDrafts".
See documentation at https://gohugo.io/.

root@bb5d6d4a2839:/src# hugo new theme mytheme
Creating new theme in /src/myblog/themes/mytheme
root@bb5d6d4a2839:/src# exit 
```

### 调整网站文件

- 修改文件拥有人

  ```
  cd project
  sudo chown -R $(id -u):$(id -g) myblog
  ```


- 修改 project/myblog/hugo.toml 文件

  ```
  baseURL = 'https://example.org/'
  languageCode = 'en-us'
  title = 'My New Hugo Site'
  ...
  theme = 'mytheme'
  ...
  ```

### 启动 Hugo 服务

```
docker compose exec hugo bash
root@bb5d6d4a2839:/src# hugo server --bind 0.0.0.0

Watching for changes in /src/myblog/{archetypes,assets,content,data,i18n,layouts,static,themes}
Watching for config changes in /src/myblog/hugo.toml, /src/myblog/themes/mytheme/hugo.toml
Start building sites … 
hugo v0.150.0-3f5473b7d4e7377e807290c3acc89feeef1aaa71+extended linux/amd64 BuildDate=2025-09-08T13:01:12Z VendorInfo=gohugoio

                  │ EN 
──────────────────┼────
 Pages            │ 18 
 Paginator pages  │  0 
 Non-page files   │  1 
 Static files     │  1 
 Processed images │  0 
 Aliases          │  0 
 Cleaned          │  0 

Built in 15 ms
Environment: "development"
Serving pages from disk
Running in Fast Render Mode. For full rebuilds on change: hugo server --disableFastRender
Web Server is available at http://localhost:1313/ (bind address 0.0.0.0) 
Press Ctrl+C to stop
```

### 访问站点

打开浏览器，访问：http://localhost:1313/

### 停止 Hugo 服务

容器内， <kbd>Ctrl</kbd>+<kbd>C</kbd>。

```
root@bb5d6d4a2839:/src# exit
```

### 关闭容器

```
cd project
docker compose down -v

[+] down 1/2
 ✔ Container myhugo     Removed     11.0s 
 ✔ Network hugo_default Removed     9.0s      
```

## 其它

- 搭建所需文件地址 [gitee.com](https://gitee.com:homecat805/hugo)
- 获取文件

  ```
  git clone git@gitee.com:homecat805/hugo.git
  ```

