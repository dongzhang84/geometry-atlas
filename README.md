# Geometry Atlas · 几何图谱

> **在线访问：<https://geometry-atlas.vercel.app/>**　·　专题页：[九点圆和其它相关定理](https://geometry-atlas.vercel.app/explore/nine-point.html)

三本经典几何书中的约 300 条定理，按「几何层次 → 大类 → 小类 → 定理」排成一张可以点开、筛选、搜索的环形地图。

- **分类图**：射影 → 仿射 → 欧氏三层的环形图，点开逐层放大，右侧显示定理内容与出处；可按书筛选、搜索。
- **推广图**：定理之间的推广、射影对偶、逆命题关系，从简单的定理往下推到更一般的定理。
- **专题页**：可拖动的动态几何图，目前有「九点圆和其它相关定理」，和主页的定理互相链接。

更新记录、待办和已知问题都在 [CHANGELOG.md](CHANGELOG.md)。

- 吉川实夫著、王邦珍译《近世综合几何学》，商务印书馆，1925
- 严济慈《几何证题法》，1928 年初版（依据 1982 年高等教育出版社白话本）
- 矢野健太郎《几何有名定理》（只依据目录整理）

## 文件

```
index.html            页面（纯静态，无需编译）
data/theorems.json    全部定理数据；改内容只改这个文件
data/relations.json   定理之间的推广、对偶、逆命题关系
data/demos.json       专题页各标签 ↔ 目录定理编号的对应表
explore/              专题页（可拖动的动态几何图），见下文「专题页」
scripts/validate.py   数据检查脚本
docs/                 长文（《九点圆定理系统》）与配图说明
docs/code/            前四轮数值试探的代码，见 docs/code/README.md
CHANGELOG.md          更新记录、待办与已知问题
vendor/d3.min.js      D3 v7.8.5（画图库，ISC 许可证见 vendor/d3-LICENSE）
vendor/dagre.min.js   dagre 0.8.5（推广图的分层布局，MIT 许可证见 vendor/dagre-LICENSE）
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
| generalizes | to 是 from 的推广：放宽 from 的条件、把退化的对象换成一般对象，即得 to | from 简单（特殊），to 更一般 |
| dual | 射影对偶，只连拆成两条记录的对偶对（同一条里已写【对偶】的不连） | 无方向 |
| converse | 互为逆命题 | 无方向 |

每条边的字段：

| 字段 | 含义 |
|---|---|
| from / to | 定理 id（T001…）或目录外节点 id（X001…）；generalizes 边从简单指向一般 |
| type | 上表三种之一 |
| operation | 仅 generalizes 填写，表示 from 相对 to 是哪一种特殊化：退化 / 加度量 / 取特殊对象 / 降维 / 参数取特殊值；其他类型为 null |
| note | 一句话说明从 from 怎样推到 to |
| confidence | 确定（标准数学事实）/ 可能（编者推断，待人工核对） |

`external` 数组放目录外的著名定理（如余弦定理），id 从 X001 起编，只有 name 和 statement，不进 theorems.json，总数不超过 30 个。

## 长文：九点圆定理系统

`docs/九点圆定理系统.md` 是以九点圆为中心的一组三角形定理的整理，以及它们之间的联系。主体是三轮数值试探：

- 第一轮：三角形的 35 个名点，扫描所有三点共线、四点共圆；
- 第二轮：三角形加任意点 P，P 扮演垂心，九点圆推广成九点二次曲线；
- 第三轮：把「圆」推广成同形的椭圆和双曲线，第一轮的 37 组共线、25 个共圆一一对应，包括 Feuerbach 相切的二次曲线版本。

三轮都没有找到新定理，产出是结构：散落的已知事实挂到同一条上游定理之下。

接着写的两篇在同一目录下：

- `docs/九点圆定理系统第四轮：扩大搜索范围.md`：把点的范围从 35 个名点扩大到 ETC 的 753 个三角形中心，找到 623 个四点以上共圆，逐个判断能否由已知事实推出，并做文献检索。同样没有确认新定理。
- `docs/四面体中心库.md`：仿照 ETC，为一般四面体生成的 1957 个「中心」（T1–T1957），作为下一步扫描共线、共面、共球的点库。

配图在 `pics/`，代码在 `docs/code/`（见该目录的 README）。

## 专题页

`explore/` 下放独立的专题页，每页把一组相关定理做成可拖动的动态几何图。主页顶部的「专题：九点圆」进入。

```
explore/nine-point.html   专题页「九点圆和其它相关定理」（配色与主页一致，支持深色模式）
explore/nine-point.js     页面逻辑：十个标签页的绘制与交互
explore/geometry.js       共用几何计算（外心、垂心、垂足、九点、重心坐标、Nagel 线与 Soddy 线上的点、直线交点、过五点的二次曲线、过四点的等轴双曲线、隐函数描线），以后的专题页可复用
```

标签页与锚点（`explore/nine-point.html#<锚点>` 直接打开对应标签；不带锚点时打开第一个标签「九点圆」）：

