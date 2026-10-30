# 几何有名定理图谱 · Geometry Atlas

四十多条有名的平面与立体几何定理，按家族分组，标出它们之间的推广、特例与对偶关系。
**每一条都配了可交互的动态图** —— 拖动顶点，关系始终成立。

**[打开 →](https://dongzhang84.github.io/geometry-atlas/)**

这不是一本定理手册，也不是发现新定理的工具。它想回答的是一个问题：
**这些定理之间是什么关系？** 哪一条是哪一条的推广，哪两条互为对偶，
哪一条只是另一条的退化情形。

比如：托勒密定理用在矩形上就是勾股定理；Brahmagupta 公式一条边趋于零就是海伦公式；
Pascal 定理在圆锥曲线退化成两条直线时就是 Pappus 定理；Brianchon 是 Pascal 的对偶。

## 现在收了多少

| | |
|---|---|
| 定理 | 43 条，分 7 个家族 |
| 动态图 | 43 张，全部可拖动 |
| 依赖边 | 54 条（证这一条要先有哪几条） |
| 关系 | 18 组推广、特例与对偶 |

七个家族：度量、共点与共线、九点圆家族、圆、射影、双心、空间。

## 在本地看

双击 `index.html` 就能看，不需要安装、也不需要编译。

改完数据跑一下 `python3 scripts/validate.py`，它会检查编号、家族、关系、依赖图、
动态图锚点，以及所有页面都没有引用外部资源。

画图的配色、线型、构型、动画和已知的坑，统一写在 [CONVENTIONS.md](CONVENTIONS.md)。
加新定理之前先看那份。

## 文件

```
index.html              首页：旭日图 + 七个家族的定理卡片，点卡片就地展开动态图
family/figures.html     动态图页：43 张图共用一页，用 #锚点 切换
about.html              关于：项目是什么、关系怎么收的、版权
data/atlas.js           全部数据（层次、家族、基础工具、定理、关系），用 <script src> 加载
js/geometry.js          平面与立体几何计算，纯函数，挂在 window.GA 上
js/figures.js           43 张动态图的作图与交互
js/thumbs.js            卡片上的缩略图：现画的 SVG，悬停时按定理自己的自由度形变
vendor/d3.min.js        旭日图用的 d3，本地副本，不走 CDN
scripts/validate.py     数据、依赖图与外部依赖检查
CONVENTIONS.md          画图规范：配色、线型、构型、动画、已知的坑
```

## 设计上的三条硬约束

1. **不引用任何外部资源。** 没有 Google Fonts、没有 CDN、没有统计脚本，字体用系统
   字体，d3 也是放在 `vendor/` 的本地副本。页面在断网的机器上也能完整打开。
2. **纯静态，没有构建步骤。** 没有 `package.json`，没有服务端代码。
3. **数据用 `<script src>` 加载，不用 `fetch`。** 所以直接双击打开文件也能工作，
   部署在任何子路径下也能工作。所有路径都是相对路径。

## 数据格式

`data/atlas.js` 里是一个 `window.ATLAS` 对象：

| 字段 | 说明 |
|---|---|
| `version` | 数据版本号，页面上会显示 |
| `layers[]` | `id` / `name` / `note` —— 射影层、仿射层、欧氏层 |
| `families[]` | `id` / `name` / `intro` |
| `tools[]` | `id` / `name` / `note` —— 八个「基础工具」，是依赖图的叶子 |
| `theorems[]` | `id` / `layer` / `family` / `name` / `statement` / `deps[]` / `source` / `demo` |
| `relations[]` | `from` / `to` / `type` / `note` |

`deps[]` 是**先决条件**：证这一条要先有哪几条（可以是别的定理的 `id`，也可以是
`tools[]` 里的 `T1`–`T8`）。它和 `relations[]` 不是一回事 —— `deps` 说的是
「证明要用到」，`relations` 说的是「两条定理之间的关系」。

`relations[].type` 只有三种：`generalizes`（A 推广了 B）、`dual`（对偶）、
`converse`（逆命题）。只收公认的数学事实，拿不准的不收。

`demo` 写成 `family/figures.html#<锚点>`，留空表示这一条暂时没有动态图。

## 关于内容

- 定理本身是数学事实，不受版权保护。所有陈述都是用自己的话写的，没有抄任何书的原文。
- `source` 只写历史出处（谁、哪一年），不写任何书的页码，也不引用原文。

## 许可证

代码 [MIT](LICENSE)，数据（`data/atlas.js`）CC BY 4.0。
d3 见 [vendor/d3-LICENSE](vendor/d3-LICENSE)。
