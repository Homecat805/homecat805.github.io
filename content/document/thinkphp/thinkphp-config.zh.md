+++
date = '2025-12-20T10:05:48+08:00'
draft = false
title = 'ThinkPHP 开发框架相关配置'
weight = 1
[params]
    author = 'Homecat'
+++

## 数据库连接配置

ThinkPHP 的数据库连接配置主要涉及到两个文件：.env 和 app/config/database.php，出于安全考虑，连接数据库的参数不直接写入配置文件，而是从环境变量文件读取。

数据库配置文件 database.php 在系统安装时自动生成，并已配置数据库连接方式：通过 env() 助手函数从 .env 文件读取，未读到的参数使用默认值。

环境变量文件 .env 可以参照 .example.env，或者直接复制。

```
APP_DEBUG = true      //是否报错

DB_DRIVER = mysql     //默认连接配置
DB_TYPE = mysql       //数据库类型
DB_HOST = 127.0.0.1   //数据库主机地址
DB_PORT = 3306        //数据库端口

DB_NAME = test        //数据库名
DB_USER = username    //用户名
DB_PASS = password    //用户密码

DB_CHARSET = utf8     //字符
DEFAULT_LANG = zh-cn  //默认语言
```

