# Geometry Atlas · 几何图谱

三本经典几何书中的约 300 条定理，按「几何层次 → 大类 → 小类 → 定理」排成一张可以点开、筛选、搜索的环形地图。

- 吉川实夫著、王邦珍译《近世综合几何学》，商务印书馆，1925
- 严济慈《几何证题法》，1928 年初版（依据 1982 年高等教育出版社白话本）
- 矢野健太郎《几何有名定理》（只依据目录整理）

## 文件

```
index.html            页面（纯静态，无需编译）
data/theorems.json    全部定理数据；改内容只改这个文件
data/relations.json   定理之间的推广—特例、对偶、逆命题关系
scripts/validate.py   数据检查脚本
vendor/d3.min.js      D3 v7.8.5（画图库，ISC 许可证见 vendor/d3-LICENSE）
```

`theorems.json` 里每条定理的字段：

| 字段 | 含义 |
|---|---|
| id | 编号 T001… |
| layer | 几何层次：射影 / 仿射 / 欧氏 |
| category / subcategory | 大类 / 小类 |
| label | 书中编号：定理 1、例 3、§54 等；书中没有编号的写「无编号」 |
| name | 简短的描述性名称（不超过 15 个字）；有通行定理名的用定理名。name 是编者根据内容拟定的名称，书中原编号见 label |
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

## 定理关系（relations.json）

记录定理之间三种关系，不按「主题相近」连线：

| type | 含义 | 方向 |
|---|---|---|
| specializes | to 是 from 的特例：对 from 的条件加限制或让对象退化即得 to | from 更一般，to 是特例 |
| dual | 射影对偶，只连拆成两条记录的对偶对（同一条里已写【对偶】的不连） | 无方向 |
| converse | 互为逆命题 | 无方向 |

每条边的字段：

| 字段 | 含义 |
|---|---|
| from / to | 定理 id（T001…）或目录外节点 id（X001…） |
| type | 上表三种之一 |
| operation | 仅 specializes 填写：退化 / 加度量 / 取特殊对象 / 降维 / 参数取特殊值；其他类型为 null |
| note | 一句话说明从 from 怎样得到 to |
| confidence | 确定（标准数学事实）/ 可能（编者推断，待人工核对） |

`external` 数组放目录外的著名定理（如余弦定理），id 从 X001 起编，只有 name 和 statement，不进 theorems.json，总数不超过 30 个。

## 检查数据

改完 `theorems.json` 后运行：

```
python3 scripts/validate.py
```

只用 Python 标准库。theorems.json：检查 id 连续且唯一、count 等于条目数、必填字段非空、status / books / layer / conclusion 的取值、status 与来源书是否对得上、subcategory 编号与 category 是否一致。relations.json：检查边上的 id 都存在、type / operation / confidence 的取值、没有重复边和自环、specializes 边不成环、目录外节点编号连续且不超过 30 个。全部通过时退出码为 0，否则列出每个问题并以 1 退出。

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

## 许可证

- 代码（`index.html`、`scripts/`）：MIT，见 [LICENSE](LICENSE)
- 数据（`data/theorems.json`）：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，转载或改编请注明出处
- `vendor/d3.min.js`：D3 自带的 ISC 许可证，见 `vendor/d3-LICENSE`

## 公开前待办

- [ ] 对照原书核对 `status` 为 toc_only、placeholder 的矢野条目，补全 placeholder 的内容
- [ ] 核对 T047 与 T058 是否重复
- [ ] 抽查严济慈部分的公式和字母（从扫描页读出）
- [ ] 把直接沿用原书文字的条目（尤其吉川的文言译文、矢野）改写成自己的表述，只保留出处