| 锚点 | 内容 | 交互 |
|---|---|---|
| `#orthocentric` | 九点圆：九点共圆；垂心组的四个三角形共用一个九点圆 | 拖动顶点；按钮切换三角形 |
| `#euler` | 欧拉线：O、G、H 共线，N 是 OH 中点 | 拖动顶点；勾选显示中垂线 / 中线 / 高 |
| `#homothety` | 缩小外接圆：以 H（或 G）为中心缩放，k = 1/2（或 −1/2）时变成九点圆 | 拖动顶点；滑块调 k；拖动外接圆上的 P |
| `#feuerbach` | Feuerbach 相切：NI = R/2 − r | 拖动顶点 |
| `#simson` | 西摩松线平分 PH，中点在九点圆上 | 拖动顶点；拖动 P |
| `#conic` | 九点二次曲线：任意四点 A、B、C、P 的 6 条连线中点和 3 个对角点共一条二次曲线；P 在垂心时是九点圆，在外接圆上时是等轴双曲线；背景按 P 的位置标出椭圆区和双曲线区 | 拖动顶点；拖动 P；按钮把 P 放到垂心；勾选让 P 沿外接圆走 |
| `#nagel` | Nagel 线：内心 I、重心 G、Spieker 点 Sp、Nagel 点 Na 共线，IG : GNa = 1 : 2，Sp 是 I 与 Na 的中点 | 拖动顶点 |
| `#soddy` | Soddy 线：以顶点为圆心的三个两两外切的圆，内、外 Soddy 圆的圆心连线过 I、Gergonne 点 Ge、de Longchamps 点 L | 拖动顶点 |
| `#mandart` | Mandart 圆：三个旁切点 Ua、Ub、Uc 的外接圆，经过 Feuerbach 点 F | 拖动顶点 |
| `#poncelet` | Poncelet 点：过 A、B、C、P 的等轴双曲线的中心，也是 ABC、PBC、PCA、PAB 四个九点圆的公共点 | 拖动顶点；拖动 P；按钮把 P 放到内心 / 垂心 |

`data/demos.json` 记录每个标签对应的目录定理编号（`theorem_ids`）。两边互相链接：

- 专题页底部列出「目录中对应的定理」，链接到 `index.html#<定理编号>`（如 `#T136`），主页打开时自动选中该定理；
- 主页定理详情里，如果该定理出现在某个标签的 `theorem_ids` 中，显示「看动态图」按钮，链接到对应的标签。

目录里没有对应定理的标签保持空数组，`match` 字段保留查找用的关键词。专题页读不到这两个 JSON 时静默跳过，不影响页面。本地预览方法同上，打开 `http://localhost:8000/explore/nine-point.html`。

## 检查数据

改完 `theorems.json` 后运行：

```
python3 scripts/validate.py
```

只用 Python 标准库。theorems.json：检查 id 连续且唯一、count 等于条目数、必填字段非空、status / books / layer / conclusion 的取值、status 与来源书是否对得上、subcategory 编号与 category 是否一致。demos.json：检查 anchor 只能是 orthocentric / euler / homothety / feuerbach / simson / conic / nagel / soddy 之一、不重复，theorem_ids 里的编号都存在。relations.json：检查边上的 id 都存在、type / operation / confidence 的取值、没有重复边和自环、generalizes 边不成环、目录外节点编号连续且不超过 30 个。全部通过时退出码为 0，否则列出每个问题并以 1 退出。

## 本地预览

页面用 fetch 读取 JSON，直接双击 index.html 读不到数据，要开一个本地服务器：

```
python3 -m http.server 8000      # 然后打开 http://localhost:8000
# 或者
npx serve .
```

## 部署

线上地址：<https://geometry-atlas.vercel.app/>，由 Vercel 从 GitHub 仓库的 `main` 分支部署，推送后自动更新。纯静态站点，不需要构建：Framework Preset 选 Other，不填 Build Command。

需要手动发布时，在仓库根目录运行 `npx vercel --prod`。

## 许可证

- 代码（`index.html`、`scripts/`）：MIT，见 [LICENSE](LICENSE)
- 数据（`data/theorems.json`）：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，转载或改编请注明出处
- `vendor/d3.min.js`：D3 自带的 ISC 许可证，见 `vendor/d3-LICENSE`
- `vendor/dagre.min.js`：dagre 自带的 MIT 许可证，见 `vendor/dagre-LICENSE`

## 待办

数据核对、文档缺口和已知问题统一记在 [CHANGELOG.md](CHANGELOG.md) 的「待办」一节。
