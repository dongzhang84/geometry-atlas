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
  const dot = (p, cls) =>
    `<circle class="pt ${cls || ''}" cx="${f(p.x)}" cy="${f(p.y)}" r="2.6"/>`;
  const tri = (P, Q, R, cls) =>
    `<path class="${cls || 'tri'}" d="M${f(P.x)} ${f(P.y)}L${f(Q.x)} ${f(Q.y)}L${f(R.x)} ${f(R.y)}Z"/>`;
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
      // 既分不出谁是谁，又跟结论线（透视轴）的白撞上
      [[0, 1], [1, 2], [2, 0]].forEach(([m, n], i) => {
        out.push(line(V[m], V[n], ['amb2', 'medp2', 'grnp2'][i]),
                 line(V2[m], V2[n], ['ambt', 'medt', 'grnt'][i]));   // 细实线，不要虚线 —— 会和 O 的射线混
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
      return out.concat(V.map((p) => dot(p)));
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
    // Poncelet 闭合：另一个内接外切三角形
    I03: (g) => {
      const out = [circle(g.circum, 'aux'), circle(g.incir, 'alt'), tri(g.A, g.B, g.C)];
      const P0 = { x: g.circum.x + g.circum.r * Math.cos(-2.2),
                   y: g.circum.y + g.circum.r * Math.sin(-2.2) };
      const tang = (P) => {
        const d = sub(g.incir, P), L = len(d), a = Math.asin(Math.min(g.incir.r / L, 1));
        const base = Math.atan2(d.y, d.x);
        return [base - a, base + a].map((th) => {
          const u = { x: Math.cos(th), y: Math.sin(th) };
          const e = sub(P, g.circum);
          return add(P, mul(u, -2 * (e.x * u.x + e.y * u.y)));
        });
      };
      const [P1] = tang(P0), [, P2] = tang(P1);
      out.push(tri(P0, P1, P2, 'tri hi2'));
      return out;
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
