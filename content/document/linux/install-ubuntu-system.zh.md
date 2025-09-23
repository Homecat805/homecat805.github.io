+++
date = '2025-09-23T12:09:37+08:00'
draft = false
title = 'Ubuntu 22.04 服务器安装'
weight = 1
[params]
    author = 'Homecat'
+++

Ubuntu 是 Linux 操作系统发行版其中的一种，分桌面版和服务器版，安装方式基本一致，区别在于安装镜像的选择和安装界面。

## 制作 USB 安装介质

- 访问 [Ubuntu 官网](https://launchpad.net/ubuntu/+cdmirrors) 下载需要的 ISO 镜像安装文件。
- 下载 [Rufus](https://rufus.ie) 或 [Balena Etcher](https://etcher.balena.io/) 工具。
- 使用上述工具将下载的 Ubuntu ISO 镜像写入 U 盘。

## 启动安装

- 将 USB 安装介质插入服务器后开机，选择从 USB 启动。

## 服务器版安装过程

- 选择语言：English
- 选择键盘布局：Identify keyboard (自动)
- 选择安装对象：Ubuntu Server (minimized) + Search for third-party drivers
- 配置网络连接：根据实际情况配置
- 设置代理服务器：无
- 配置 Ubuntu 文件镜像地址
- 选择是否更新安装新版本：Continue without updating
- 选择安装位置： Use an entire disk
- 存贮硬盘配置
- 格式化警告：Continue
- 命名用户名、机器名和口令
- 是否升级到 Ubuntu Pro：Skip
- 是否安装 OpenSSH Server：Yes
- 复制文件过程
- 安装完成 + 重启 

## 桌面版安装过程

- 略