+++
date = '2025-09-18T10:58:03+08:00'
draft = false
title = 'Windows 和 Ubuntu 双系统安装'
weight = 2
[params]
    author = 'Homecat'
+++

先安装 Windows，再安装 Ubuntu，这是最简单且问题最少的方式。

## 准备工作

### 创建 Windows 安装介质

- 一个不少于 8GB 的 U 盘。
- 访问微软官网下载 Windows 10/11 媒体创建工具，运行工具制作 Windows 安装 U 盘。

### 创建 Ubuntu 安装介质

- 访问 [Ubuntu 官网](https://launchpad.net/ubuntu/+cdmirrors) 下载最新 LTS 版本（长期支持版，更稳定）。
- 下载 [Rufus](https://rufus.ie) 或 [Balena Etcher](https://etcher.balena.io/) 工具。
- 使用上述工具将下载的 Ubuntu ISO 镜像写入另一个 U 盘，或同一个 U 盘在安装完 Windows 后重新制作。

## 安装步骤

### 安装 Windows

- 插入 Windows 安装 U 盘，重启电脑，进入 BIOS/UEFI 设置。
- 将 启动顺序（Boot Order） 设置为从 U 盘优先启动。
- 保存设置并退出，电脑将从 U 盘启动进入 Windows 安装界面。
- 按照提示完成 Windows 的安装。如果您是新手，在选择安装类型时，直接“下一步”即可，安装程序会自动在现有分区上安装。
- 安装完成后，进入 Windows 系统，安装所有必要的驱动（如显卡、网卡驱动），并确保系统可以正常上网和运行。

### 磁盘分区

- 进入当前 Windows 系统，右键点击“此电脑” -> “管理” -> “磁盘管理”。
- 选择一个有足够空闲空间的磁盘（推荐 C 盘以外的盘，或者缩小某个分区），右键选择“压缩卷”。
- 输入要压缩的空间量（即分配给 Ubuntu 的空间）,不小于 50GB；如果您打算长期使用并安装很多软件，建议 100GB 或更多。例如，要分配 100GB，需要输入 102400。
- 压缩后会得到一块黑色的“未分配”空间，保持其为“未分配”状态即可，不要在此创建新分区。Ubuntu 安装程序会识别并使用它。
- 关闭 Windows 快速启动和安全启动（可选但强烈推荐）：
    - 快速启动： 控制面板 -> 电源选项 -> 选择电源按钮的功能 -> 更改当前不可用的设置 -> 取消勾选“启用快速启动”。这可以防止 Windows 锁住硬盘，让 Ubuntu 能正常挂载 NTFS 分区。
    - 安全启动： 进入 BIOS/UEFI 设置（开机按 F2、Delete、F12 等键，因主板而异），在 “Boot” 或 “Security” 选项卡中找到 “Secure Boot” 选项，将其设置为 Disabled。Ubuntu 新版本通常支持安全启动，但关闭它可以避免很多潜在的驱动问题。

### 安装 Ubuntu

参见[Ubuntu 22.04 桌面版的安装](document/linux/linux-ubuntu/)

## 默认启动项设置

默认启动项：GRUB 通常会默认选择 Ubuntu，并在倒计时后自动进入。如果您希望默认启动 Windows，可以进入 Ubuntu 系统后，修改`/etc/default/grub`文件。

```
GRUB_DEFAULT=3
```

或者设置为菜单标题：

```
GRUB_DEFAULT="Windows Boot Manager (on /dev/sda1)"
```

更新 GRUB 配置：
```
sudo update-grub
```

## 常见问题与故障排除

- 开机直接进入 Windows，没有 GRUB 菜单，原因为 Windows 更新或恢复覆盖了引导程序。解决方案：使用 Ubuntu 安装 U 盘进入“试用 Ubuntu”模式，然后使用 boot-repair 工具进行修复。
- 在 Ubuntu 中无法访问 Windows 磁盘。解决方案：在 Windows 中关闭了“快速启动”，或完全重启 Windows，非关机后再开机。
