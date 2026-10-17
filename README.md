# Geometry Atlas · 几何图谱

三本经典几何书中的约 300 条定理，按「几何层次 → 大类 → 小类 → 定理」排成一张可以点开、筛选、搜索的环形地图。

- 吉川实夫著、王邦珍译《近世综合几何学》，商务印书馆，1925
- 严济慈《几何证题法》，1928 年初版（依据 1982 年高等教育出版社白话本）
- 矢野健太郎《几何有名定理》（只依据目录整理）

## 文件

```
index.html            页面（纯静态，无需编译）
data/theorems.json    全部定理数据；改内容只改这个文件
scripts/validate.py   数据检查脚本
vendor/d3.min.js      D3 v7.8.5（画图库，BSD 许可证见 vendor/d3-LICENSE）
```

`theorems.json` 里每条定理的字段：

| 字段 | 含义 |
|---|---|
| id | 编号 T001… |
| layer | 几何层次：射影 / 仿射 / 欧氏 |
| category / subcategory | 大类 / 小类 |
| label | 书中编号：定理 1、例 3、§54 等；书中没有编号的写「无编号」 |
| name | 简短的描述性名称（不超过 15 个字）；有通行定理名的用定理名 |
| statement | 定理本身的内容；placeholder 条目为空 |
| note | 关于这条数据的说明（书中怎么处理、和别的条目的关系、推测依据等），没有则为空 |
| source | 出处（书 + 页码 + 编号），多个来源用「；」分隔 |
| books | 来源书：吉川 / 严 / 矢野 |
| conclusion | 结论类型：共点、共线、共圆、轨迹、射影对应等 |
| status | 数据来历，三档之一，见下 |

`status` 的取值：

| 取值 | 含义 | 哪些条目 |
|---|---|---|
| extracted | 从原书正文摘录，未人工校对 | 来自吉川或严的条目，包括与它们合并的矢野条目 |
| toc_only | 只依据目录，内容是按定理名补写的标准表述，不是书中原文 | books 只有「矢野」且有实际内容的条目 |
| placeholder | 只有目录标题，没有实际内容 | books 只有「矢野」、statement 为空的条目，说明写在 note 里 |

目前三档都没有经过人工对照原书核对。

## 检查数据

改完 `theorems.json` 后运行：

```
python3 scripts/validate.py
```

只用 Python 标准库。检查 id 连续且唯一、count 等于条目数、必填字段非空、status / books / layer / conclusion 的取值、status 与来源书是否对得上、subcategory 编号与 category 是否一致。全部通过时退出码为 0，否则列出每个问题并以 1 退出。

## 本地预览

页面用 fetch 读取 JSON，直接双击 index.html 读不到数据，要开一个本地服务器：

```
python3 -m http.server 8000      # 然后打开 http://localhost:8000
# 或者
npx serve .
```

## 部署到 Vercel

纯静态站点，不需要任何配置：

- 网页方式：把这个文件夹推到 GitHub 仓库，在 vercel.com 选 Add New → Project 导入，Framework Preset 选 Other，不填 Build Command，点 Deploy。
- 命令行方式：在这个文件夹里运行 `npx vercel`（首次会要求登录），正式发布用 `npx vercel --prod`。

## 公开前待办

- [ ] 对照原书核对 `status` 为 toc_only、placeholder 的矢野条目，补全 placeholder 的内容
- [ ] 核对 T047 与 T058 是否重复
- [ ] 抽查严济慈部分的公式和字母（从扫描页读出）
- [ ] 把直接沿用原书文字的条目（尤其吉川的文言译文、矢野）改写成自己的表述，只保留出处
