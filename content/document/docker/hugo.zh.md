+++
date = '2025-09-23T07:46:29Z'
draft = false
title = 'Docker - Hugo 作业环境搭建'
weight = 3
[params]
    author = 'Homecat'
+++

利用 Docker 技术搭建 Hugo 静态网站生成器的作业环境。

<!--more-->

## 镜像制作

### 准备工作

生成工作目录，下载安装文件： Hugo v0.150.0 和 Dart-sass v1.90.0 

```
mkdir hugo-dartsass
cd hugo-dartsass
wget "https://github.com/gohugoio/hugo/releases/download/v0.150.0/hugo_extended_0.150.0_linux-arm64.deb"
wget "https://github.com/sass/dart-sass/releases/download/1.90.0/dart-sass-1.90.0-linux-x64.tar.gz"
nano Dockerfile
```

### Dockerfile

```
FROM ubuntu:22.04

# 将本地 deb 文件复制到容器中
COPY hugo_extended_0.150.0_linux-amd64.deb /tmp/hugo.deb
COPY dart-sass-1.93.0-linux-x64.tar.gz /tmp/dart-sass.tar.gz

# 安装必要的依赖和 Hugo
RUN apt-get install -y --no-install-recommends \
    ca-certificates \
    /tmp/hugo.deb \
    && rm -rf /var/lib/apt/lists/* \
    && rm /tmp/hugo.deb

# 使用官方推荐的方式安装 dart-sass
RUN tar -xzf /tmp/dart-sass.tar.gz -C /tmp && \
    mv /tmp/dart-sass /opt/dart-sass && \
    ln -s /opt/dart-sass/sass /usr/local/bin/sass && \
    rm /tmp/dart-sass.tar.gz

# 将 dart-sass 添加到 PATH
ENV PATH="/opt/dart-sass:${PATH}"

# 创建与主机匹配的组和用户
# 使用固定的 GID 和 UID 以确保与主机匹配
RUN groupadd -g 1000 zhong && \
    useradd -u 1000 -g zhong -m -s /bin/bash zhong

# 设置工作目录
WORKDIR /src

# 切换到 zhong 用户
USER zhong

# 设置容器默认命令
CMD ["hugo", "version"]
```

### 生成镜像

```
docker build -t hugo:0.150.0 .
```

## 生成容器

### 方式一 docker run

```
docker run -it --rm \
    --name myblog \
    -p 1313:1313 \
    -v /home/zhong/www/sites/myblog:/src \
    -v /etc/passwd:/etc/passwd:ro \
    -v /etc/group:/etc/group:ro \
    --user $(id -u zhong):$(id -g zhong) \
    hugo:0.150.0 \
    /bin/bash
```

### 方式二 docker compose

- docker-compose.yaml

```
version: '3.8'
services:
  myblog:
    image: hugo:0.150.0
    container_name: myblog
    user: "${CURRENT_UID}:${CURRENT_GID}"
    ports:
      - "1313:1313"
    volumes:
      - /home/zhong/www/sites/myblog:/src
      - /etc/passwd:/etc/passwd:ro
      - /etc/group:/etc/group:ro
    working_dir: /src
    command: hugo server -D --bind 0.0.0.0 --baseURL http://服务器ip地址:1313
```

- 执行

```
# 启动服务
docker compose up

# 进入容器
docker-compose exec myblog /bin/bash

# 停止服务
docker compose down

```