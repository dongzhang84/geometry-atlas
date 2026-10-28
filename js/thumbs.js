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
      // 四个三角形地位平等，所以一样淡；白圆是它们共用的那一个；四个点同色
      const H = g.T.H;
      return [circle(g.nine, 'ln'),
              tri(g.A, g.B, g.C, 'tri dim'), tri(g.A, g.B, H, 'tri dim'),
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
      const out = [tri(g.A, g.B, g.C, 'tri dim'),
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
    return DRAW[id](geom(k)).map((s, i) => s.replace('class="', `style="--i:${i}" class="`)).join('');
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
