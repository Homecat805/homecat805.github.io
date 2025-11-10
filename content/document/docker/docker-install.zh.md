+++
date = '2025-09-17T14:30:19+08:00'
draft = false
title = 'Ubuntu 22.04 安装 Docker 容器引擎'
weight = 1
[params]
    author = 'Homecat'
+++

Docker 是一个开源的应用容器引擎，通过容器的生成和使用加快构建、共享和运行应用程序的速度，帮助开发人员在任何地方构建、共享、运行和验证应用程序，而无需繁琐的环境配置或管理。本文是在 Ubuntu Server 22.04 上安装 Docker 的过程记录。

<!--more-->

## 使用官方仓库安装

### 更新软件包索引并安装依赖
```
sudo apt update
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release
```

### 添加 Docker 官方 GPG 密钥
```
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

### 添加 Docker 软件仓库
```
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### Docker Engine
```
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### 验证安装结果
```
docker run --rm hello-world
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
c1ec31eb5944: Pull complete 
Digest: sha256:a26bff933ddc26d5cdf7faa98b4ae1e3ec20c4985e6f87ac0973052224d24302
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (amd64)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker ID:
 https://hub.docker.com/

For more examples and ideas, visit:
 https://docs.docker.com/get-started/

```

## 查看安装版本

```
sudo docker version

Client: Docker Engine - Community
 Version:           26.1.1
 API version:       1.45
 Go version:        go1.21.9
 Git commit:        4cf5afa
 Built:             Tue Apr 30 11:47:53 2024
 OS/Arch:           linux/amd64
 Context:           default

Server: Docker Engine - Community
 Engine:
  Version:          26.1.1
  API version:      1.45 (minimum version 1.24)
  Go version:       go1.21.9
  Git commit:       ac2de55
  Built:            Tue Apr 30 11:47:53 2024
  OS/Arch:          linux/amd64
  Experimental:     false
 containerd:
  Version:          1.6.31
  GitCommit:        e377cd56a71523140ca6ae87e30244719194a521
 runc:
  Version:          1.1.12
  GitCommit:        v1.1.12-0-g51d5e94
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0

```

## 启动 Docker 服务并设置开机自启

```
sudo systemctl start docker
sudo systemctl enable docker
```

## 授予非 root 用户特权

```
sudo groupadd docker
sudo usermod -aG docker $USER
```

## 改用国内镜像源

文件位置：/etc/docker/daemon.json
```
{
  "registry-mirrors": [
        "https://docker.m.daocloud.io",
        "https://docker.nju.edu.cn",
        "https://dockerproxy.com"
  ]
}
```

## 删除 Docker

```
sudo apt purge docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-ce-rootless-extras
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
```
