+++
date = '2025-08-09T08:54:00+08:00'
draft = false
title = 'Hugo 主题 - 八月的第五天'
categories = '网络和计算机'
tags =['Hugo']
[params]
    author = 'Homecat'
    thumbnail = 'https://gohugo.io/images/hugo-logo-wide.svg'
+++

使用 Hugo 已经好长时间了，最近访问官网，发现已经更新到 0.148.2 版，大面积的改进；于是用 0.148.2 版写了一个主题，命名为：八月的第五天。

<!--more-->

## 网站配置

### 配置文件

采用 `Configuration directory` 目录配置方式。

```
hugo-theme-aug5th/
└─ config/
   └─ _default/
      ├─ hugo.toml
      ├─ languages.en.toml
      ├─ languages.zh.toml
      ├─ menus.en.toml
      └─ menus.zh.toml
```

- 基本配置 `hugo.toml` 

```
baseURL = 'https://aug5th.genway.com.cn/'

# 
defaultContentLanguage = 'en'
defaultContentLanguageInSubdir = false
disableDefaultLanguageRedirect = false
disableLanguages = []


```
