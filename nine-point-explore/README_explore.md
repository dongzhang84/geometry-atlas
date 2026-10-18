# 专题页：九点圆和它的邻居

## 文件

```
explore/nine-point.html   专题页（独立页面，配色与主页一致，支持深色模式）
explore/nine-point.js     页面逻辑：六个标签页的绘制与交互
explore/geometry.js       共用几何计算（外心、垂心、垂足、九点、二次曲线、隐函数描线），以后的专题页可复用
data/demos.json           专题页标签 ↔ 目录定理编号的对应表（theorem_ids 待填）
```

## 标签页与锚点

| 锚点 | 内容 | 交互 |
|---|---|---|
| `#euler` | 欧拉线：O、G、H 共线，N 是 OH 中点 | 拖动顶点；勾选显示中垂线 / 中线 / 高 |
| `#homothety` | 外接圆位似：以 H（或 G）为中心缩放，k = 1/2（或 −1/2）时变成九点圆 | 拖动顶点；滑块调 k；拖动外接圆上的 P |
| `#feuerbach` | Feuerbach 相切：NI = R/2 − r | 拖动顶点 |
| `#simson` | 西摩松线平分 PH，中点在九点圆上 | 拖动顶点；拖动 P |
| `#orthocentric` | 垂心组：四个三角形共用一个九点圆 | 拖动顶点；按钮切换三角形 |
| `#hyperbola` | 过 A、B、C、H 的等轴双曲线，中心在九点圆上 | 拖动顶点；拖动 Q |

## 与目录的链接

页面加载时读取 `../data/demos.json` 和 `../data/theorems.json`。当前标签在 `demos.json` 里有 `theorem_ids` 时，页面底部显示「目录中对应的定理」，链接到 `../index.html#<定理编号>`。两个文件读不到时静默跳过，不影响页面。

## 本地预览

```
python3 -m http.server 8000   # 在网站根目录运行，打开 http://localhost:8000/explore/nine-point.html
```
