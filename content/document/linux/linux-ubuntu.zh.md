+++
date = '2025-09-18T10:27:19+08:00'
draft = false
title = 'Ubuntu 22.04 桌面版的安装'
weight = 1
[params]
    author = 'Homecat'
+++

## 制作 Ubuntu 安装介质

- 访问 [Ubuntu 官网](https://launchpad.net/ubuntu/+cdmirrors) 下载最新 ISO 镜像安装文件。
- 下载 [Rufus](https://rufus.ie) 或 [Balena Etcher](https://etcher.balena.io/) 工具。
- 使用上述工具将下载的 Ubuntu ISO 镜像写入 U 盘。

## 安装步骤

- 插入 Ubuntu 安装 U 盘，重启电脑，进入 BIOS/UEFI 设置。
- 确保启动顺序是 从 Ubuntu 安装 U 盘启动，保存并退出。
- 进入安装程序，双击“Install Ubuntu”图标启动安装程序。
    - 选择语言：选择中文（简体）。
    - 键盘布局：默认即可。
    - 更新和第三方软件：可以都勾选，或者不勾选，安装完成后再说。
    - 安装类型：
        - 独立安装：清除整个磁盘并安装 Ubuntu。
        - 与 Windows 并存：安装 Ubuntu，与 Windows Boot Manager 共存。
        - 手动分区。
    - 点击“现在安装”，系统会显示将要进行的磁盘更改，确认无误后点击“继续”。
    - 选择时区：在地图上点击上海，或输入 Asia/Shanghai。
    - 创建用户：输入您的姓名、计算机名、用户名和密码。
    - 等待安装：接下来安装程序会自动复制文件、安装系统，整个过程需要10-20分钟。
    - 安装完成：提示安装完成后，点击“现在重启”。系统会提示您拔出安装 U 盘，然后按回车键。
