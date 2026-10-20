# 九点圆定理系统第四轮：代码

对应《九点圆定理系统第四轮：扩大搜索范围》。依赖：Python 3、numpy、scipy、sympy、matplotlib。

## 目录

| 文件夹 | 对应正文 | 内容 |
|---|---|---|
| stage1 | 第一阶段（53 个中心） | centers.py 手写 53 个中心的坐标公式；scan.py 在 25 个随机三角形上扫描共线、共圆；exact.py 在整数边长三角形上用有理数精确验证 13 个圆；classify.py、closure.py 分类与传递；selftest.py 自检 |
| stage2 | 第二阶段（13 个圆） | ortho.py 找正交圆；conj.py、conj1.py、inv.py 找反演点对；diag.py、diagsym.py 求对角线交点（数值与符号）；sym.py、ident.py 符号验证；exact_inv.py 三条两点反演关系的精确验证 |
| stage3 | 第三阶段（753 个点） | 见下面的流程 |
| hyperbola | 双曲线推广 | hyp.py 在「换尺子」后的度量下重新计算全部中心并检验 623 个圆（参数 euc / ell / hyp）；cache2.py 生成画图用的双曲线构型；check.py、check2.py 虚点列表与反向检查 |
| figures | 示意图 | fig_r4.py 正文两张示意图；fig_r4c.py 圆图（r4c_编号.png）；fig_r4h.py 双曲线图（r4h_编号.png） |

## 第三阶段流程（stage3）

需要先准备 ETC Part 1、Part 2 的纯文本，存为 part1.txt、part2.txt（来自 faculty.evansville.edu/ck6/encyclopedia/ETC.html，为版权起见没有附带）。然后依次运行：

1. parse.py：按条目切分 ETC 文本，生成 ents.json。
2. builddb.py：把每个中心的坐标公式解析成 sympy 表达式，生成 db_expr.json（已附带一份，可跳过 1、2）。
3. evaldb.py：给定三角形顶点，计算全部中心，多个公式互相核对。
4. validate.py：用 ETC 列出的共线关系逐步验证，得到 753 个可靠中心。
5. bigdb.py、bigall.py：在 8 个随机三角形上计算可靠点和全部点（含外心、切点、切线三角形）。
6. bigscan.py：圆周角法找共圆候选；bigverify.py：8 个三角形上复核，得到 623 个圆。
7. sieve.py、sieve2.py、sieve3.py：筛子 1–3。
8. omega.py、reduce*.py、closure*.py：筛子 4–6（早期宽口径版本）。
9. recheck.py：严格口径重算，正文数字以它为准（141 / 301 / 181，321 条关系）。
10. identw.py、etcmatch.py、task2.py、ident2.py、inv2.py、derived.py、feat*.py、comention.py、simplest.py、lit.py：识别反演圆、核对 ETC 记载、补充机制等辅助脚本。
11. invsearch.py：在 ETC 文本里逐条检索附录 B 的两点反演关系。

## 判据

- 共圆：4×4 行列式按列归一化后 < 10⁻¹⁰，8 个随机三角形全部成立；含三点共线的四点组剔除。
- 关键结果用整数边长三角形做有理数精确验证。

## 注意

脚本是研究过程中写的，部分脚本里有写死的绝对路径（如画图脚本的 D = '/tmp/...'），运行前改成自己的目录。stage3 的脚本之间通过 .pkl 中间文件衔接，需按上面的顺序运行。
