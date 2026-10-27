# 几何图谱 · Geometry Atlas

四十多条有名的平面几何定理，按家族分组，标出它们之间的推广、特例与对偶关系；
其中十来条可以拖动三角形的顶点，看关系始终成立。

**[打开首页 →](index.html)**　·　**[九点圆家族 →](family/nine-point.html)**

这不是一本定理手册，也不是发现新定理的工具。它想回答的是一个问题：
**这些定理之间是什么关系？** 哪一条是哪一条的推广，哪两条互为对偶，
哪一条只是另一条的退化情形。

## 怎么在本地打开

不需要安装任何东西，也不需要编译：**双击 `index.html`** 就能看。

想用本地服务器也可以：

```sh
python3 -m http.server 8000     # 然后打开 http://localhost:8000/
```

检查数据是否自洽：

```sh
python3 scripts/validate.py
```

它会检查编号唯一、关系两端存在、`generalizes` 没有成环、`demo` 指向的页面和锚点
真的存在，以及**所有页面都没有引用外部资源**。

## 文件

```
index.html              首页：八个家族，每条定理一张卡片，点开看陈述、出处和关系
family/nine-point.html  九点圆家族：十个可拖动的动态图
data/atlas.js           全部数据（定理、家族、关系），用 <script src> 加载
js/geometry.js          平面几何计算，纯函数，挂在 window.GA 上
js/nine-point.js        九点圆家族的作图与交互
scripts/validate.py     数据与外部依赖检查
```

## 设计上的三条硬约束

1. **不引用任何外部资源。** 没有 Google Fonts、没有 CDN、没有统计脚本，字体用系统
   字体。页面在断网的机器上也能完整打开。
2. **纯静态，没有构建步骤。** 没有 `package.json`，没有服务端代码。
3. **数据用 `<script src>` 加载，不用 `fetch`。** 所以直接双击打开文件也能工作，
   部署在任何子路径下也能工作。所有路径都是相对路径。

## 数据格式

`data/atlas.js` 里是一个 `window.ATLAS` 对象：

| 字段 | 说明 |
|---|---|
| `families[]` | `id` / `name` / `intro` |
| `theorems[]` | `id` / `family` / `name` / `statement` / `why` / `source` / `demo` |
| `relations[]` | `from` / `to` / `type` / `note` |

`type` 只有三种：`generalizes`（A 推广了 B）、`dual`（对偶）、`converse`（逆命题）。
只收公认的数学事实，拿不准的不收。

`demo` 写成 `family/<家族>.html#<锚点>`，留空表示这一条暂时没有动态图。

## 关于内容

- 定理本身是数学事实，不受版权保护。所有陈述都是用自己的话写的，没有抄任何书的原文。
- `source` 只写历史出处（谁、哪一年），不写任何书的页码，也不引用原文。

## 许可证

代码 [MIT](LICENSE)，数据（`data/atlas.js`）CC BY 4.0。
