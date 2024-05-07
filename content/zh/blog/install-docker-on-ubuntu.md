+++
title = '在 Ubuntu Server 上安装 Docker'
date = 2024-05-07T15:30:51+08:00
draft = false
author = 'Homecat'
categories = '学习笔记'
tags = ['Linux','Ubuntu','Docker']
series = ''
+++

Docker 是一个开源的应用容器引擎，通过容器的生成和使用加快构建、共享和运行应用程序的速度，帮助开发人员在任何地方构建、共享、运行和验证应用程序，而无需繁琐的环境配置或管理。本文是在 Ubuntu Server 22.04 上安装 Docker 的过程记录。

<!--more-->

## 安装

Docker在 [https://get.docker.com/](https://get.docker.com/) 提供了安装脚本，可以以非交互方式将Docker安装到开发环境中。

### 获取脚本

```
curl -fsSL https://get.docker.com -o get-docker.sh
```
### 安装及提示

```
sudo sh get-docker.sh
```