# 任务：垂心四面体扫描（共线、共面、共圆、五点共球）

这次扫描和上次一般四面体的扫描是同一套方法，换成了垂心四面体（三对对棱互相垂直，四条高交于 H）。点集说明见《垂心四面体特殊点库》。

## 文件（code_ortho_spheres.zip，解压到同一个文件夹）

| 文件 | 作用 |
|---|---|
| ortho_points.pkl | 点集：913 个原子中心 + 254 个轨道点 = 1167 个点，6 个随机垂心四面体上的坐标 |
| opoints.py | 读入点集，并提供按顶点对称的规范形 canon() |
| oscan.py | 共线、共面扫描，并在 6 个四面体上复核；输出 oscan_lines.pkl、oscan_planes.pkl |
| ocircles.py | 在共面组里找共圆（无三点共线）；输出 ocircles.pkl |
| ospheres.py | 扫描五点以上共球，并在 6 个四面体上复核 |
| ospheres_classify.py | 分类，筛掉平凡的球 |
| oshow_spheres.py | 把没解释的球写成 Markdown 表 |
| tetlib.py | 分类时要用 |
| 其余文件 | 生成点集的代码和中间数据，跑扫描用不到，仅供参考 |

## 步骤：共线、共面、共圆

```
python3 oscan.py 300      # 试跑前 300 个点，约 1 分钟；应输出「合并成直线」若干、「共面：复核后 2418」
python3 oscan.py          # 全量 1167 点
python3 ocircles.py       # 读 oscan_planes.pkl
```

全量的共面候选约 700 万个，比一般四面体（12 万）多得多，复核会花一些时间；进度会打印出来。共线和共面是单进程的，如果太慢，可以把共面第一步按 i 分块并行。

## 步骤：五点共球

1. 安装依赖：`pip install numpy scipy numba`
2. 试跑前 300 个点（几十秒）：
   ```
   python3 ospheres.py 300
   python3 ospheres_classify.py ospheres_raw_300.pkl
   ```
   应输出「候选球 889」「6 个四面体上都成立的球 879」。
3. 全量：
   ```
   python3 ospheres.py
   python3 ospheres_classify.py ospheres_raw_1167.pkl
   python3 oshow_spheres.py ospheres_cls_1167.pkl > ospheres_left.md
   ```

## 和上次相比改了什么

- **已知球**：在外接球、内切球、十二点球之外，加了两个：
  - 棱中点球：6 个棱中点都在上面，球心 G；
  - 极球：球心 H，幂 p = HV_i·HF_i，p 可正可负。p < 0 时是虚球，反演仍然有定义。
  
  "三对以上的点关于已知球互为反演"这一条，对这 5 个球都检查。
- **球过球心**："平面关于某球的反演像"这一条，只对外接球、内切球、极球的球心使用。原因是任何过某个点的球，以这个点为中心反演后都是平面，这件事本身不算解释；只有这三个球心的反演点大多在库里，才说得通。

## 请沿用你上次加的改进

上次全量跑时，你在分类里加了几条规则：
- 已知圆串起来：共享两点以上的已知圆；
- 圆加一点；
- 相对误差；
- 构造出来的半径，不用自由半径。

这次请照样加上。试跑 300 个点时，原版分类器还剩 385 个五点球没解释，大部分应该会被这些规则吃掉。

## 跑完后交回

1. 屏幕输出：各步的数量、分类计数、未解释的类数。
2. 共线、共面、共圆：oscan_lines.pkl、oscan_planes.pkl、ocircles.pkl。
3. 共球：ospheres_raw_1167.pkl、ospheres_cls_1167.pkl、ospheres_left.md。

垂心四面体的巧合比一般四面体多，候选球可能多不少。如果未解释的类超过几千，先别深入分析，把数量交回来。
