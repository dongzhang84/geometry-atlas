/* 几何图谱 · 卡片缩略图
 * 每张图都是现场算出来的 SVG，不是图片。
 *   · 第一次滚进视野：线条自己画出来，一次性。
 *   · 鼠标放上去：图形活过来——底边钉死、顶点来回走，3.5 秒一轮，循环。
 *     关系在形变中始终成立，这正是那条定理本身。移开后平滑收回原状。
 * 触屏设备没有悬停，改成滚进视野就动，滚走就停。
 * 依赖 geometry.js（window.GA）。 */
(function () {
  const GA = window.GA;
  const { sub, add, mul, mid, len, foot, circumcircle, triangleData, ninePoints,
          nagelData, soddyData, conicThrough, conicCenter } = GA;

  const W = 200, H = 140;
  const LOOP = 3500;          // 一轮 3.5 秒
  const AMP  = 0.38;          // 形变幅度：比视频小得多，小图里才不晃眼

  /* ---------- 三角形：底边钉死，只动顶点 A（和视频同一个构型） ---------- */
  const BASE = { A: { x: 48, y: 10 }, B: { x: 15, y: 130 }, C: { x: 185, y: 130 } };

  /* 共点与共线这一族单独换形状。四十多张卡片全是同一个三角形，排在一起太像复制品；
     这一族的三条讲的又正好是「换个三角形照样成立」，更不该都长一个样。
     每条写死一个（不是渲染时随机）—— 卡片要是每次刷新都变，列表看着会晃。 */
  const SHAPES = {
    C01: { A: { x: 72, y: 14 }, B: { x: 12, y: 128 }, C: { x: 180, y: 128 } },
    C02: { A: { x: 118, y: 20 }, B: { x: 18, y: 126 }, C: { x: 190, y: 126 } },
    C03: { A: { x: 54, y: 24 }, B: { x: 14, y: 124 }, C: { x: 176, y: 124 } },
    C04: { A: { x: 96, y: 12 }, B: { x: 16, y: 130 }, C: { x: 186, y: 130 } },
    C05: { A: { x: 60, y: 16 }, B: { x: 20, y: 128 }, C: { x: 192, y: 128 } },
    C06: { A: { x: 130, y: 18 }, B: { x: 14, y: 126 }, C: { x: 184, y: 126 } },
    // 拿破仑那张要装下三个外接正三角形，三角形本身得画小一点
    B01: { A: { x: 104, y: 44 }, B: { x: 52, y: 110 }, C: { x: 152, y: 108 } },
    B02: { A: { x: 76, y: 14 }, B: { x: 18, y: 128 }, C: { x: 188, y: 128 } },
    // 射影四条：Pascal / Brianchon 拿外接圆当圆锥曲线，所以三角形要画小、给圆让位
    P01: { A: { x: 112, y: 40 }, B: { x: 56, y: 106 }, C: { x: 150, y: 104 } },
    P02: { A: { x: 108, y: 44 }, B: { x: 58, y: 104 }, C: { x: 146, y: 100 } },
    P03: { A: { x: 30, y: 20 }, B: { x: 110, y: 126 }, C: { x: 190, y: 52 } },
    P04: { A: { x: 53.2, y: 21.1 }, B: { x: 176.1, y: 53.1 }, C: { x: 43.4, y: 115.1 } },
    // 圆这一族：三角形只是用来摆圆心（K02 / K03）或给出外接圆（K01）、三条边（K04）
    K01: { A: { x: 118, y: 26 }, B: { x: 170, y: 104 }, C: { x: 74, y: 112 } },
    K02: { A: { x: 46, y: 96 }, B: { x: 158, y: 96 }, C: { x: 104, y: 24 } },
    // K03 是排了四个方案挨个看出来的，不是搜出来的 —— 盲搜一直在两头撞墙：
    // 半径接近 ⟹ 分母 (r₂−r₁) 小 ⟹ 外位似中心飞远 ⟹ 画框大 ⟹ 三个圆缩成小点；
    // 半径悬殊 ⟹ 中心近、画框紧，可读起来是「一个大圆加两个点」。
    // 9/17/34 是中间那一档，三个圆都还是圆，中心也没飞。
    K03: { A: { x: 52, y: 104 }, B: { x: 128, y: 96 }, C: { x: 88, y: 34 } },
    K04: { A: { x: 30, y: 116 }, B: { x: 178, y: 116 }, C: { x: 92, y: 24 } },
    K05: { A: { x: 100, y: 18 }, B: { x: 26, y: 104 }, C: { x: 174, y: 104 } },
    K06: { A: { x: 56, y: 92 }, B: { x: 150, y: 86 }, C: { x: 104, y: 30 } },
    K08: { A: { x: 100, y: 20 }, B: { x: 28, y: 106 }, C: { x: 172, y: 106 } },
    // 度量这一族。勾股和余弦要给三边的正方形留地方，三角形画小一点
    M01: { A: { x: 74, y: 44 }, B: { x: 74, y: 100 }, C: { x: 130, y: 100 } },
    M02: { A: { x: 74, y: 26 }, B: { x: 32, y: 108 }, C: { x: 166, y: 92 } },
    M03: { A: { x: 82, y: 48 }, B: { x: 60, y: 98 }, C: { x: 128, y: 92 } },
    M04: { A: { x: 92, y: 20 }, B: { x: 24, y: 116 }, C: { x: 178, y: 116 } },
    M05: { A: { x: 70, y: 28 }, B: { x: 34, y: 104 }, C: { x: 142, y: 104 } },
    M06: { A: { x: 92, y: 22 }, B: { x: 22, y: 116 }, C: { x: 178, y: 116 } },
    M07: { A: { x: 86, y: 24 }, B: { x: 20, y: 118 }, C: { x: 180, y: 118 } },
    // 四条边 118 / 98 / 58 / 67，<b>对边之比 2.05 和 1.45</b> —— 两对正方形大小明显不同，
    // 不会像第一版那样长成一个对称的十字
    B03: { A: { x: 40, y: 34 }, B: { x: 158, y: 26 }, C: { x: 120, y: 116 } },
    // 不等式这两张要<b>明显不等边</b>：R ≥ 2r 很紧，三角形一「胖」缺口就看不见了
    I01: { A: { x: 54, y: 30 }, B: { x: 28, y: 112 }, C: { x: 172, y: 112 } },
    I02: { A: { x: 54, y: 30 }, B: { x: 28, y: 112 }, C: { x: 172, y: 112 } },
  };
  /** 等边位置：底边不动，A 抬到正上方 */
  const apexOf = (T) => ({ x: (T.B.x + T.C.x) / 2,
                           y: T.B.y - (T.C.x - T.B.x) * Math.sqrt(3) / 2 });
  let SHAPE = BASE, APEX = apexOf(BASE);
  const verts = (k) => ({
    A: { x: SHAPE.A.x + (APEX.x - SHAPE.A.x) * k, y: SHAPE.A.y + (APEX.y - SHAPE.A.y) * k },
    B: SHAPE.B, C: SHAPE.C,
  });

  /* ---------- SVG 片段 ---------- */
  const f = (n) => (Math.round(n * 100) / 100);
  const line = (p, q, cls) =>
    `<line class="${cls}" x1="${f(p.x)}" y1="${f(p.y)}" x2="${f(q.x)}" y2="${f(q.y)}"/>`;
  const circle = (c, cls) =>
    `<circle class="${cls}" cx="${f(c.x)}" cy="${f(c.y)}" r="${f(c.r)}"/>`;
  /** 第三个参数是半径。画框被一条长线撑大时，写死的 2.6 缩放后只剩 1 像素，
      点就看不见了（Monge 那张的画框 357 宽，橙点只剩 1.4px）。 */
  const dot = (p, cls, r) =>
    `<circle class="pt ${cls || ''}" cx="${f(p.x)}" cy="${f(p.y)}" r="${r || 2.6}"/>`;
  const tri = (P, Q, R, cls) =>
    `<path class="${cls || 'tri'}" d="M${f(P.x)} ${f(P.y)}L${f(Q.x)} ${f(Q.y)}L${f(R.x)} ${f(R.y)}Z"/>`;
  /** 填一块多边形（翅膀之类）。svg.thumb * 默认 fill:none，所以填充色要写在 class 里 */
  const poly = (pts, cls) =>
    `<path class="${cls}" d="${pts.map((p, i) => (i ? 'L' : 'M') + f(p.x) + ' ' + f(p.y)).join('')}Z"/>`;
  const ellipse = (el, cls) =>
    `<ellipse class="${cls}" cx="${f(el.cx)}" cy="${f(el.cy)}" rx="${f(el.rx)}" ry="${f(el.ry)}"` +
    ` transform="rotate(${f(el.ang)} ${f(el.cx)} ${f(el.cy)})"/>`;

  /** 一段弧：圆心 c、半径 r，围绕角度 a0 两侧各 half 弧度 */
  function arcSeg(c, r, a0, half, cls) {
    const p0 = { x: c.x + r * Math.cos(a0 - half), y: c.y + r * Math.sin(a0 - half) };
    const p1 = { x: c.x + r * Math.cos(a0 + half), y: c.y + r * Math.sin(a0 + half) };
    const big = half > Math.PI / 2 ? 1 : 0;
    return `<path class="${cls}" d="M${f(p0.x)} ${f(p0.y)}A${f(r)} ${f(r)} 0 ${big} 1 ${f(p1.x)} ${f(p1.y)}"/>`;
  }
  function long(P, Q, k) {
    const d = sub(Q, P), L = len(d) || 1, u = mul(d, (k || 115) / L);
    return [sub(mid(P, Q), u), add(mid(P, Q), u)];
  }
  function conicEllipse(co) {
    const [a, b, c, d, e, g] = co;
    if (b * b - 4 * a * c >= 0) return null;
    const ctr = conicCenter(co);
    if (!ctr) return null;
    const g2 = g + (d * ctr.x + e * ctr.y) / 2;
    const tr = a + c, dt = a * c - b * b / 4;
    const disc = Math.sqrt(Math.max(tr * tr / 4 - dt, 0));
    const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
    if (l1 * g2 >= 0 || l2 * g2 >= 0) return null;
    return { cx: ctr.x, cy: ctr.y, rx: Math.sqrt(-g2 / l1), ry: Math.sqrt(-g2 / l2),
             ang: 0.5 * Math.atan2(b, a - c) * 180 / Math.PI };
  }

  /** 分子段 / 分母段：就画在边上，不偏移。
      视频里两段各往一侧偏开是为了显示正负号；缩略图只有 200×140，一偏就成了断线，
      而且三角形的边会被切得七零八落。小图里连续比符号重要，正负号交给视频和大图。 */
  const seg2 = (P, Q, cls) => line(P, Q, cls === 'num' ? 'numseg' : 'denseg');

  /** 刻度：线段中部打 n 道短垂线。小图里只打一道会看不出，所以线要够粗。 */
  function ticks(P, Q, n, cls) {
    const d = sub(Q, P), L = Math.max(len(d), 1e-9);
    const u = { x: d.x / L, y: d.y / L }, nv = { x: -u.y, y: u.x };
    const m = mid(P, Q), gap = 3.4, half = 4.2, out = [];
    for (let k = 0; k < n; k++) {
      const o = (k - (n - 1) / 2) * gap, c = { x: m.x + u.x * o, y: m.y + u.y * o };
      out.push(line({ x: c.x - nv.x * half, y: c.y - nv.y * half },
                    { x: c.x + nv.x * half, y: c.y + nv.y * half }, cls || 'tick'));
    }
    return out;
  }

  /* ---------- 射影四条共用的小工具 ---------- */
  const PJ_BASE6 = [-0.083, 0.852, 2.341, 3.219, 4.011, 5.36];   // 和大图同一组，理由见 figures.js
  /* Pascal / Brianchon 这两张<b>不能靠形变三角形来动</b>：图上只用到三角形的外接圆，
     形变三角形等于挪动和缩放那个圆，整张图就只是放大缩小，什么都没演示。
     正确的动法是<b>圆钉死，六个点在圆上滑</b> —— 这才是定理本身：点随便动，
     三个交点始终共线（对偶地，三条对角线始终共点）。
     六个增量是验过的：整段形变里最小间隔 ≥ 0.73、Pascal 交点 ≤ 0.67R、
     结论线与各边夹角 ≥ 20°、Brianchon 顶点 ≤ 1.37R，不会崩。 */
  const PJ_SWING = [0.5, 0.9, -0.4, -0.8, 0.3, 0.7];
  const pjAng = (k) => PJ_BASE6.map((a, i) => a + (k || 0) * PJ_SWING[i]);
  const PJ_ORD6 = [0, 4, 1, 3, 5, 2];        // 交叉六边形：三个交点全落在 0.75R 以内
  const xl2 = (P1, P2, P3, P4) => {
    const d1 = sub(P2, P1), d2 = sub(P4, P3), den = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(den) < 1e-9) return null;
    const w = sub(P3, P1), k = (w.x * d2.y - w.y * d2.x) / den;
    return { x: P1.x + d1.x * k, y: P1.y + d1.y * k };
  };
  /** 结论线：取最远的一对交点当端点再往两头延 */
  const thru = (X, e) => {
    let bi = [0, 1], bd = -1;
    [[0, 1], [1, 2], [0, 2]].forEach((ij) => {
      const d = len(sub(X[ij[0]], X[ij[1]])); if (d > bd) { bd = d; bi = ij; }
    });
    const p = X[bi[0]], q = X[bi[1]], d = sub(q, p);
    return [{ x: p.x - d.x * e, y: p.y - d.y * e }, { x: q.x + d.x * e, y: q.y + d.y * e }];
  };
  /** 只画伸出线段之外的那一截，压在白边上会看成断线 */
  const extS = (P1, P2, q, cls) => {
    const d = sub(P2, P1), L2 = d.x * d.x + d.y * d.y;
    const sp = ((q.x - P1.x) * d.x + (q.y - P1.y) * d.y) / L2;
    return (sp >= 0 && sp <= 1) ? null : line(sp < 0 ? P1 : P2, q, cls);
  };

  /* ---------- 圆这一族共用的小工具 ---------- */
  const RADR = [17, 22, 15.5];                 // K02 三个圆的半径（缩略图尺度）
  const MONR = [9, 17, 34];                    // K03：理由见 SHAPES.K03 那段注释
  const tanPtT = (P, c, r, sgn) => {
    const d = sub(c, P), L = len(d);
    if (L <= r + 1e-6) return null;
    const tl = Math.sqrt(L * L - r * r), b = Math.asin(r / L) * sgn, ux = { x: d.x / L, y: d.y / L };
    return { x: P.x + (ux.x * Math.cos(b) - ux.y * Math.sin(b)) * tl,
             y: P.y + (ux.x * Math.sin(b) + ux.y * Math.cos(b)) * tl };
  };
  const radAxT = (c1, r1, c2, r2) => {
    const d = sub(c2, c1), L = len(d);
    if (L < 1e-6) return null;
    const ux = { x: d.x / L, y: d.y / L }, k = (L * L + r1 * r1 - r2 * r2) / (2 * L);
    return { f: { x: c1.x + ux.x * k, y: c1.y + ux.y * k }, d: { x: -ux.y, y: ux.x } };
  };
  const axMeetT = (a, b) => {
    const den = a.d.x * b.d.y - a.d.y * b.d.x;
    if (Math.abs(den) < 1e-9) return null;
    const w = sub(b.f, a.f), t = (w.x * b.d.y - w.y * b.d.x) / den;
    return { x: a.f.x + a.d.x * t, y: a.f.y + a.d.y * t };
  };
  const extCenT = (c1, r1, c2, r2) => (Math.abs(r2 - r1) < 1e-6 ? null
    : { x: (r2 * c1.x - r1 * c2.x) / (r2 - r1), y: (r2 * c1.y - r1 * c2.y) / (r2 - r1) });
  /** 把一条无限长的直线裁到一个盒子里。
      缩略图的画框是 getBBox 算的，<b>没法像大图那样把直线排除在外</b> —— 根轴往两头
      随便画 60 就把画框压成 1.03 的方块、三个圆缩到只占画宽 21%。所以必须自己裁。 */
  function clipLine(f, d, bx) {
    let t0 = -1e9, t1 = 1e9;
    const lim = (p, q, lo, hi) => {              // p + t·q 落在 [lo, hi] 内的 t 区间
      if (Math.abs(q) < 1e-9) return p >= lo && p <= hi;
      const a = (lo - p) / q, b = (hi - p) / q;
      t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b));
      return true;
    };
    if (!lim(f.x, d.x, bx[0], bx[1]) || !lim(f.y, d.y, bx[2], bx[3]) || t0 >= t1) return null;
    return [{ x: f.x + d.x * t0, y: f.y + d.y * t0 }, { x: f.x + d.x * t1, y: f.y + d.y * t1 }];
  }
  function circumT(A, B, C) {
    const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
    if (Math.abs(d) < 1e-9) return null;
    const a2 = A.x * A.x + A.y * A.y, b2 = B.x * B.x + B.y * B.y, c2 = C.x * C.x + C.y * C.y;
    const o = { x: (a2 * (B.y - C.y) + b2 * (C.y - A.y) + c2 * (A.y - B.y)) / d,
                y: (a2 * (C.x - B.x) + b2 * (A.x - C.x) + c2 * (B.x - A.x)) / d };
    return { x: o.x, y: o.y, r: len(sub(o, A)) };
  }

  /** 内心和内切圆半径 */
  function incirc(g) {
    const a = len(sub(g.C, g.B)), b = len(sub(g.A, g.C)), c = len(sub(g.B, g.A));
    const p = a + b + c;
    if (p < 1e-6) return null;
    const ar = Math.abs((g.B.x - g.A.x) * (g.C.y - g.A.y) - (g.C.x - g.A.x) * (g.B.y - g.A.y)) / 2;
    return { I: { x: (a * g.A.x + b * g.B.x + c * g.C.x) / p,
                  y: (a * g.A.y + b * g.B.y + c * g.C.y) / p },
             r: ar / (p / 2) };
  }
  /* ---------- 度量这一族共用 ---------- */
  /** 在线段 PQ 的「远离 G」那一侧作正方形 */
  function sqOutT(P, Q, G) {
    const d = sub(Q, P);
    let n = { x: d.y, y: -d.x };
    const m = { x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 };
    if (len(sub({ x: m.x + n.x, y: m.y + n.y }, G)) < len(sub({ x: m.x - n.x, y: m.y - n.y }, G)))
      n = { x: -n.x, y: -n.y };
    return [P, Q, { x: Q.x + n.x, y: Q.y + n.y }, { x: P.x + n.x, y: P.y + n.y }];
  }
  const polyOf = (pts, cls) => poly(pts, cls);
  const cenOf = (a, b, c) => ({ x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 });
  const angT = (P, Q, R2) => {
    const d1 = sub(Q, P), d2 = sub(R2, P);
    return Math.abs(Math.atan2(d1.x * d2.y - d1.y * d2.x, d1.x * d2.x + d1.y * d2.y));
  };

  /** 给定形变参数 k，把这张图要用到的点和圆都算出来 */
  function geom(k) {
    const { A, B, C } = verts(k);
    const T = triangleData(A, B, C);
    return { A, B, C, T,
      NP: ninePoints(A, B, C),
      nine: { x: T.N.x, y: T.N.y, r: T.r9 },
      circum: { x: T.O.x, y: T.O.y, r: T.R },
      incir: { x: T.I.x, y: T.I.y, r: T.r } };
  }

  /* ---------- 每条定理画什么 ---------- */
  const DRAW = {
    // 欧拉线：O、G、H 共线
    /* ── 共点与共线 ───────────────────────────────────────── */
    // 三角形的四心：四族线各自交于一点，四个点同色 —— 它们是同一类东西
    C01: (g) => {
      const { A, B, C, T } = g;
      const a = len(sub(C, B)), b = len(sub(A, C)), c = len(sub(B, A));
      const bis = [add(B, mul(sub(C, B), c / (b + c))),
                   add(C, mul(sub(A, C), a / (c + a))),
                   add(A, mul(sub(B, A), b / (a + b)))];
      const out = [tri(A, B, C)];
      [[A, mid(B, C)], [B, mid(C, A)], [C, mid(A, B)]].forEach(([p, q]) => out.push(line(p, q, 'med')));
      [[A, B, C], [B, C, A], [C, A, B]].forEach(([p, q, r]) => out.push(line(p, foot(p, q, r), 'alt2')));
      [A, B, C].forEach((p, i) => out.push(line(p, bis[i], 'amb')));
      return out.concat([T.G, T.O, T.I, T.H].map((q) => dot(q, 'key')));
    },
    // Ceva：三条塞瓦线共点，六段交替染色 —— 颜色就是分式的上下
    C02: (g) => {
      const { A, B, C, T } = g;
      const P = { x: T.G.x + 14, y: T.G.y - 9 };          // 一般的点，不要取成重心
      const ix = (p1, p2, p3, p4) => {
        const d1 = sub(p2, p1), d2 = sub(p4, p3), den = d1.x * d2.y - d1.y * d2.x;
        if (Math.abs(den) < 1e-9) return null;
        const t = ((p3.x - p1.x) * d2.y - (p3.y - p1.y) * d2.x) / den;
        return { x: p1.x + d1.x * t, y: p1.y + d1.y * t };
      };
      const X = ix(A, P, B, C), Y = ix(B, P, C, A), Z = ix(C, P, A, B);
      if (!X || !Y || !Z) return [tri(A, B, C)];
      return [tri(A, B, C, 'tri dim'),
              seg2(B, X, 'num'), seg2(X, C, 'den'),
              seg2(C, Y, 'num'), seg2(Y, A, 'den'),
              seg2(A, Z, 'num'), seg2(Z, B, 'den'),
              line(A, X, 'thin'), line(B, Y, 'thin'), line(C, Z, 'thin'),
              dot(X), dot(Y), dot(Z), dot(P, 'key')];
    },
    // Menelaus：一条横截线切三边所在直线，一个交点落在延长线上 —— 负号就在那儿
    C03: (g) => {
      const { A, B, C } = g;
      // 先定 X 在直线 BC 上的位置（只伸出 C 一点点），再由 Z、X 截出 Y。
      // 反过来先定 Z、Y 再求 X 的话，换个三角形 X 就飞到老远，fit() 为了装下它
      // 会把整张图缩没 —— 大图那边踩过同一个坑。
      const X = { x: B.x + (C.x - B.x) * 1.26, y: B.y + (C.y - B.y) * 1.26 };
      const Z = { x: A.x + (B.x - A.x) * 0.36, y: A.y + (B.y - A.y) * 0.36 };
      const ix = (p1, p2, p3, p4) => {
        const d1 = sub(p2, p1), d2 = sub(p4, p3), den = d1.x * d2.y - d1.y * d2.x;
        if (Math.abs(den) < 1e-9) return null;
        const t = ((p3.x - p1.x) * d2.y - (p3.y - p1.y) * d2.x) / den;
        return { x: p1.x + d1.x * t, y: p1.y + d1.y * t };
      };
      const Y = ix(Z, X, C, A);
      if (!Y) return [tri(A, B, C)];
      const d = sub(X, Z);
      // BC 的延长线要沿着 BC 的方向延，不是沿横截线的方向 —— 原来用错了方向向量，
      // 这条虚线斜着岔出去，和底边根本不共线。
      const e = sub(C, B);
      return [line(B, { x: C.x + e.x * 0.30, y: C.y + e.y * 0.30 }, 'ext'),
              tri(A, B, C, 'tri dim'),
              seg2(C, Y, 'num'), seg2(Y, A, 'den'),
              seg2(A, Z, 'num'), seg2(Z, B, 'den'),
              seg2(B, C, 'num'), seg2(C, X, 'den'),   // 出界那条：BC 整条是分子，C→X 是分母
              line({ x: Z.x - d.x * 0.14, y: Z.y - d.y * 0.14 },
                   { x: X.x + d.x * 0.10, y: X.y + d.y * 0.10 }, 'ln'),
              dot(X, 'key'), dot(Y), dot(Z)];
    },
    // Gergonne 点：内切圆的切点连对顶。刻度成对挨在同一个顶点两侧 —— 两条切线等长
    C04: (g) => {
      const { A, B, C, T } = g;
      const a = len(sub(C, B)), b = len(sub(A, C)), c = len(sub(B, A)), s2 = (a + b + c) / 2;
      const at = (P, Q, t) => { const d = sub(Q, P), L = Math.max(len(d), 1e-9);
                                return { x: P.x + d.x / L * t, y: P.y + d.y / L * t }; };
      const X = at(B, C, s2 - b), Y = at(C, A, s2 - c), Z = at(A, B, s2 - a);
      const w = [1 / (s2 - a), 1 / (s2 - b), 1 / (s2 - c)], sw = w[0] + w[1] + w[2];
      const Ge = { x: (A.x * w[0] + B.x * w[1] + C.x * w[2]) / sw,
                   y: (A.y * w[0] + B.y * w[1] + C.y * w[2]) / sw };
      return [tri(A, B, C), circle(g.incir, 'inc'),
              line(A, X, 'med'), line(B, Y, 'med'), line(C, Z, 'med')]
        .concat(ticks(A, Z, 1), ticks(A, Y, 1), ticks(B, X, 2), ticks(B, Z, 2),
                ticks(C, Y, 3), ticks(C, X, 3),
                [X, Y, Z].map((q) => dot(q, 'amb')), [dot(Ge, 'key')]);
    },
    // Nagel 点：旁切圆的切点连对顶。同一种长度分在两条不同的边上 —— 望远镜式约掉
    C05: (g) => {
      const { A, B, C } = g;
      const a = len(sub(C, B)), b = len(sub(A, C)), c = len(sub(B, A)), s2 = (a + b + c) / 2;
      const at = (P, Q, t) => { const d = sub(Q, P), L = Math.max(len(d), 1e-9);
                                return { x: P.x + d.x / L * t, y: P.y + d.y / L * t }; };
      const X = at(B, C, s2 - c), Y = at(C, A, s2 - a), Z = at(A, B, s2 - b);
      const n = nagelData(A, B, C);
      return [tri(A, B, C), line(A, X, 'med'), line(B, Y, 'med'), line(C, Z, 'med')]
        .concat(ticks(B, X, 3), ticks(X, C, 2), ticks(C, Y, 1),
                ticks(Y, A, 3), ticks(A, Z, 2), ticks(Z, B, 1),
                [X, Y, Z].map((q) => dot(q, 'amb')), [dot(n.Na, 'key')]);
    },
    // Fermat 点：到三顶点距离之和最小；三条连线两两成 120°
    C06: (g) => {
      const { A, B, C, T } = g;
      let F = { x: T.G.x, y: T.G.y };
      for (let k = 0; k < 120; k++) {
        let wx = 0, wy = 0, ws = 0;
        [A, B, C].forEach((V) => { const d = Math.max(len(sub(F, V)), 1e-7);
          wx += V.x / d; wy += V.y / d; ws += 1 / d; });
        F = { x: wx / ws, y: wy / ws };
      }
      const R = Math.max(len(sub(A, T.O)), 1e-6), r = R * 0.17;
      const arcs = [[A, B], [B, C], [C, A]].map(([U, V]) => {
        const a1 = Math.atan2(U.y - F.y, U.x - F.x), a2 = Math.atan2(V.y - F.y, V.x - F.x);
        let d = a2 - a1; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
        const pad = 0.15 * Math.sign(d);
        return arcSeg(F, r, (a1 + a2) / 2 + (Math.abs(a2 - a1) > Math.PI ? Math.PI : 0),
                      Math.abs(d / 2) - Math.abs(pad), 'hi');
      });
      return [tri(A, B, C), line(F, A, 'amb2'), line(F, B, 'amb2'), line(F, C, 'amb2')]
        .concat(arcs, [dot(F, 'key')]);
    },
    /* ── 不等式 ───────────────────────────────────────────── */
    /* 欧拉公式：外接圆 + 内切圆 + 线段 OI，再加过 I 的那条弦 AX。
       形变动顶点 A —— OI 跟着变，而 OI² = R² − 2Rr 一直成立 */
    I01: (g) => {
      const c = incirc(g); if (!c) return [tri(g.A, g.B, g.C, 'tri')];
      const O = g.circum;
      const d = sub(c.I, g.A), L = len(d);
      if (L < 1e-6) return [tri(g.A, g.B, g.C, 'tri')];
      const u = mul(d, 1 / L);
      const X = { x: g.A.x + u.x * 2 * ((O.x - g.A.x) * u.x + (O.y - g.A.y) * u.y),
                  y: g.A.y + u.y * 2 * ((O.x - g.A.x) * u.x + (O.y - g.A.y) * u.y) };
      return [circle(O, 'conic'), circle({ x: c.I.x, y: c.I.y, r: c.r }, 'grnp2'),
              tri(g.A, g.B, g.C, 'tri'),
              line(g.A, X, 'amb2'), line(X, g.B, 'purd'), line(X, g.C, 'purd'),
              line(O, c.I, 'keyd'),
              dot(g.A), dot(g.B), dot(g.C), dot(X, '', 3.0),
              dot(O, 'key', 3.2), dot(c.I, '', 3.0)];
    },
    /* 欧拉不等式：就画两个圆和 OI。<b>形变把三角形推向正三角形</b> ——
       内切圆相对越长越大、两个圆心越走越近，这本身就是 R ≥ 2r 在收紧。
       R 和 2r 的对比条在缩略图这个尺寸下只是几条斜线，读不出来，不画 */
    I02: (g) => {
      const c = incirc(g); if (!c) return [tri(g.A, g.B, g.C, 'tri')];
      const O = g.circum;
      return [circle(O, 'conic'), circle({ x: c.I.x, y: c.I.y, r: c.r }, 'grnp2'),
              tri(g.A, g.B, g.C, 'tri'), line(O, c.I, 'keyd'),
              dot(g.A), dot(g.B), dot(g.C), dot(O, 'key', 3.4), dot(c.I, '', 3.2)];
    },
    /* ── 度量 ─────────────────────────────────────────────── */
    /* 勾股：直角三角形 + 三个正方形。<b>形变动的是两条直角边的比</b>，
       直角始终保持 —— 形变三角形的话直角就没了，这条定理的前提都不在 */
    M01: (g, k) => {
      const G0 = geom(0), kk = k || 0;
      const C = G0.B, q = len(sub(G0.C, G0.B)), p = len(sub(G0.A, G0.B)) * (1 + 1.15 * kk);
      const e = { x: (G0.C.x - C.x) / q, y: (G0.C.y - C.y) / q }, nv = { x: -e.y, y: e.x };
      const B2 = { x: C.x + e.x * q, y: C.y + e.y * q };
      const A2 = { x: C.x + nv.x * p, y: C.y + nv.y * p };
      const G = cenOf(A2, B2, C);
      const out = [];
      [[C, B2, 'medp2'], [A2, C, 'grnp2'], [B2, A2, 'amb2']].forEach(([P, Q, cls]) => {
        const S4 = sqOutT(P, Q, G);
        out.push(poly(S4, cls + ' fillsq'));
        [0, 1, 2, 3].forEach((i) => out.push(line(S4[i], S4[(i + 1) % 4], cls)));
      });
      out.push(tri(A2, B2, C, 'tri'));
      return out.concat([A2, B2, C].map((z) => dot(z)));
    },
    /* 正弦：外接圆 + 三角形 + 直径。<b>A 沿弧滑动</b>，边 a 和对角都不变 —— 比值当然不变 */
    M02: (g, k) => {
      const G0 = geom(0), O = G0.circum, R = O.r, kk = k || 0;
      const B = G0.B, C = G0.C;
      const th0 = Math.atan2(G0.A.y - O.y, G0.A.x - O.x);
      const A = { x: O.x + R * Math.cos(th0 + kk * 1.1), y: O.y + R * Math.sin(th0 + kk * 1.1) };
      const Bp = { x: 2 * O.x - B.x, y: 2 * O.y - B.y };
      return [circle(O, 'conic'), line(A, B, 'aux'), line(A, C, 'aux'),
              line(B, C, 'amb2'), line(B, Bp, 'keyd'),
              dot(A, 'key'), dot(B), dot(C), dot(Bp, 'dimpt')];
    },
    /* 余弦：三个正方形。<b>形变动角 C</b> —— c² 跟着一个正方形变大变小，
       这正是 −2ab·cos C 在起作用 */
    M03: (g, k) => {
      const G0 = geom(0), kk = k || 0;
      const C = G0.C, b = len(sub(G0.A, C)), q = len(sub(G0.B, C));
      const th0 = Math.atan2(G0.A.y - C.y, G0.A.x - C.x);
      const A = { x: C.x + b * Math.cos(th0 + kk * 1.5), y: C.y + b * Math.sin(th0 + kk * 1.5) };
      const B = G0.B, G = cenOf(A, B, C);
      const out = [];
      [[C, B, 'medp2'], [A, C, 'grnp2'], [B, A, 'amb2']].forEach(([P, Q, cls]) => {
        const S4 = sqOutT(P, Q, G);
        out.push(poly(S4, cls + ' fillsq'));
        [0, 1, 2, 3].forEach((i) => out.push(line(S4[i], S4[(i + 1) % 4], cls)));
      });
      out.push(tri(A, B, C, 'tri'));
      return out.concat([A, B, C].map((z) => dot(z)));
    },
    /* 角平分线：分子琥珀、分母蓝。形变动顶点 A，比值始终相等 */
    M04: (g) => {
      const b = len(sub(g.C, g.A)), c = len(sub(g.A, g.B));
      if (b + c < 1e-6) return [tri(g.A, g.B, g.C)];
      const D = { x: (b * g.B.x + c * g.C.x) / (b + c), y: (b * g.B.y + c * g.C.y) / (b + c) };
      return [line(g.B, g.C, 'aux'), line(g.A, D, 'thin'),
              line(g.B, D, 'amb2'), line(D, g.C, 'medp2'),
              line(g.A, g.B, 'amb2'), line(g.A, g.C, 'medp2'),
              dot(g.A), dot(g.B), dot(g.C), dot(D, 'key', 3.4)];
    },
    /* 中线长：补成平行四边形，两条对角线 a 和 2m */
    M05: (g) => {
      const M = { x: (g.B.x + g.C.x) / 2, y: (g.B.y + g.C.y) / 2 };
      const Ap = { x: g.B.x + g.C.x - g.A.x, y: g.B.y + g.C.y - g.A.y };
      return [poly([g.A, g.B, Ap, g.C], 'parafill'),
              tri(g.A, g.B, g.C, 'tri'),
              line(Ap, g.B, 'grnp2'), line(Ap, g.C, 'grnp2'),
              line(g.B, g.C, 'medp2'), line(g.A, Ap, 'amb2'),
              dot(g.A), dot(g.B), dot(g.C), dot(Ap, 'dimpt'), dot(M, 'key', 3.4)];
    },
    /* Stewart：塞瓦线 AD。<b>形变让 D 在 BC 上滑</b> —— m、n、d 全变，等式不变 */
    M06: (g, k) => {
      const t = 0.26 + 1.25 * (k || 0);
      const D = { x: g.B.x + (g.C.x - g.B.x) * t, y: g.B.y + (g.C.y - g.B.y) * t };
      return [line(g.A, g.B, 'amb2'), line(g.A, g.C, 'medp2'),
              line(g.B, D, 'grnp2'), line(D, g.C, 'redp'),
              line(g.A, D, 'keyd'),
              dot(g.A), dot(g.B), dot(g.C), dot(D, 'key', 3.4)];
    },
    /* 海伦：三条切线长，<b>每条在周界上出现两次</b>（刻度一/二/三道）。
       形变动顶点 A —— 三段跟着变，但「各出现两次」这件事不变 */
    M07: (g) => {
      const a = len(sub(g.C, g.B)), b = len(sub(g.A, g.C)), c = len(sub(g.B, g.A));
      const s = (a + b + c) / 2;
      if (s < 1e-6 || a + b <= c || b + c <= a || c + a <= b) return [tri(g.A, g.B, g.C, 'tri')];
      const ar = Math.abs((g.B.x - g.A.x) * (g.C.y - g.A.y) - (g.C.x - g.A.x) * (g.B.y - g.A.y)) / 2;
      const I = { x: (a * g.A.x + b * g.B.x + c * g.C.x) / (a + b + c),
                  y: (a * g.A.y + b * g.B.y + c * g.C.y) / (a + b + c) };
      const at = (P, Q, d) => { const L = len(sub(Q, P));
        return { x: P.x + (Q.x - P.x) * d / L, y: P.y + (Q.y - P.y) * d / L }; };
      const Tc = at(g.A, g.B, s - a), Tb = at(g.A, g.C, s - a), Ta = at(g.B, g.C, s - b);
      const CL = ['amb2', 'medp2', 'purp2'];
      const out = [circle({ x: I.x, y: I.y, r: ar / s }, 'grnp2')];
      [[[g.A, Tc], [g.A, Tb]], [[g.B, Tc], [g.B, Ta]], [[g.C, Tb], [g.C, Ta]]]
        .forEach((pr, i) => pr.forEach(([P, Q]) => out.push(line(P, Q, CL[i]))));
      return out.concat([g.A, g.B, g.C].map((z) => dot(z)),
                        [Ta, Tb, Tc].map((z) => dot(z, 'dimpt', 2.0)));
    },
    /* Brahmagupta：圆内接四边形。<b>形变让 D 滑向 A</b> —— 边 d 缩到没，就剩一个三角形，
       公式退化成海伦 */
    M08: (g, k) => {
      const G0 = geom(0), O = G0.circum, R = O.r, kk = k || 0;
      const th = [2.30, 3.62, 5.05, 0.80];
      // 圆上按角度排是 D(0.80) → A(2.30) → B(3.62) → C(5.05)，所以边 d 是 D→A。
      // <b>要让 d 缩短，th[3] 得往 A 那边<i>增大</i></b>（第一版减小，反而把 d 拉长了）
      th[3] = 0.80 + (2.30 - 0.80 - 0.16) * Math.min(1, kk / 0.42);
      const Q = th.map((t) => ({ x: O.x + R * Math.cos(t), y: O.y + R * Math.sin(t) }));
      const CL = ['amb2', 'medp2', 'grnp2', 'purp2'];
      const out = [circle(O, 'conic'), poly(Q, 'cycfill')];
      Q.forEach((P, i) => out.push(line(P, Q[(i + 1) % 4], CL[i])));
      return out.concat(Q.map((z, i) => dot(z, i === 3 && kk > 0.34 ? 'dimpt' : '')));
    },
    /* 托勒密：两条对角线，AC 上的 K 把它切成两段。形变让 C 在圆上滑 */
    M09: (g, k) => {
      const G0 = geom(0), O = G0.circum, R = O.r, kk = k || 0;
      const th = [2.06, 3.42, 5.24 + 0.95 * kk, 0.77];
      const Q = th.map((t) => ({ x: O.x + R * Math.cos(t), y: O.y + R * Math.sin(t) }));
      const [A2, B2, C2, D2] = Q;
      const ang = (P0, U, V2) => { const d1 = sub(U, P0), d2 = sub(V2, P0);
        return Math.atan2(d1.x * d2.y - d1.y * d2.x, d1.x * d2.x + d1.y * d2.y); };
      const t2 = Math.atan2(A2.y - B2.y, A2.x - B2.x) + ang(B2, D2, C2);
      const u = { x: Math.cos(t2), y: Math.sin(t2) }, e = sub(C2, A2);
      const den = u.x * e.y - u.y * e.x;
      const K = Math.abs(den) < 1e-9 ? null
        : { x: B2.x + u.x * (((A2.x - B2.x) * e.y - (A2.y - B2.y) * e.x) / den),
            y: B2.y + u.y * (((A2.x - B2.x) * e.y - (A2.y - B2.y) * e.x) / den) };
      // <b>两组对边分色</b>：四条边全白的话，图上只剩一团线，看不出等式说的是哪两组乘积
      const SD = ['medp2', 'grnp2', 'medp2', 'grnp2'];
      const out = [circle(O, 'conic'), poly(Q, 'cycfill')];
      Q.forEach((P, i) => out.push(line(P, Q[(i + 1) % 4], SD[i])));
      out.push(line(B2, D2, 'aux'), line(A2, C2, 'keyd'));
      if (K) out.push(line(B2, K, 'amb2'));
      return out.concat(Q.map((z) => dot(z)), K ? [dot(K, 'key', 3.4)] : []);
    },
    /* Van Aubel：四边向外的正方形，对边配成同色一对。形变动顶点 A */
    B03: (g) => {
      const D4 = { x: 66, y: 96 };
      let Q = [g.A, g.B, g.C, D4];
      const sgn = Q.reduce((acc, z, i) => { const w = Q[(i + 1) % 4];
        return acc + z.x * w.y - w.x * z.y; }, 0);
      if (sgn < 0) Q = [Q[0], Q[3], Q[2], Q[1]];
      const PAIR = ['medp2', 'grnp2', 'medp2', 'grnp2'];
      const O = [], out = [];
      Q.forEach((P, i) => {
        const U = Q[(i + 1) % 4], d = sub(U, P), n = { x: d.y, y: -d.x };
        const S4 = [P, U, { x: U.x + n.x, y: U.y + n.y }, { x: P.x + n.x, y: P.y + n.y }];
        O.push({ x: (S4[0].x + S4[1].x + S4[2].x + S4[3].x) / 4,
                 y: (S4[0].y + S4[1].y + S4[2].y + S4[3].y) / 4 });
        out.push(poly(S4, PAIR[i] + ' fillsq'));
        S4.forEach((z, j) => out.push(line(z, S4[(j + 1) % 4], PAIR[i])));
      });
      Q.forEach((P, i) => out.push(line(P, Q[(i + 1) % 4], 'tri')));
      out.push(line(O[0], O[2], 'medp2'), line(O[1], O[3], 'grnp2'));
      return out.concat(Q.map((z) => dot(z)), O.map((z, i) => dot(z, '', 2.6)));
    },
    /* ── 圆 ─────────────────────────────────────────────── */
    /* 四张都遵守同一条：<b>舞台钉死（geom(0)），只动定理自己的自由度。</b>
       靠形变三角形来动的话，这四张都只是整体缩放平移，什么都没演示。 */
    // 圆幂：圆和 P 不动，割线绕 P 转 —— A、B 跑来跑去，切线长 PT 一动不动
    K01: (g, k) => {
      const G = geom(0), O = G.circum, R = O.r;
      const P = { x: O.x - R * 1.62, y: O.y + R * 0.22 };
      const th = 0.30 + (k || 0) * 1.5;
      const Q = { x: O.x + R * Math.cos(th), y: O.y + R * Math.sin(th) };
      const d = sub(Q, P), L2 = d.x * d.x + d.y * d.y;
      const f = sub(P, O), b = 2 * (f.x * d.x + f.y * d.y), c0 = f.x * f.x + f.y * f.y - R * R;
      const disc = b * b - 4 * L2 * c0;
      if (disc < 0) return [circle(O, 'conic')];
      const sq = Math.sqrt(disc), t1 = (-b - sq) / (2 * L2), t2 = (-b + sq) / (2 * L2);
      const A = { x: P.x + d.x * t1, y: P.y + d.y * t1 }, B = { x: P.x + d.x * t2, y: P.y + d.y * t2 };
      const T = tanPtT(P, O, R, +1);
      const out = [circle(O, 'conic'), line(P, B, 'medp2'), line(P, A, 'amb2')];
      if (T) out.push(line(P, T, 'thin'), dot(T, 'key'));
      return out.concat([dot(A), dot(B), dot(P, 'key')]);
    },
    // 根轴与根心：三个圆的圆心钉死，<b>半径呼吸</b> —— 三条根轴跟着挪，始终共点
    K02: (g, k) => {
      const G = geom(0), C3 = [G.A, G.B, G.C];
      const kk = k || 0;
      const R = [RADR[0] * (1 + 0.55 * kk), RADR[1] * (1 - 0.30 * kk), RADR[2] * (1 + 0.22 * kk)];
      const ax = [[0, 1], [1, 2], [2, 0]].map(([i, j]) => radAxT(C3[i], R[i], C3[j], R[j]));
      if (!ax.every(Boolean)) return C3.map((c, i) => circle({ x: c.x, y: c.y, r: R[i] }, 'aux'));
      const M = axMeetT(ax[0], ax[1]);
      const out = [];
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      C3.forEach((c, i) => {
        out.push(circle({ x: c.x, y: c.y, r: R[i] }, ['amb2', 'medp2', 'grnp2'][i]));
        x0 = Math.min(x0, c.x - R[i]); x1 = Math.max(x1, c.x + R[i]);
        y0 = Math.min(y0, c.y - R[i]); y1 = Math.max(y1, c.y + R[i]);
      });
      const bx = [x0 - 9, x1 + 9, y0 - 9, y1 + 9];     // 根轴裁到这个盒子里
      ax.forEach((a) => { const e = clipLine(a.f, a.d, bx); if (e) out.push(line(e[0], e[1], 'ln')); });
      if (M) {
        C3.forEach((c, i) => {
          const T = tanPtT(M, c, R[i], i === 1 ? -1 : +1);
          if (T) out.push(line(M, T, ['ambt', 'medt', 'grnt'][i]), dot(T));
        });
        // 根心被六条白线的端点围住，橙点太小会被淹掉 —— 先用底色描一圈再点
        out.push(circle({ x: M.x, y: M.y, r: 4.6 }, 'halo'), dot(M, 'key'));
      }
      return out;
    },
    // Monge：三个圆的圆心钉死，<b>半径呼吸</b> —— 三个外位似中心在线上滑，始终共线
    K03: (g, k) => {
      const G = geom(0), C3 = [G.A, G.B, G.C];
      const kk = k || 0;
      const R = [MONR[0] * (1 + 0.42 * kk), MONR[1] * (1 + 0.10 * kk), MONR[2] * (1 - 0.14 * kk)];
      const E = [[0, 1], [1, 2], [0, 2]].map(([i, j]) => extCenT(C3[i], R[i], C3[j], R[j]));
      const out = [];
      // <b>外公切线要画。</b>不画的话三个橙点就孤零零浮在一条线上，看不出它们和圆有
      // 什么关系 —— 切线一扇出去，「这两个圆的两条外公切线交在这里」就说清楚了。
      if (E.every(Boolean)) {
        [[0, 1], [1, 2], [0, 2]].forEach(([i, j], m) => {
          [+1, -1].forEach((sg) => {
            const a = tanPtT(E[m], C3[i], R[i], sg), b = tanPtT(E[m], C3[j], R[j], sg);
            if (!a || !b) return;
            const far = len(sub(a, E[m])) > len(sub(b, E[m])) ? a : b;
            out.push(line(E[m], far, ['amb', 'medp', 'grnp'][m]));
          });
        });
      }
      C3.forEach((c, i) => out.push(circle({ x: c.x, y: c.y, r: R[i] }, ['amb2', 'medp2', 'grnp2'][i])));
      if (!E.every(Boolean)) return out;
      const e2 = thru(E, 0.18);
      out.push(line(e2[0], e2[1], 'halo'), line(e2[0], e2[1], 'ln'));
      E.forEach((q) => out.push(dot(q, 'key', 5.2)));   // 画框大，点要跟着放大
      return out;
    },
    // Miquel：三角形三条边钉死，<b>横截线转</b> —— 四个外接圆全变，Miquel 点不动
    K04: (g, k) => {
      const G = geom(0), kk = k || 0;
      const at = (U, V2, t) => ({ x: U.x + (V2.x - U.x) * t, y: U.y + (V2.y - U.y) * t });
      const X = at(G.A, G.B, 0.58 + 0.30 * kk), Y = at(G.A, G.C, 1.22 - 0.26 * kk);
      const Z = xl2(X, Y, G.B, G.C);
      if (!Z) return [tri(G.A, G.B, G.C, 'aux')];
      const tris = [[G.A, X, Y], [G.B, X, Z], [G.C, Y, Z], [G.A, G.B, G.C]];
      const cir = tris.map((t) => circumT(t[0], t[1], t[2]));
      if (!cir.every(Boolean)) return [tri(G.A, G.B, G.C, 'aux')];
      const c1 = cir[0], c2 = cir[1], d = sub(c2, c1), L = len(d);
      const out = [line(G.A, G.B, 'aux'), line(G.B, G.C, 'aux'), line(G.A, G.C, 'aux'), line(X, Y, 'aux')];
      const CLS = ['amb2', 'medp2', 'grnp2', 'viot'];
      cir.forEach((c, i) => out.push(circle(c, CLS[i])));
      if (L > 1e-6) {
        const a = (L * L + c1.r * c1.r - c2.r * c2.r) / (2 * L), h2 = c1.r * c1.r - a * a;
        if (h2 >= 0) {
          const h = Math.sqrt(h2), ux = { x: d.x / L, y: d.y / L };
          const base = { x: c1.x + ux.x * a, y: c1.y + ux.y * a };
          const cand = [{ x: base.x - ux.y * h, y: base.y + ux.x * h },
                        { x: base.x + ux.y * h, y: base.y - ux.x * h }];
          const vs = [G.A, G.B, G.C, X, Y, Z];
          const M = cand.reduce((bb, z) => {
            const dm = Math.min(...vs.map((v) => len(sub(z, v))));
            return (!bb || dm > bb.d) ? { p: z, d: dm } : bb;
          }, null).p;
          out.push(dot(M, 'key'));
        }
      }
      return out.concat([G.A, G.B, G.C, X, Y, Z].map((q) => dot(q)));
    },
    /* 蝴蝶：圆和弦钉死，<b>两条弦绕 M 转</b> —— 翅膀一张一合，X、Y 来回滑，MX = MY */
    K05: (g, k) => {
      const O = geom(0).circum, R = O.r, kk = k || 0;
      const M = { x: O.x, y: O.y - R * 0.42 };      // 缩略图坐标里 y 向下，所以用减
      const dm = sub(M, O), L = len(dm);
      const u2 = { x: dm.x / L, y: dm.y / L }, nv = { x: -u2.y, y: u2.x };
      const half = Math.sqrt(R * R - L * L);
      const P = { x: M.x - nv.x * half, y: M.y - nv.y * half };
      const Q = { x: M.x + nv.x * half, y: M.y + nv.y * half };
      const hit = (a) => {
        const d = { x: Math.cos(a), y: Math.sin(a) };
        const f = sub(M, O), b = 2 * (f.x * d.x + f.y * d.y), c0 = f.x * f.x + f.y * f.y - R * R;
        const sq = Math.sqrt(Math.max(b * b - 4 * c0, 0));
        return [{ x: M.x + d.x * (-b - sq) / 2, y: M.y + d.y * (-b - sq) / 2 },
                { x: M.x + d.x * (-b + sq) / 2, y: M.y + d.y * (-b + sq) / 2 }];
      };
      const [A, B] = hit(0.62 + kk * 1.0), [C, D] = hit(1.77 + kk * 0.55);
      const X = xl2(A, D, P, Q), Y = xl2(B, C, P, Q);
      const out = [circle(O, 'conic'), line(A, B, 'aux'), line(C, D, 'aux')];
      out.push(poly([M, A, D], 'wingA'), poly([M, B, C], 'wingB'));
      out.push(line(A, D, 'amb2'), line(B, C, 'medp2'), line(P, Q, 'ln'));
      if (X) out.push(line(M, X, 'amb2'), dot(X, 'key', 3.4));
      if (Y) out.push(line(M, Y, 'medp2'), dot(Y, 'key', 3.4));
      return out.concat([A, B, C, D].map((q) => dot(q)), [dot(M, 'key', 3.8)]);
    },
    /* Descartes：三个两两相切的圆 + 两个解（嵌在缝里的、包住全部的）。
       <b>形变动三角形是对的</b> —— 三个圆的半径 s−a、s−b、s−c 全由三角形决定，
       三角形一动，四个曲率一起变，这正是这条定理的自由度 */
    K06: (g) => {
      const d = soddyData(g.A, g.B, g.C), V = [g.A, g.B, g.C];
      const out = [];
      [[0, 1], [1, 2], [2, 0]].forEach(([i, j]) => out.push(line(V[i], V[j], 'aux')));
      d.radii.forEach((r, i) => out.push(circle({ x: V[i].x, y: V[i].y, r }, ['amb2', 'medp2', 'grnp2'][i])));
      if (d.S1 && d.r1 > 0) out.push(circle({ x: d.S1.x, y: d.S1.y, r: d.r1 }, 'keyc'), dot(d.S1, 'key', 3.2));
      if (d.S2 && d.r2 > 0 && d.r2 < 8 * Math.max(...d.radii))
        out.push(circle({ x: d.S2.x, y: d.S2.y, r: d.r2 }, 'keyc'));
      return out.concat(V.map((q) => dot(q)));
    },
    /* ── 射影 ─────────────────────────────────────────────── */
    // Pascal：外接圆当圆锥曲线，内接交叉六边形，三组对边的交点共线
    P01: (g, k) => {
      const O = geom(0).circum, R = O.r;     // 圆用不形变的那个：钉死舞台，只让点动
      const A6 = pjAng(k);
      const on = (t) => ({ x: O.x + R * Math.cos(t), y: O.y + R * Math.sin(t) });
      const P = PJ_ORD6.map((j) => on(A6[j]));
      const side = [0, 1, 2, 3, 4, 5].map((k) => [P[k], P[(k + 1) % 6]]);
      const X = [[0, 3], [1, 4], [2, 5]].map(([m, n]) =>
        xl2(side[m][0], side[m][1], side[n][0], side[n][1]));
      if (!X.every(Boolean)) return [circle(O, 'conic')];
      const out = [circle(O, 'conic')];
      // 六条边按三组对边上色（k 和 k+3 同色）。全画白的话图上没有一点颜色 ——
      // 彩色延长线只在交点落到边外时才画，而这里交点全在边内，一条都不会画。
      side.forEach(([p, q], k) => out.push(line(p, q, ['amb2', 'medp2', 'grnp2'][k % 3])));
      [[0, 3], [1, 4], [2, 5]].forEach(([m, n], i) => {
        const cls = ['amb', 'medp', 'grnp'][i];
        [m, n].forEach((k) => { const e = extS(side[k][0], side[k][1], X[i], cls); if (e) out.push(e); });
      });
      const e2 = thru(X, 0.45);   // 三个交点挨得近，不往两头多延一点，白线短得看不出是条线
      out.push(line(e2[0], e2[1], 'halo'), line(e2[0], e2[1], 'ln'));
      return out.concat(P.map((q) => dot(q)), X.map((q) => dot(q, 'key')));
    },
    // Brianchon：外切六边形，三条对角线共点（Pascal 的对偶）
    P02: (g, k) => {
      const O = geom(0).circum, R = O.r;     // 同上：圆钉死，六个切点在圆上滑
      const A6 = pjAng(k);
      const tx = (f, h) => {
        const c = Math.cos((f - h) / 2);
        if (Math.abs(c) < 1e-6) return null;
        return { x: O.x + R * Math.cos((f + h) / 2) / c, y: O.y + R * Math.sin((f + h) / 2) / c };
      };
      const V = [0, 1, 2, 3, 4, 5].map((j) => tx(A6[j], A6[(j + 1) % 6]));
      if (!V.every(Boolean)) return [circle(O, 'conic')];
      const T6 = A6.map((t) => ({ x: O.x + R * Math.cos(t), y: O.y + R * Math.sin(t) }));
      const B = xl2(V[0], V[3], V[1], V[4]);
      const out = [circle(O, 'conic')];
      [0, 1, 2, 3, 4, 5].forEach((j) => out.push(line(V[j], V[(j + 1) % 6], 'thinw')));
      [[0, 3], [1, 4], [2, 5]].forEach(([m, n], i) =>
        out.push(line(V[m], V[n], ['amb2', 'medp2', 'grnp2'][i])));
      // 白点给六个切点（它们是能动的那六个），六边形顶点是推出来的，画淡一点
      return out.concat(V.map((q) => dot(q, 'dimpt')), T6.map((q) => dot(q)), [dot(B, 'key')]);
    },
    /* Pappus：两条直线上各三点，三组交叉连线的交点共线。
       和 P01 / P02 同一个道理 —— <b>两条直线钉死，六个点在线上滑</b>。
       靠形变三角形只是把两条线的夹角掰一掰，六个点跟着整体平移，定理自己的
       自由度（点在线上的位置）一点没动。
       基准和滑动量都是搜出来的。这里最难满足的是<b>三个交点要分得开</b>：六个点
       在过同一顶点的两条线上，交点天然聚堆 —— 三十万次随机里只有 1% 的配置三个
       交点能拉开 20px，原来那组基准就是挤在一起的（图上两个橙点几乎重合）。
       现在整段形变里最近两交点 ≥ 18px、交点位移最大 60px。 */
    P03: (g, k) => {
      const G = geom(0);                       // 两条直线用不形变的那个
      const PA = [0.683, 0.87, 1.414], SA = [0.6, 0.62, 0.27];
      const PB = [0.823, 1.137, 1.436], SB = [-0.88, -1.1, 0.28];
      const kk = k || 0;
      const at = (U, W, t) => ({ x: U.x + (W.x - U.x) * t, y: U.y + (W.y - U.y) * t });
      const A3 = PA.map((t, i) => at(G.A, G.B, t + kk * SA[i]));
      const B3 = PB.map((t, i) => at(G.A, G.C, t + kk * SB[i]));
      const X = [xl2(A3[1], B3[2], A3[2], B3[1]), xl2(A3[0], B3[2], A3[2], B3[0]),
                 xl2(A3[0], B3[1], A3[1], B3[0])];
      if (!X.every(Boolean)) return [line(G.A, G.B, 'aux')];
      const out = [line(G.A, A3[2], 'aux'), line(G.A, B3[2], 'aux')];
      [[[A3[1], B3[2]], [A3[2], B3[1]]], [[A3[0], B3[2]], [A3[2], B3[0]]],
       [[A3[0], B3[1]], [A3[1], B3[0]]]].forEach((two, i) =>
        two.forEach(([p, q]) => out.push(line(p, q, ['amb2', 'medp2', 'grnp2'][i]))));
      const e2 = thru(X, 0.50);   // 三个交点挨得近，一圈彩色连线压上来，不延长就看不出有这条线
      out.push(line(e2[0], e2[1], 'halo'), line(e2[0], e2[1], 'ln'));
      return out.concat(A3.concat(B3).map((q) => dot(q)), X.map((q) => dot(q, 'key')));
    },
    /* Desargues：两个三角形透视于一点，三组对应边的交点共线。
       <b>第一个三角形和透视中心 O 钉死，变的是三个比例</b> —— 第二个三角形沿着三条
       射线伸缩，三个交点跟着走，透视轴始终穿过它们。靠形变三角形只是把第一个
       三角形揉一揉，第二个被动跟随，看不出「透视」这件事。
       变化量是挑出来的：最猛的一组交点位移 203px，整张图乱晃、画框还被撑大，
       所以卡在 40–70px，再在这个前提下挑第二个三角形「呼吸」最明显的那组
       （面积比在 0.26–0.50 之间变化）。 */
    P04: (g, k) => {
      // 透视中心 O 必须在三角形<b>里面</b>，小三角形才会嵌在大的里面 —— O 在外面时
      // 顶点朝 O 缩只会往外跑，怎么搜都是两个三角形互相穿插的一团乱麻（我按
      // 「O 在上方 + 嵌套」搜过，四十万次零命中，就是这个道理）。
      // O 用重心坐标写，形变的时候它自动跟着留在三角形内部。
      const UU = [0.488, 0.288, 0.224], KK = [0.551, 0.77, 0.313];
      const G = geom(0);                       // 三角形和 O 都用不形变的那个
      const SK = [0.42, 0.27, 0.68];           // 三个比例随形变走，这才是定理的自由度
      const kk = k || 0;
      const O = { x: UU[0] * G.A.x + UU[1] * G.B.x + UU[2] * G.C.x,
                  y: UU[0] * G.A.y + UU[1] * G.B.y + UU[2] * G.C.y };
      const V = [G.A, G.B, G.C];
      const V2 = V.map((q, i) => { const t = KK[i] + kk * SK[i];
        return { x: O.x + (q.x - O.x) * t, y: O.y + (q.y - O.y) * t }; });
      const X = [[0, 1], [1, 2], [2, 0]].map(([m, n]) => xl2(V[m], V[n], V2[m], V2[n]));
      if (!X.every(Boolean)) return [tri(V[0], V[1], V[2])];
      const out = [];
      V.forEach((q) => out.push(line(O, q, 'thin')));
      // 三组对应边同色（大三角形实、小三角形细），和大图一致。两个都画白的话
      // 既分不出谁是谁，又跟结论线（透视轴）的白撞上。
      // <b>延长线必须画</b>：不画的话三个橙点就悬在轴上，看不出它们是哪两条边交出来的。
      // 之前砍掉是因为那会儿两个三角形都是白的、一加延长线就糊成一团；现在边有颜色，
      // 同色的虚线延长过去反而把「这条边接着往外走」说清楚了。
      [[0, 1], [1, 2], [2, 0]].forEach(([m, n], i) => {
        out.push(line(V[m], V[n], ['amb2', 'medp2', 'grnp2'][i]),
                 line(V2[m], V2[n], ['ambt', 'medt', 'grnt'][i]));   // 细实线，不要虚线 —— 会和 O 的射线混
        const cls = ['amb', 'medp', 'grnp'][i];                      // 延长线才用虚线
        const e1 = extS(V[m], V[n], X[i], cls); if (e1) out.push(e1);
        const e2 = extS(V2[m], V2[n], X[i], cls); if (e2) out.push(e2);
      });
      // 三组对应边的延长线在这里<b>不画</b>：两个三角形 + 三条射线 + 三组延长线 + 轴，
      // 十五条线塞进 200x140 就是一团浆糊。缩略图只要签名 —— 两个嵌套的三角形、
      // 一个中心、一条轴。延长线留给大图和视频。
      const e3 = thru(X, 0.10);
      out.push(line(e3[0], e3[1], 'halo'), line(e3[0], e3[1], 'ln'));
      return out.concat(X.map((q) => dot(q, 'key')), [dot(O, 'key')]);
    },
    // 拿破仑：三边向外各作正三角形，三个中心又成正三角形
    B01: (g) => {
      const { A, B, C } = g;
      const one = (U, W, V) => {
        const m = mid(U, W), d = sub(W, U), L = Math.max(len(d), 1e-9);
        let n = { x: -d.y / L, y: d.x / L };
        if ((V.x - m.x) * n.x + (V.y - m.y) * n.y > 0) n = { x: -n.x, y: -n.y };
        const ap = { x: m.x + n.x * L * Math.sqrt(3) / 2, y: m.y + n.y * L * Math.sqrt(3) / 2 };
        return { U, W, ap, c: { x: (U.x + W.x + ap.x) / 3, y: (U.y + W.y + ap.y) / 3 } };
      };
      const E = [one(B, C, A), one(C, A, B), one(A, B, C)], N = E.map((e) => e.c);
      const out = [tri(A, B, C, 'tri dim')];
      E.forEach((e) => { out.push(line(e.U, e.ap, 'amb2'), line(e.W, e.ap, 'amb2')); });
      out.push(tri(N[0], N[1], N[2], 'ln'));
      return out.concat(ticks(N[0], N[1], 1), ticks(N[1], N[2], 1), ticks(N[2], N[0], 1),
                        N.map((q) => dot(q, 'key')));
    },
    // Morley：三个内角的三等分线，相邻两条的交点成正三角形
    B02: (g) => {
      const { A, B, C } = g;
      const rot = (d, th) => ({ x: d.x * Math.cos(th) - d.y * Math.sin(th),
                                y: d.x * Math.sin(th) + d.y * Math.cos(th) });
      const un = (d) => { const L = Math.max(len(d), 1e-9); return { x: d.x / L, y: d.y / L }; };
      const t3 = (V, U, W) => {
        const d1 = un(sub(U, V)), d2 = un(sub(W, V));
        const a = Math.atan2(d1.x * d2.y - d1.y * d2.x, d1.x * d2.x + d1.y * d2.y);
        return { d1, t1: rot(d1, a / 3), t2: rot(d1, 2 * a / 3) };
      };
      const xl = (P1, d1, P2, d2) => {
        const den = d1.x * d2.y - d1.y * d2.x;
        if (Math.abs(den) < 1e-12) return null;
        const w = sub(P2, P1), k = (w.x * d2.y - w.y * d2.x) / den;
        return { x: P1.x + d1.x * k, y: P1.y + d1.y * k };
      };
      const tA = t3(A, B, C), tB = t3(B, C, A), tC = t3(C, A, B);
      const P = [xl(B, tB.t1, C, tC.t2), xl(C, tC.t1, A, tA.t2), xl(A, tA.t1, B, tB.t2)];
      if (!P.every(Boolean)) return [tri(A, B, C)];
      const ray = (V, d, U, W) => xl(V, d, U, un(sub(W, U))) || V;
      const out = [tri(A, B, C, 'tri dim')];
      [[A, tA, B, C], [B, tB, C, A], [C, tC, A, B]].forEach(([V, t, U, W]) => {
        out.push(line(V, ray(V, t.t1, U, W), 'amb'), line(V, ray(V, t.t2, U, W), 'amb'));
      });
      out.push(tri(P[0], P[1], P[2], 'ln'));
      return out.concat(ticks(P[0], P[1], 1), ticks(P[1], P[2], 1), ticks(P[2], P[0], 1),
                        P.map((q) => dot(q, 'key')));
    },
    N01: (g) => {
      const { A, B, C, T } = g;
      const out = [circle(g.circum, 'aux')];
      // 三条中线 → G
      [[A, mid(B, C)], [B, mid(C, A)], [C, mid(A, B)]].forEach(([p, m]) => out.push(line(p, m, 'med')));
      // 三条中垂线 → O（过 O，所以在外接圆里截出的是一条直径）
      [[mid(B, C), B, C], [mid(C, A), C, A], [mid(A, B), A, B]].forEach(([m, p, r]) => {
        const d = sub(r, p), L = len(d) || 1, n = { x: -d.y / L, y: d.x / L };
        out.push(line(sub(g.circum, mul(n, g.circum.r)), add(g.circum, mul(n, g.circum.r)), 'pbi'));
      });
      // 三条高 → H
      [[A, B, C], [B, C, A], [C, A, B]].forEach(([p, r, w]) => out.push(line(p, foot(p, r, w), 'alt2')));
      const [p0, q0] = long(T.O, T.H);
      return out.concat([tri(A, B, C), line(p0, q0, 'ln'),
                         dot(T.O, 'key'), dot(T.G, 'key'), dot(T.H, 'key')]);
    },
    // 九点圆：三组来历不同的点落在同一个圆上
    N02: (g) => {
      const { A, B, C, T } = g;
      const out = [];
      // 三条高：垂足和 H 从这里来
      [[A, B, C], [B, C, A], [C, A, B]].forEach(([p, r, w]) => out.push(line(p, foot(p, r, w), 'alt2')));
      // 顶点到 H 的连线：欧拉点是它们的中点
      [A, B, C].forEach((p) => out.push(line(p, T.H, 'eulline')));
      const grp = ['key', 'key', 'key', 'foot', 'foot', 'foot', 'eul', 'eul', 'eul'];
      return out.concat([tri(A, B, C), circle(g.nine, 'ln'), dot(T.H, 'hpt')],
                        g.NP.map((p, i) => dot(p, grp[i])));
    },
    // Feuerbach：九点圆与内切圆相切
    N04: (g) => {
      const out = [tri(g.A, g.B, g.C)];
      // 切点：在九点圆上，沿圆心连线方向
      const tp = (c) => { const v = sub(c, g.nine), L = Math.max(len(v), 1e-6);
                          return add(g.nine, mul(v, g.nine.r / L)); };
      // 三个旁切圆只画切点附近那一段 —— 整圆画出来画框要被撑爆（同视频）
      g.T.excircles.forEach((e) => {
        const q = tp(e), w = sub(q, e), a0 = Math.atan2(w.y, w.x);
        out.push(arcSeg(e, e.r, a0, Math.min(1.0, 95 / e.r), 'exc'));
      });
      out.push(circle(g.incir, 'inc'), circle(g.nine, 'ln'));
      return out.concat([g.incir].concat(g.T.excircles).map((c) => dot(tp(c), 'key')));
    },
    // 西姆松线：外接圆上一点的三个投影共线
    N05: (g) => {
      // 起点和视频同一个：垂足间距最大、P 离顶点最远
      const th = -1.082;                       // 视频里是 1.082，这里 y 轴向下所以取反
      const P = { x: g.circum.x + g.circum.r * Math.cos(th), y: g.circum.y + g.circum.r * Math.sin(th) };
      const sides = [[g.B, g.C], [g.C, g.A], [g.A, g.B]];
      const F = sides.map(([U, V]) => foot(P, U, V));
      const out = [circle(g.circum, 'aux'), tri(g.A, g.B, g.C)];
      // 垂足落在边外时延长那条边，否则点是悬空的
      sides.forEach(([U, V], i) => {
        const d = sub(V, U), q = F[i];
        const k = ((q.x - U.x) * d.x + (q.y - U.y) * d.y) / (d.x * d.x + d.y * d.y);
        if (k < 0 || k > 1) out.push(line(k < 0 ? U : V, q, 'ext'));
      });
      F.forEach((q) => out.push(line(P, q, 'alt2')));
      // 西姆松线：取最远的一对垂足，往两头延出去
      let bi = [0, 1], bd = -1;
      [[0, 1], [1, 2], [0, 2]].forEach((ij) => {
        const d = len(sub(F[ij[0]], F[ij[1]])); if (d > bd) { bd = d; bi = ij; }
      });
      const u0 = F[bi[0]], u1 = F[bi[1]], dd = sub(u1, u0);
      out.push(line(sub(u0, mul(dd, 0.22)), add(u1, mul(dd, 0.22)), 'ln'));
      return out.concat(F.map((q) => dot(q, 'foot')), [dot(P, 'key')]);
    },
    // 垂心组：四个点共享同一个九点圆
    N07: (g) => {
      // 白圆是四个三角形共用的那一个；四个点同色。
      // ABC 用正常线宽：四个都降成灰细线的话（我原来就是这么干的），整张图虚得
      // 看不出是个三角形。「地位平等」靠四个点同色和那个共用的圆来说，不靠把线削细。
      const H = g.T.H;
      return [circle(g.nine, 'ln'),
              tri(g.A, g.B, g.C), tri(g.A, g.B, H, 'tri dim'),
              tri(g.A, g.C, H, 'tri dim'), tri(g.B, g.C, H, 'tri dim'),
              dot(g.A, 'key'), dot(g.B, 'key'), dot(g.C, 'key'), dot(H, 'key')];
    },
    // 九点二次曲线：仿射推广
    // 九点二次曲线：和视频一套色 —— 六个中点蓝、三个对角点琥珀、曲线是主对象色、P 橙
    N08: (g) => {
      const P = { x: g.T.G.x + 22, y: g.T.G.y - 6 };     // 一般的第四点，才得到真正的椭圆
      const m = [mid(g.A, g.B), mid(g.B, g.C), mid(g.C, g.A), mid(g.A, P), mid(g.B, P), mid(g.C, P)];
      const el = conicEllipse(conicThrough(m.slice(0, 5)));
      const ix = (p1, p2, p3, p4) => {
        const d1 = sub(p2, p1), d2 = sub(p4, p3), den = d1.x * d2.y - d1.y * d2.x;
        if (Math.abs(den) < 1e-9) return null;
        const s = ((p3.x - p1.x) * d2.y - (p3.y - p1.y) * d2.x) / den;
        return { x: p1.x + d1.x * s, y: p1.y + d1.y * s };
      };
      const dg = [ix(g.A, P, g.B, g.C), ix(g.B, P, g.C, g.A), ix(g.C, P, g.A, g.B)];
      const out = [tri(g.A, g.B, g.C),
                   line(g.A, P, 'thin'), line(g.B, P, 'thin'), line(g.C, P, 'thin')];
      if (el) out.push(ellipse(el, 'ln'));
      return out.concat(m.map((p) => dot(p, 'mid')),
                        dg.filter(Boolean).map((p) => dot(p, 'amb')),
                        [dot(P, 'key')]);
    },
    // Nagel 线：I、G、Na 共线
    // Nagel 线：和视频一套色 —— 内切圆绿、到旁切点的连线琥珀、线本身是主对象色
    N09: (g) => {
      const n = nagelData(g.A, g.B, g.C), V = [g.A, g.B, g.C], U = [n.Ua, n.Ub, n.Uc];
      const [p, q] = long(n.I, n.Na);
      return [tri(g.A, g.B, g.C), circle(g.incir, 'inc'),
              line(V[0], U[0], 'amb'), line(V[1], U[1], 'amb'), line(V[2], U[2], 'amb'),
              line(p, q, 'ln'),
              dot(U[0], 'amb'), dot(U[1], 'amb'), dot(U[2], 'amb'),
              dot(n.I, 'key'), dot(n.G, 'key'), dot(n.Na, 'key')];
    },
    // Soddy：三个顶点圆两两外切
    K07: (g) => {
      const s = soddyData(g.A, g.B, g.C), V = [g.A, g.B, g.C];
      const out = [tri(g.A, g.B, g.C, 'tri dim')];
      s.radii.forEach((r, i) => out.push(circle({ x: V[i].x, y: V[i].y, r }, 'alt')));
      if (s.S1 && s.r1 > 0) out.push(circle({ x: s.S1.x, y: s.S1.y, r: s.r1 }, 'hi'));
      // <b>结论得画出来</b>：原来只有三个圆加一个内 Soddy 圆，看不出这条定理在说什么。
      // Soddy 线和线上那几个点才是它要讲的事。三点挤在内心附近是这条定理本身的几何，
      // 缩略图里只能让线穿过去、点标出来，细看留给大图（那里能缩放）
      const P3 = [s.S1, s.I, s.Ge].filter(Boolean);
      if (P3.length === 3) {
        let bi = [0, 1], bd = -1;
        [[0, 1], [1, 2], [0, 2]].forEach(([a, b]) => {
          const q = len(sub(P3[a], P3[b])); if (q > bd) { bd = q; bi = [a, b]; }
        });
        const dd = sub(P3[bi[1]], P3[bi[0]]), LL = Math.max(len(dd), 1e-6);
        const un = { x: dd.x / LL, y: dd.y / LL }, E = 78;
        out.push(line({ x: P3[bi[0]].x - un.x * E, y: P3[bi[0]].y - un.y * E },
                      { x: P3[bi[1]].x + un.x * E, y: P3[bi[1]].y + un.y * E }, 'halo'));
        out.push(line({ x: P3[bi[0]].x - un.x * E, y: P3[bi[0]].y - un.y * E },
                      { x: P3[bi[1]].x + un.x * E, y: P3[bi[1]].y + un.y * E }, 'ln'));
        P3.forEach((q) => out.push(dot(q, 'key', 3.6)));
      }
      return out.concat(V.map((p) => dot(p)));
    },
    /* Casey：四个点吹成圆。<b>动的是吹的程度</b> —— 这是 Casey 对托勒密的推广本身，
       四个点在圆上的位置反倒是次要的 */
    K08: (g, k) => {
      const O = geom(0).circum, R = O.r, kk = k || 0;
      const TH = [0.55, 1.95, 3.45, 5.25], RT = [0.17, 0.12, 0.20, 0.14];
      const bl = 0.22 + 2.0 * kk;                 // 形变 0→0.38 对应吹 0.22→0.98
      const rr = RT.map((r) => r * bl * R);
      const cc = TH.map((t, i) => ({ x: O.x + (R - rr[i]) * Math.cos(t), y: O.y + (R - rr[i]) * Math.sin(t) }));
      const tseg = (i, j) => {
        const d = sub(cc[j], cc[i]), D = len(d);
        if (D < 1e-9) return null;
        const e = { x: d.x / D, y: d.y / D }, co = (rr[j] - rr[i]) / D;
        if (Math.abs(co) > 1) return null;
        const si = Math.sqrt(1 - co * co);
        const n = { x: e.x * co - e.y * si, y: e.y * co + e.x * si };
        return [{ x: cc[i].x - n.x * rr[i], y: cc[i].y - n.y * rr[i] },
                { x: cc[j].x - n.x * rr[j], y: cc[j].y - n.y * rr[j] }];
      };
      const PR = [[0, 2], [1, 3], [0, 1], [2, 3], [0, 3], [1, 2]];
      const CL = ['amb2', 'amb2', 'medp2', 'medp2', 'grnp2', 'grnp2'];
      const out = [circle(O, 'conic')];
      PR.forEach(([i, j], m) => { const z = tseg(i, j); if (z) out.push(line(z[0], z[1], CL[m])); });
      cc.forEach((q, i) => out.push(circle({ x: q.x, y: q.y, r: rr[i] }, 'thinw')));
      return out.concat(TH.map((t) => dot({ x: O.x + R * Math.cos(t), y: O.y + R * Math.sin(t) })));
    },
    // Mandart 圆：旁切点三角形的外接圆，过费尔巴哈点 F
    B04: (g) => {
      const n = nagelData(g.A, g.B, g.C), U = [n.Ua, n.Ub, n.Uc];
      const v = sub(g.incir, g.nine), L = Math.max(len(v), 1e-6);
      const F = add(g.nine, mul(v, g.nine.r / L));          // 九点圆与内切圆的切点
      // 圆是主对象色，旁切点和它们的三角形琥珀，F 橙 —— 和视频一致
      const out = [tri(g.A, g.B, g.C), circle(g.incir, 'inc'),
                   tri(U[0], U[1], U[2], 'amb2'), circle(circumcircle(U[0], U[1], U[2]), 'ln')];
      return out.concat(U.map((p) => dot(p, 'amb')), [dot(F, 'key')]);
    },
    /* Poncelet 闭合：舞台（两个圆 + 原三角形）<b>钉死</b>，
       形变动的是起点 P₁ —— 它沿外接圆转，切出来的三角形跟着转，而且一直闭合。
       原来那版把起点固定、改动原三角形，结果两个三角形几乎重合，看不出是两个 */
    I03: (g, k) => {
      const G0 = geom(0), O = G0.circum, In = G0.incir;
      const stepT = (P) => {
        const d = sub(In, P), L = len(d);
        if (L <= In.r + 1e-9) return null;
        const a = Math.asin(Math.min(1, In.r / L)), ca = Math.cos(a), sa = Math.sin(a);
        const u = { x: (d.x * ca - d.y * sa) / L, y: (d.x * sa + d.y * ca) / L };
        const w = sub(P, O);
        const b = w.x * u.x + w.y * u.y, cc = w.x * w.x + w.y * w.y - O.r * O.r;
        const disc = b * b - cc;
        if (disc < 0) return null;
        const t = -b + Math.sqrt(disc);
        return t > 1e-9 ? add(P, mul(u, t)) : null;
      };
      const th = 1.15 + 2.3 * (k || 0);
      const pts = [{ x: O.x + O.r * Math.cos(th), y: O.y + O.r * Math.sin(th) }];
      for (let i = 0; i < 3; i++) { const nx = stepT(pts[pts.length - 1]); if (!nx) break; pts.push(nx); }
      const out = [circle(O, 'conic'), circle(In, 'grnp2'),
                   tri(G0.A, G0.B, G0.C, 'tri')];
      for (let i = 0; i + 1 < pts.length; i++) out.push(line(pts[i], pts[i + 1], 'amb2'));
      return out.concat([G0.A, G0.B, G0.C].map((z) => dot(z, 'dimpt', 2.4)),
                        [dot(pts[0], 'key', 3.6)]);
    },
  };

  const body = (id, k) => {
    SHAPE = SHAPES[id] || BASE; APEX = apexOf(SHAPE);      // 这一张用哪个三角形
    return DRAW[id](geom(k), k).map((s, i) => s.replace('class="', `style="--i:${i}" class="`)).join('');
  };

  function svgFor(id, k) {
    if (!DRAW[id]) return null;
    return `<svg class="thumb" viewBox="0 0 ${W} ${H}" data-id="${id}" aria-hidden="true">`
         + body(id, k || 0) + '</svg>';
  }

  /** 画框按整段形变的包围盒定一次，之后固定——逐帧自适应会变成缓慢推拉 */
  function fit(svg) {
    const id = svg.dataset.id;
    if (!id) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    [0, AMP / 2, AMP].forEach((k) => {
      svg.innerHTML = body(id, k);
      let bb; try { bb = svg.getBBox(); } catch (e) { return; }
      if (!bb || !bb.width) return;
      x0 = Math.min(x0, bb.x); y0 = Math.min(y0, bb.y);
      x1 = Math.max(x1, bb.x + bb.width); y1 = Math.max(y1, bb.y + bb.height);
    });
    svg.innerHTML = body(id, 0);
    if (!isFinite(x0)) return;
    const pad = Math.max(x1 - x0, y1 - y0) * 0.06;
    let x = x0 - pad, y = y0 - pad, w = (x1 - x0) + 2 * pad, h = (y1 - y0) + 2 * pad;
    const want = W / H;
    if (w / h < want) { const nw = h * want; x -= (nw - w) / 2; w = nw; }
    else { const nh = w / want; y -= (nh - h) / 2; h = nh; }
    svg.setAttribute('viewBox', [x, y, w, h].map(f).join(' '));
    svg.style.setProperty('--k', f(W / w));
  }

  /** 把线条设成「待画」状态，加 .go 之后自己长出来 */
  function arm(svg) {
    svg.querySelectorAll('line, path, circle:not(.pt), ellipse').forEach((el) => {
      // 本来就画成虚线的（辅助线），不能用 dash 做描边动画 —— 那会把虚线填成实线。
      // 它们改成淡入，虚线在任何状态下都是虚线。
      let dsh = '';
      try { dsh = getComputedStyle(el).strokeDasharray; } catch (e) { dsh = ''; }
      if (dsh && dsh !== 'none') { el.classList.add('fadein'); return; }
      let L = 0;
      try { L = el.getTotalLength ? el.getTotalLength() : 0; } catch (e) { L = 0; }
      if (!L && el.tagName === 'circle') L = 2 * Math.PI * el.r.baseVal.value;
      if (!L && el.tagName === 'ellipse') L = Math.PI * (el.rx.baseVal.value + el.ry.baseVal.value) * 1.2;
      if (L) { el.style.strokeDasharray = L; el.style.strokeDashoffset = L; }
    });
  }

  /* ---------- 活过来：鼠标放上去就循环形变 ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover)').matches;

  function live(svg) {
    const id = svg.dataset.id;
    if (!id || reduce) return;
    let amp = 0, want = 0, phase = 0, raf = 0, last = 0;

    function frame(ts) {
      if (!last) last = ts;
      const dt = Math.min(ts - last, 100); last = ts;
      amp += (want - amp) * Math.min(dt / 260, 1);          // 进场出场都平滑
      phase += dt / LOOP * 2 * Math.PI;
      const k = amp * AMP * (1 - Math.cos(phase)) / 2;       // 0 起步，来回摆，无缝
      svg.innerHTML = body(id, k);
      if (amp < 0.004 && want === 0) {                       // 收回到原状就停
        svg.innerHTML = body(id, 0);
        svg.classList.remove('anim');
        raf = 0; last = 0; phase = 0; return;
      }
      raf = requestAnimationFrame(frame);
    }
    function start() {
      want = 1;
      svg.classList.add('anim', 'go');    // 关掉入场过渡（每帧都是新元素），并确保线是补全的
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function stop()  { want = 0; }

    if (canHover) {
      const host = svg.parentElement || svg;
      host.addEventListener('mouseenter', start);
      host.addEventListener('mouseleave', stop);
    } else if (window.IntersectionObserver) {               // 触屏：滚进视野就动
      new IntersectionObserver((es) => {
        es.forEach((en) => (en.isIntersecting ? start() : stop()));
      }, { threshold: 0.5 }).observe(svg);
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  }

  window.THUMBS = { has: (id) => !!DRAW[id], svg: svgFor, fit, arm, live, AMP };
})();
