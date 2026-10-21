/* Geometry Atlas · 专题页「九点圆和其它相关定理」
 * 依赖 geometry.js（window.GA）。
 * 每个标签页有锚点：#orthocentric #euler #homothety #feuerbach #simson #conic #nagel #soddy #mandart #poncelet #sevenpoint #thirteen */
(function () {
  const { sub, add, mul, mid, len, foot, ninePoints, orthocenter, triangleData, circumcircle,
    evalConic, conicCenter, asymptoteSlopes, intersect, conicThrough, rectHyperbolaThrough, traceImplicit, nagelData, soddyData } = window.GA;

  const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
  /* 画布按容器实际宽度绘制（单位：CSS 像素）。K 是相对原设计宽度 680 的缩放，
   * 线宽、点、字号、偏移都乘 K，并设下限，保证手机上看得清、点得中。 */
  let W = 680, H = 480, K = 1;
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    W = Math.max(240, Math.round(cv.clientWidth || 680));
    H = Math.round(W < 500 ? W : W * 480 / 680);   // 窄屏用 1:1，宽屏保持 680:480
    K = W / 680;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeCanvas();
  const LW = (w) => Math.max(0.5, w * K);                     // 线宽
  const PR = (r) => Math.max(4, r * K);                       // 点半径 ≥ 4px
  const FS = () => Math.max(12, 13 * K);                      // 字号 ≥ 12px
  const OFF = (d) => d * Math.max(K, FS() / 13);              // 标注偏移随字号放大
  const DASH = (d) => (d || []).map((x) => x * Math.max(K, 0.75));
  const HIT = () => Math.max(24, 20 * K);                     // 拖动判定半径 ≥ 24px

  /* 线条配色：两种主题下都清楚的固定色 */
  const PU = '#7F77DD', TE = '#1D9E75', CO = '#D85A30', AM = '#BA7517', BL = '#378ADD', PK = '#D4537E', GR = '#888780';
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#888';

  const TABS = [
    ['orthocentric', '九点圆'], ['euler', '欧拉线'], ['homothety', '缩小外接圆'],
    ['feuerbach', 'Feuerbach 相切'], ['simson', '西摩松线'], ['conic', '九点二次曲线'],
    ['nagel', 'Nagel 线'], ['soddy', 'Soddy 线'], ['mandart', 'Mandart 圆'], ['poncelet', 'Poncelet 点'],
    ['sevenpoint', '七点球定理'], ['thirteen', '十三点球'],
  ];
  const LEG = {
    euler: [[BL, '中垂线 → O'], [TE, '中线 → G'], [PK, '高 → H'], [CO, '欧拉线'], [PU, '九点圆']],
    homothety: [[GR, '外接圆与样点'], [AM, '缩放后的圆'], [PU, '九点圆']],
    feuerbach: [[TE, '角平分线、内切圆、旁切圆'], [CO, '直线 NI 与切点'], [PU, '九点圆']],
    simson: [[TE, '西摩松线'], [PK, '三条高 → 垂心 H'], [AM, '线段 PH'], [PU, '九点圆']],
    orthocentric: [[TE, '当前三角形'], [PK, '它的三条高'], [CO, '它的 9 个点'], [PU, '九点圆']],
    nagel: [[AM, '内切圆、内心 I'], [PK, '顶点到旁切圆切点的连线 → Na'], [TE, '中线 → G'], [BL, 'Spieker 点 Sp'], [CO, 'Nagel 线']],
    soddy: [[GR, '以顶点为圆心的三个圆'], [TE, '顶点到切点的连线 → Ge'], [PU, '内 Soddy 圆'], [PK, '外 Soddy 圆'], [BL, 'de Longchamps 点 L'], [CO, 'Soddy 线']],
    mandart: [[TE, '内切圆、三个旁切圆'], [CO, '旁切点 Ua、Ub、Uc 与旁切点三角形'], [AM, 'Mandart 圆'], [PU, '九点圆'], [PK, 'Feuerbach 点 F']],
    sevenpoint: [[PU, '七点球'], [GR, '外接球'], [CO, '七个点'], [AM, 'V0、G、A、C 共线'], [TE, '欧拉线上的 O、G、E、4G−3O'], [BL, 'O、O′、B、4O′−3O 共线']],
    thirteen: [[PU, '十三点球 Σ'], [GR, '外接球'], [BL, '对面、它的九点圆和三条高'], [CO, '十三个点'], [AM, '直线 HG′ → P'], [TE, 'H 到对径点 → Q1'], [PK, '高线 V0H → Q2']],
    poncelet: [[PU, '过 A、B、C、P 的等轴双曲线'], [CO, '两条渐近线、中心 Po'], [TE, 'ABC 的九点圆'], [BL, 'PBC、PCA、PAB 的九点圆']],
    conic: [[TE, '6 条连线的中点'], [CO, '3 个对角点、渐近线'], [PU, '九点二次曲线'], ['rgba(29,158,117,.45)', '背景绿：P 在此处时是椭圆'], ['rgba(216,90,48,.4)', '背景橙：P 在此处时是双曲线']],
  };

  const state = {
    tab: TABS[0][0],
    V: [{ x: -2.0, y: 1.2 }, { x: 2.2, y: 1.2 }, { x: -1.0, y: -1.5 }],
    show: { pb: true, md: true, al: true },
    k: 1, center: 'H', theta: -0.6, tri: 0, P: null, onCircle: false,
    rot: { yaw: -0.6, pitch: -1.15 }, rot13: { yaw: -2.09, pitch: -0.7 }, tet: null, tet13: null, v0: 0, showCircum: true,
    zoom: 1,   // 用户缩放倍数，所有标签共用（二维、三维都乘在自动取景的比例上）
  };
  const ZMIN = 0.5, ZMAX = 8;
  let view = { s: 80, ox: W / 2, oy: H / 2 };
  const S = (p) => ({ x: p.x * view.s + view.ox, y: p.y * view.s + view.oy });
  const Wd = (p) => ({ x: (p.x - view.ox) / view.s, y: (p.y - view.oy) / view.s });

  function geo() { return triangleData(...state.V); }
  /** 三顶点几乎共线或重合：外接圆、九点圆都不存在 */
  function degenerate() {
    const [A, B, C] = state.V, m = Math.max(len(sub(B, A)), len(sub(C, A)), len(sub(C, B)));
    return m < 1e-9 || Math.abs((B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x)) < 1e-6 * m * m;
  }
  const near = (P, Q, g) => len(sub(P, Q)) < g.R * 1e-6;
  /** 取景要框住的点：外接圆和垂心。所有标签共用同一取景，切换标签时三角形位置和大小不变 */
  function fitPoints() {
    if (degenerate()) return state.V;
    const g = geo();
    return [g.A, g.B, g.C, g.H, { x: g.O.x - g.R, y: g.O.y - g.R }, { x: g.O.x + g.R, y: g.O.y + g.R }];
  }
  function fit() {
    const pts = fitPoints();
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    if (!(x1 - x0 > 1e-9 || y1 - y0 > 1e-9)) return;
    const s = state.zoom * Math.min((W - 80 * K) / Math.max(x1 - x0, 1e-9), (H - 60 * K) / Math.max(y1 - y0, 1e-9));
    view = { s, ox: W / 2 - s * (x0 + x1) / 2, oy: H / 2 - s * (y0 + y1) / 2 };
  }

  /* ---------- 画图小工具 ---------- */
  function circle(c, r, col, w, dash) { const p = S(c); ctx.beginPath(); ctx.setLineDash(DASH(dash)); ctx.arc(p.x, p.y, Math.abs(r) * view.s, 0, 7); ctx.strokeStyle = col; ctx.lineWidth = LW(w); ctx.stroke(); ctx.setLineDash([]); }
  function seg(P, R, col, w, dash) { const p = S(P), q = S(R); ctx.beginPath(); ctx.setLineDash(DASH(dash)); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = col; ctx.lineWidth = LW(w); ctx.stroke(); ctx.setLineDash([]); }
  function lineInf(P, R, col, w, dash) { const d = sub(R, P), L = len(d); if (L < 1e-9) return; seg(sub(P, mul(d, 50 / L)), add(R, mul(d, 50 / L)), col, w, dash); }
  function dot(P, col, r) { const p = S(P); ctx.beginPath(); ctx.arc(p.x, p.y, PR(r), 0, 7); ctx.fillStyle = col; ctx.fill(); }
  /** 文字标注：默认放在点的 (dx, dy) 处；右边或下边放不下时改放到左侧或上方，再夹在画布内 */
  function labPos(P, txt, dx, dy) {
    const p = S(P), fs = FS(), ox = OFF(dx), oy = OFF(dy), pad = 4;
    ctx.font = '500 ' + fs + 'px sans-serif';
    const w = ctx.measureText(txt).width;
    let x = p.x + ox, y = p.y + oy;
    if (x + w > W - pad) x = p.x - Math.abs(ox) - w;
    if (x < pad) x = p.x + Math.abs(ox);
    if (y > H - pad) y = p.y - Math.abs(oy);
    if (y - fs < pad) y = p.y + Math.abs(oy) + fs * 0.8;
    x = Math.min(Math.max(x, pad), W - pad - w); y = Math.min(Math.max(y, fs + pad / 2), H - pad);
    return { x, y, w, h: fs };
  }
  function lab(P, txt, dx, dy) {
    const q = S(P); if (!(q.x >= 0 && q.x <= W && q.y >= 0 && q.y <= H)) return;   // 点在画面外（比如放大后）就不标
    const r = labPos(P, txt, dx, dy);
    placed.push({ x: r.x, y: r.y - r.h, w: r.w, h: r.h });
    ctx.fillStyle = css('--ink'); ctx.fillText(txt, r.x, r.y);
  }
  /* 标签防重叠：本次绘制已占用的文字框（屏幕坐标）。每个标签依次试点周围的候选位置，
   * 选第一个不出画布、不压到已有文字和这组点的；都不行就用第一个候选。 */
  let placed = [];
  const GAP = 4;   // 文字框之间至少留的间隔
  const overlap = (r, q) => r.x < q.x + q.w + GAP && q.x < r.x + r.w + GAP && r.y < q.y + q.h + GAP && q.y < r.y + r.h + GAP;
  function labelPoints(items, dir) {
    const pts = items.map(([P]) => S(P)), fs = FS(), dd = OFF(11);
    const dots = pts.map((p) => ({ x: p.x - 7, y: p.y - 7, w: 14, h: 14 }));
    let n = { x: 0, y: -1 };
    if (dir) { const L = len(dir); if (L > 1e-12) n = { x: -dir.y / L, y: dir.x / L }; }
    ctx.font = '500 ' + fs + 'px sans-serif';
    items.forEach(([, txt], i) => {
      const p = pts[i];
      if (!(p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H)) return;   // 点在画面外就不标
      const w = ctx.measureText(txt).width, cands = [];
      for (const k of [1, 1.7, 2.6]) {
        for (const [ux, uy] of [[n.x, n.y], [-n.x, -n.y], [1, -1], [1, 1], [-1, -1], [-1, 1], [1, 0], [-1, 0], [0, -1], [0, 1]]) {
          const L = Math.hypot(ux, uy) || 1, vx = ux / L, vy = uy / L;
          const cx = p.x + vx * dd * k, cy = p.y + vy * dd * k;
          const x = vx > 0.35 ? cx : vx < -0.35 ? cx - w : cx - w / 2;
          const top = vy > 0.35 ? cy : vy < -0.35 ? cy - fs : cy - fs / 2;
          cands.push({ x, y: top, w, h: fs });
        }
      }
      const ok = (r) => r.x >= 2 && r.x + r.w <= W - 2 && r.y >= 2 && r.y + r.h <= H - 2 &&
        !placed.some((q) => overlap(r, q)) && !dots.some((q, j) => j !== i && overlap(r, q));
      const r = cands.find(ok) || cands[0];
      placed.push(r);
      ctx.fillStyle = css('--ink'); ctx.fillText(txt, r.x, r.y + r.h * 0.82);
    });
  }
  function labPerp(P, txt, dir, side) {
    const L = len(dir) || 1, n = { x: -dir.y / L, y: dir.x / L }, p = S(P), fs = FS(), d = OFF(17);
    ctx.font = '500 ' + fs + 'px sans-serif';
    const w = ctx.measureText(txt).width;
    const x = Math.min(Math.max(p.x + n.x * d * side, w / 2 + 4), W - w / 2 - 4);
    const y = Math.min(Math.max(p.y + n.y * d * side + fs * 0.3, fs + 2), H - 4);
    ctx.fillStyle = css('--ink'); ctx.textAlign = 'center'; ctx.fillText(txt, x, y); ctx.textAlign = 'start';
  }
  function tri(X, Y, Z, col, w) { seg(X, Y, col, w); seg(Y, Z, col, w); seg(Z, X, col, w); }
  function sides(g, c) { lineInf(g.A, g.B, c, 0.5, [2, 4]); lineInf(g.B, g.C, c, 0.5, [2, 4]); lineInf(g.C, g.A, c, 0.5, [2, 4]); }
  const fmt = (x, n = 2) => x.toFixed(n);
  /** 图下说明：上面一段只写定理，下面一段写操作方法、图上标记和实测 */
  const info = (thm, ops) => '<p class="thm">' + thm + '</p>' + (ops ? '<p class="ops">' + ops + '</p>' : '');

  /* ---------- 各标签页 ---------- */
  const DRAW = {
    euler(g) {
      const sec = css('--muted');
      sides(g, sec); circle(g.O, g.R, sec, 1, [5, 4]);
      const M = [mid(g.B, g.C), mid(g.C, g.A), mid(g.A, g.B)];
      const F = [foot(g.A, g.B, g.C), foot(g.B, g.C, g.A), foot(g.C, g.A, g.B)];
      const vs = [g.A, g.B, g.C];
      if (state.show.pb) M.forEach((m) => seg(m, g.O, BL, 1.1, [4, 3]));
      if (state.show.md) M.forEach((m, i) => seg(vs[i], m, TE, 1.1));
      if (state.show.al) F.forEach((f, i) => { seg(vs[i], f, PK, 1.1); if (len(sub(g.H, f)) > len(sub(vs[i], f))) seg(f, g.H, PK, 0.8, [3, 3]); else seg(vs[i], g.H, PK, 0.8, [3, 3]); });
      circle(g.N, g.r9, PU, 2.6); lineInf(g.O, g.H, CO, 1.2, [7, 4]); seg(g.O, g.H, CO, 2.2);
      ninePoints(g.A, g.B, g.C).forEach((p) => dot(p, PU, 3.5));
      const dir = sub(g.H, g.O), same = near(g.O, g.G, g);
      if (same) { dot(g.O, CO, 5.5); lab(g.O, 'O = G = H = N', 9, -9); }
      else [[g.O, 'O', BL, 1], [g.G, 'G', TE, -1], [g.N, 'N', PU, 1], [g.H, 'H', PK, -1]].forEach(([p, n, c, sd]) => { dot(p, c, 5.5); labPerp(p, n, dir, sd); });
      return info('三条中垂线交于外心 O，三条中线交于重心 G，三条高交于垂心 H。O、G、H 在一条直线上，叫做欧拉线，并且 OG : GH = 1 : 2。九点圆的圆心 N 是 OH 的中点。',
        '拖动顶点 A、B、C 改变三角形；用上面的复选框显示或隐藏中垂线（蓝）、中线（绿）、高（粉）。橙色粗线是欧拉线，紫色是九点圆。<br>' +
        (same ? '三角形接近等边：O、G、H、N 几乎重合，欧拉线不再确定。' :
          '实测：ON = ' + fmt(len(sub(g.N, g.O))) + '，NH = ' + fmt(len(sub(g.H, g.N))) + '；OG : GH = 1 : ' + fmt(len(sub(g.H, g.G)) / len(sub(g.G, g.O))) + '。'));
    },
    homothety(g) {
      const Cn = state.center === 'H' ? g.H : g.G, cn = state.center, k = state.k, target = cn === 'H' ? 0.5 : -0.5;
      circle(g.O, g.R, GR, 1.2, [5, 4]); circle(g.N, g.r9, PU, 2.2);
      const img = (X) => add(Cn, mul(sub(X, Cn), k));
      for (let i = 0; i < 16; i++) {
        const t = i / 16 * 2 * Math.PI, X = { x: g.O.x + g.R * Math.cos(t), y: g.O.y + g.R * Math.sin(t) };
        dot(X, GR, 2.5); dot(img(X), AM, 3);
      }
      [g.A, g.B, g.C].forEach((X) => { seg(Cn, X, GR, 0.9); dot(img(X), AM, 4.5); });
      const P = { x: g.O.x + g.R * Math.cos(state.theta), y: g.O.y + g.R * Math.sin(state.theta) }, Pi = img(P);
      seg(Cn, P, AM, 1.4); dot(P, AM, 6.5); lab(P, 'P', 9, -9); dot(Pi, CO, 6.5); lab(Pi, 'P′', 9, 14);
      const Oi = img(g.O); circle(Oi, g.R * k, AM, 2); seg(Cn, g.O, BL, 1, [3, 3]); dot(g.O, BL, 5); lab(g.O, 'O', 8, -8); dot(Oi, AM, 4.5);
      dot(Cn, PK, 6); lab(Cn, cn, 8, -8);
      const hit = Math.abs(k - target) < 0.006;
      if (hit) { dot(g.N, PU, 5); lab(g.N, 'N', 8, 14); }
      const ops = '缩放的意思：以一个点为中心，每个点 X 沿着从中心出发、经过 X 的射线移动，新位置 X′ 到中心的距离 = k × 原来的距离（k 为负时，X′ 跑到中心的另一侧）。' +
        '<br>用上面的按钮选择以 H 还是 G 为中心，拖动滑块改变 k；在画面上拖动（顶点以外的地方）让 P 沿外接圆移动，也可以拖动顶点。灰色是外接圆上 16 个样点，棕色是它们缩放后的位置，连起来就是缩放后的圆。' +
        '<br>现在中心是 ' + cn + '，k = ' + fmt(k) + '：' + cn + 'P = ' + fmt(len(sub(P, Cn))) + '，' + cn + 'P′ = ' + fmt(len(sub(Pi, Cn))) + '。' +
        (hit ? '<b style="color:' + PU + '">此时缩放后的圆和九点圆重合：圆心 O 被送到 N，半径从 R 变成 R/2；' +
          (cn === 'H' ? 'A、B、C 的像是 AH、BH、CH 的中点，P 的像就是 PH 的中点。' : 'A、B、C 的像是三边的中点。') + '</b>'
          : '把滑块拖到 k = ' + target + '，看缩放后的圆会变成什么。');
      return info('以垂心 H 为中心，把外接圆缩小到一半（k = 1/2），得到的正是九点圆；以重心 G 为中心、按 k = −1/2 缩放，也得到九点圆。所以九点圆的半径是外接圆半径的一半，圆心 N 是 OH 的中点。', ops);
    },
    feuerbach(g) {
      const sec = css('--muted');
      sides(g, sec); [g.A, g.B, g.C].forEach((P) => seg(P, g.I, TE, 0.9, [4, 3]));
      circle(g.I, g.r, TE, 1.6); seg(g.I, foot(g.I, g.A, g.B), TE, 0.8);
      g.excircles.forEach((e) => circle(e, e.r, TE, 1, [4, 3])); circle(g.N, g.r9, PU, 2.6);
      const tp = (c) => add(g.N, mul(sub(c, g.N), g.r9 / len(sub(c, g.N)))), same = near(g.N, g.I, g);
      if (!same) { const T = tp(g.I); lineInf(g.N, g.I, CO, 1, [6, 4]); seg(g.N, T, CO, 1.8); dot(T, CO, 6); lab(T, 'T', 8, 14); }
      g.excircles.forEach((e) => { const q = tp(e); seg(g.N, q, CO, 0.8, [3, 3]); dot(q, CO, 4.5); });
      dot(g.N, PU, 5); dot(g.I, TE, 5);
      if (same) lab(g.N, 'N = I', 8, -8); else { lab(g.N, 'N', 8, -8); lab(g.I, 'I', 8, -8); }
      return info('费尔巴哈定理：三角形的九点圆与内切圆相切，也与三个旁切圆相切。设 R 为外接圆半径、r 为内切圆半径、I 为内心，则九点圆圆心 N 到内心的距离 NI = R/2 − r，九点圆与内切圆的切点 T 在直线 NI 上。',
        '拖动顶点 A、B、C 改变三角形。绿色虚线是三条角平分线（交于内心 I），绿色实线圆是内切圆，绿色虚线圆是三个旁切圆（可能伸出画面），紫色是九点圆，橙色点是四个切点。<br>' +
        (same ? '等边三角形中九点圆与内切圆重合（N 与 I 重合，r = R/2），切点不再唯一，所以不画直线 NI 和切点 T。' :
          '实测：NI = ' + fmt(len(sub(g.I, g.N)), 3) + '，R/2 − r = ' + fmt(g.r9 - g.r, 3) + '。'));
    },
    simson(g) {
      const sec = css('--muted');
      sides(g, sec); circle(g.O, g.R, sec, 1, [5, 4]); circle(g.N, g.r9, PU, 2.6);
      // 三条高（粉色虚线）交于垂心 H；H 在三角形外时延长到 H
      [[g.A, g.B, g.C], [g.B, g.C, g.A], [g.C, g.A, g.B]].forEach(([X, U, V]) => {
        const F = foot(X, U, V); seg(X, F, PK, 0.9, [4, 3]);
        if (len(sub(g.H, F)) > len(sub(X, F)) || len(sub(g.H, X)) > len(sub(F, X))) seg(len(sub(g.H, F)) < len(sub(g.H, X)) ? F : X, g.H, PK, 0.9, [4, 3]);
      });
      const P = { x: g.O.x + g.R * Math.cos(state.theta), y: g.O.y + g.R * Math.sin(state.theta) };
      const f = [foot(P, g.B, g.C), foot(P, g.C, g.A), foot(P, g.A, g.B)];
      f.forEach((q) => { seg(P, q, sec, 0.8); dot(q, TE, 4.5); });
      const pr = [[0, 1], [1, 2], [0, 2]].reduce((b, ij) => len(sub(f[ij[0]], f[ij[1]])) > len(sub(f[b[0]], f[b[1]])) ? ij : b);
      lineInf(f[pr[0]], f[pr[1]], TE, 1.8);
      seg(P, g.H, AM, 1.6); const M = mid(P, g.H);
      dot(M, CO, 6.5); dot(P, AM, 7); dot(g.H, PK, 5); lab(P, 'P', 9, -9); lab(g.H, 'H', 8, -8); lab(M, 'M', 8, 14);
      return info('西摩松定理：P 是三角形外接圆上任意一点，从 P 向三边（或其延长线）作垂线，三个垂足在一条直线上，这条直线叫做 P 的西摩松线。西摩松线平分 P 与垂心 H 的连线 PH，PH 的中点 M 在九点圆上。',
        '在画面上拖动（顶点以外的地方），P 沿外接圆移动；也可以拖动顶点。粉色虚线是三角形的三条高，交于垂心 H；灰线是 P 到三边的垂线，绿色点是三个垂足，绿色直线是西摩松线，棕色线段是 PH，橙色点是它的中点 M。' +
        '<br>M 为什么在九点圆上：以 H 为中心把外接圆缩小一半就是九点圆（见「缩小外接圆」），P 被送到 PH 的中点 M。');
    },
    orthocentric(g) {
      const sec = css('--muted');
      circle(g.N, g.r9, PU, 2.6);
      const four = [[g.A, g.B, g.C], [g.A, g.B, g.H], [g.A, g.C, g.H], [g.B, g.C, g.H]];
      four.forEach((T) => tri(T[0], T[1], T[2], sec, 0.7));
      const T = four[state.tri]; tri(T[0], T[1], T[2], TE, 2.2);
      const m = Math.max(len(sub(T[1], T[0])), len(sub(T[2], T[0])), len(sub(T[2], T[1])));
      const flat = Math.abs((T[1].x - T[0].x) * (T[2].y - T[0].y) - (T[1].y - T[0].y) * (T[2].x - T[0].x)) < 1e-6 * m * m;
      if (!flat) {
        T.forEach((P) => seg(P, foot(P, ...T.filter((x) => x !== P)), PK, 0.9, [3, 3]));
        ninePoints(T[0], T[1], T[2]).forEach((p) => dot(p, CO, 4.5));
      }
      dot(g.H, PK, 5); lab(g.H, 'H', 8, -8);
      return info('三角形三边的中点、三条高的垂足、三个顶点到垂心连线的中点，这九个点在同一个圆上，叫做九点圆。' +
        '<br>进一步：A、B、C 和垂心 H 这四个点中任取三点，组成四个三角形，每个三角形的垂心正好是剩下的那个点；这四个三角形共用同一个九点圆。',
        '拖动顶点 A、B、C 改变三角形；用上面的按钮在四个三角形之间切换。绿色是当前三角形，粉色虚线是它的三条高，橙色是它的九个点，紫色是九点圆。' +
        (flat ? '<br>现在是直角三角形，垂心 H 落在直角顶点上，这个三角形退化成一条线段，没有高和九点，只画出三边。' : ''));
    },
    conic(g) {
      const sec = css('--muted'), ink = css('--ink'), R = g.R, V = [g.A, g.B, g.C];
      const nrm = (p) => ({ x: (p.x - g.O.x) / R, y: (p.y - g.O.y) / R });   // 归一化坐标，避免数值问题
      if (!state.P) state.P = { x: g.G.x + 0.12 * R, y: g.G.y + 0.06 * R };
      if (state.onCircle) state.P = onCircumcircle(state.P, g);
      const P = state.P;
      // 背景分区：拖动顶点时先不画，松手后重算
      if (!(drag && drag.v !== undefined)) { ensureRegions(g, nrm); ctx.drawImage(regionCv, 0, 0, W, H); }
      // 六条连线：整条直线画淡虚线，线段本身画实线
      const sides = [[g.A, g.B], [g.B, g.C], [g.C, g.A]], spokes = [[g.A, P], [g.B, P], [g.C, P]];
      ctx.globalAlpha = 0.55; [...sides, ...spokes].forEach(([U, X]) => lineInf(U, X, sec, 0.7, [4, 4])); ctx.globalAlpha = 1;
      sides.forEach(([U, X]) => seg(U, X, ink, 1.3)); spokes.forEach(([U, X]) => seg(U, X, sec, 1.1));
      if (state.onCircle) circle(g.O, R, sec, 1.1, [5, 4]);

      const kindEl = document.getElementById('ckind'), setKind = (t) => { if (kindEl) kindEl.textContent = t; };
      const scr = (X) => S(X), close = (X, Y) => len(sub(scr(X), scr(Y))) < 1;
      const onVertex = V.some((X) => close(X, P));
      const onSide = !onVertex && sides.some(([U, X]) => close(foot(P, U, X), P));
      const thm = '九点二次曲线（Bôcher，1892）：任取四点 A、B、C、P（其中任意三点不共线），六条连线 AB、BC、CA、AP、BP、CP 的中点，和三个对角点 AP∩BC、BP∩CA、CP∩AB，这 9 个点在同一条二次曲线上。' +
        'P 在三角形内部，或在顶点背后的对顶角区域时，这条曲线是椭圆；P 在边的外侧时是双曲线；P 在外接圆上时是等轴双曲线；P 在垂心时就是九点圆。';
      const ops0 = '在画面上拖动（顶点以外的地方）移动 P，也可以拖动顶点。绿色点是 6 个中点，橙色点是 3 个对角点，紫色是过这 9 点的二次曲线；背景浅绿表示 P 在这里时曲线是椭圆，浅橙表示是双曲线。' +
        '「把 P 放到垂心」会把 P 移到垂心；勾选「让 P 只能沿外接圆走」后，P 被限制在外接圆上。' +
        '<br>九点圆是这条定理在 P 落在垂心时的特例：从欧氏几何升到仿射几何，「圆」变成了「二次曲线」。<br>';
      const finishP = () => { dot(P, ink, 6.5); lab(P, 'P', 9, -9); };
      if (onVertex || onSide) {
        finishP(); setKind('—');
        return info(thm, ops0 + (onVertex ? 'P 与一个顶点重合，四点只剩三个，九个点里有几个重合，确定不了二次曲线。把 P 拖开一点。'
          : 'P 正好在一条边所在的直线上，九点二次曲线退化成两条直线，所以暂不画曲线。把 P 拖离这条线。'));
      }

      // 用 5 个中点确定曲线（只用中点，P 靠近边线时也稳定）
      const mids = [mid(g.A, g.B), mid(g.A, g.C), mid(g.A, P), mid(g.B, g.C), mid(g.B, P), mid(g.C, P)];
      const diag = [intersect(g.A, P, g.B, g.C), intersect(g.B, P, g.C, g.A), intersect(g.C, P, g.A, g.B)];
      const co = conicThrough(mids.slice(0, 5).map(nrm)), big = Math.max(...co.map(Math.abs));
      if (!(big > 1e-12) || !co.every(isFinite)) {
        finishP(); setKind('—');
        return info(thm, ops0 + '这个位置上九个点退化，确定不了二次曲线。把 P 拖开一点。');
      }
      ctx.strokeStyle = PU; ctx.lineWidth = LW(2.4);
      traceImplicit(ctx, (sx, sy) => evalConic(co, nrm(Wd({ x: sx, y: sy }))), W, H, 3);

      const [a, b, c] = co, sc = Math.abs(a) + Math.abs(c) + 1e-300, disc = b * b - 4 * a * c;
      let kind, note = '';
      if (Math.abs(a - c) / sc < 0.03 && Math.abs(b) / sc < 0.03) { kind = '圆'; note = '<b style="color:' + PU + '">这就是九点圆</b>：P 落在垂心时，九点二次曲线变成圆，9 个点正是三边中点、三条高的垂足和顶点到垂心连线的中点。'; }
      else if (Math.abs(disc) / (sc * sc) < 1e-4) kind = '抛物线';
      else if (disc < 0) kind = '椭圆';
      else {
        const rect = Math.abs(a + c) / sc < 0.03; kind = rect ? '等轴双曲线' : '双曲线';
        const cn = conicCenter(co);
        if (cn && isFinite(cn.x) && isFinite(cn.y)) {
          const cen = { x: g.O.x + cn.x * R, y: g.O.y + cn.y * R };
          const ms = asymptoteSlopes(co), dirs = ms.length ? ms.map((m) => ({ x: 1, y: m })) : [{ x: 0, y: 1 }, { x: 1, y: -a / b }];
          dirs.forEach((d) => lineInf(cen, add(cen, d), CO, 1.2, [7, 5]));
          const cosT = Math.abs(dirs[0].x * dirs[1].x + dirs[0].y * dirs[1].y) / (len(dirs[0]) * len(dirs[1]));
          note = '两条渐近线（橙色虚线）夹角约 ' + fmt(Math.acos(Math.min(1, cosT)) * 180 / Math.PI, 1) + '°' + (rect ? '，互相垂直。' : '。');
        }
      }
      setKind(kind);
      mids.forEach((p) => dot(p, TE, 4.5));
      const far = diag.filter((p) => !p).length;
      diag.forEach((p) => { if (p) { const q = S(p); if (q.x > -W && q.x < 2 * W && q.y > -H && q.y < 2 * H) dot(p, CO, 5); } });
      finishP();
      return info(thm, ops0 + '现在曲线是<b>' + kind + '</b>。' + note +
        (far ? '有 ' + far + ' 个对角点在无穷远处（P 与某个顶点的连线平行于对边）。' : ''));
    },
    nagel(g) {
      const sec = css('--muted'), n = nagelData(g.A, g.B, g.C), V = [g.A, g.B, g.C], U = [n.Ua, n.Ub, n.Uc];
      sides(g, sec); circle(g.I, g.r, AM, 1.3);
      U.forEach((u, i) => seg(V[i], u, PK, 1.1));
      [mid(g.B, g.C), mid(g.C, g.A), mid(g.A, g.B)].forEach((m, i) => seg(V[i], m, TE, 1.1));
      const same = len(sub(n.Na, n.I)) < g.R * 1e-6;
      if (!same) { lineInf(n.I, n.Na, CO, 1.2, [7, 4]); seg(n.I, n.Na, CO, 2.2); }
      U.forEach((u) => dot(u, PK, 4));
      [[n.I, AM], [n.G, TE], [n.Sp, BL], [n.Na, PK]].forEach(([P, c]) => dot(P, c, 5.5));
      labelPoints(same ? [[n.I, 'I = G = Sp = Na'], [n.Ua, 'Ua'], [n.Ub, 'Ub'], [n.Uc, 'Uc']]
        : [[n.I, 'I'], [n.G, 'G'], [n.Sp, 'Sp'], [n.Na, 'Na'], [n.Ua, 'Ua'], [n.Ub, 'Ub'], [n.Uc, 'Uc']], sub(n.Na, n.I));
      const ig = len(sub(n.G, n.I)), gn = len(sub(n.Na, n.G));
      return info('Nagel 线：三角形的内心 I、重心 G、Spieker 点 Sp 和 Nagel 点 Na 在一条直线上，并且 IG : GNa = 1 : 2，Sp 是 I 与 Na 的中点。' +
        '其中 Nagel 点是三个顶点与对边上旁切圆切点的连线的交点，Spieker 点是三边中点所成三角形的内心。' +
        '<br>以 G 为中心、比例 −1/2 的位似把 Na 变成 I、把 I 变成 Sp，和欧拉线上把 H 变成 O、把 O 变成 N 是同一个位似。',
        '拖动顶点 A、B、C 改变三角形。棕色圆是内切圆；粉色线是三个顶点到对边上旁切圆切点 Ua、Ub、Uc 的连线，交于 Nagel 点 Na；绿色线是三条中线，交于重心 G；橙色粗线是 Nagel 线。<br>' +
        (same ? '三角形接近等边：I、G、Sp、Na 几乎重合，Nagel 线不再确定。'
          : '实测：IG : GNa = 1 : ' + fmt(gn / ig) + '；ISp = ' + fmt(len(sub(n.Sp, n.I))) + '，SpNa = ' + fmt(len(sub(n.Na, n.Sp))) + '，Sp 是 I 与 Na 的中点。'));
    },
    soddy(g) {
      const sec = css('--muted'), d = soddyData(g.A, g.B, g.C), V = [g.A, g.B, g.C], T = [d.Ta, d.Tb, d.Tc];
      const outer = d.S2 && d.r2 > 0 && d.r2 < 100 * g.R;   // 外 Soddy 圆太大时看作已退化成直线
      sides(g, sec);
      V.forEach((X, i) => circle(X, d.radii[i], GR, 1.3));
      T.forEach((t, i) => seg(V[i], t, TE, 1.1));
      if (d.S1) circle(d.S1, d.r1, PU, 2);
      if (outer) circle(d.S2, d.r2, PK, 1.8);
      const pts = [[d.I, 'I', AM], [d.Ge, 'Ge', TE], [d.L, 'L', BL], [d.S1, 'S₁', PU]].concat(outer ? [[d.S2, 'S₂', PK]] : []).filter(([P]) => P);
      // Soddy 线：取这些点里相距最远的两个连线
      let far = [pts[0][0], pts[0][0]], fd = 0;
      pts.forEach(([P]) => pts.forEach(([Q]) => { const x = len(sub(P, Q)); if (x > fd) { fd = x; far = [P, Q]; } }));
      const same = fd < g.R * 1e-6;
      if (!same) { lineInf(far[0], far[1], CO, 1.2, [7, 4]); seg(far[0], far[1], CO, 2.2); }
      T.forEach((t) => dot(t, TE, 4));
      pts.forEach(([P, , c]) => dot(P, c, 5.5));
      labelPoints((same ? [[d.I, 'I = Ge = L = S₁ = S₂']] : pts.map(([P, t]) => [P, t])).concat([[d.Ta, 'Ta'], [d.Tb, 'Tb'], [d.Tc, 'Tc']]), sub(far[1], far[0]));
      const offscreen = pts.filter(([P]) => { const q = S(P); return !(q.x >= 0 && q.x <= W && q.y >= 0 && q.y <= H); }).map(([, t]) => t);
      return info('三个圆两两外切，和它们都相切的圆有两个，叫内、外 Soddy 圆。两个圆心所在的直线叫 Soddy 线，它也过内心 I、Gergonne 点 Ge 和 de Longchamps 点 L（L 是垂心关于外心的对称点）。',
        '拖动顶点 A、B、C 改变三角形。灰色是以 A、B、C 为圆心、半径 s−a、s−b、s−c 的三个圆（s 为半周长），它们两两相切的切点正好是内切圆与三边的切点 Ta、Tb、Tc；' +
        '绿色线是 A–Ta、B–Tb、C–Tc，交于 Gergonne 点 Ge；紫色是内 Soddy 圆（圆心 S₁），粉色是外 Soddy 圆（圆心 S₂，可能很大，伸出画面；灰色圆也可能伸出画面）；橙色粗线是 Soddy 线。<br>' +
        (same ? '三角形接近等边：I、Ge、L、S₁、S₂ 几乎重合，Soddy 线不再确定。' :
          '实测：内 Soddy 圆半径 ' + fmt(d.r1, 3) + (outer ? '，外 Soddy 圆半径 ' + fmt(d.r2, 3) + '。' : '。') +
          (outer ? '' : '此时外 Soddy 圆退化成一条直线（和三个圆都相切的直线），不画外 Soddy 圆和 S₂。') +
          (offscreen.length ? '画面外的点：' + offscreen.join('、') + '。' : '')));
    },
    mandart(g) {
      const sec = css('--muted'), d = nagelData(g.A, g.B, g.C);
      sides(g, sec);
      g.excircles.forEach((e) => circle(e, e.r, TE, 1, [4, 3]));
      circle(g.I, g.r, TE, 1.6);
      const U = [d.Ua, d.Ub, d.Uc];
      tri(U[0], U[1], U[2], CO, 1.1);
      const M = circumcircle(U[0], U[1], U[2]);
      circle(M, M.r, AM, 2.4);
      circle(g.N, g.r9, PU, 2.6);
      U.forEach((u) => dot(u, CO, 5));
      // Feuerbach 点：九点圆与内切圆的切点，在直线 NI 上
      const same = near(g.N, g.I, g);
      let F = null;
      if (!same) {
        F = add(g.N, mul(sub(g.I, g.N), g.r9 / len(sub(g.I, g.N))));
        seg(g.N, g.I, CO, 0.8, [3, 3]); dot(F, PK, 6.5);
      }
      dot(g.N, PU, 5); dot(g.I, TE, 5); dot(M, AM, 4.5);
      labelPoints([[U[0], 'Ua'], [U[1], 'Ub'], [U[2], 'Uc'], [g.N, 'N'], [g.I, 'I'], [M, 'M']]
        .concat(F ? [[F, 'F']] : []), sub(g.I, g.N));
      const ops = '拖动顶点 A、B、C 改变三角形。绿色虚线圆是三个旁切圆（可能伸出画面），绿色实线圆是内切圆；' +
        '橙色点是三个旁切点 Ua、Ub、Uc，橙色细线是它们连成的旁切点三角形，棕色是这个三角形的外接圆，也就是 Mandart 圆（圆心 M）；' +
        '紫色是九点圆，粉色点是 Feuerbach 点 F。<br>';
      return info('Mandart 圆：三个旁切圆与它们所对的边分别切于 Ua、Ub、Uc，这三点连成旁切点三角形，它的外接圆叫 Mandart 圆。这个圆经过 Feuerbach 点 F —— 也就是九点圆与内切圆的切点。',
        ops + (same ? '等边三角形中九点圆与内切圆重合，切点不唯一，所以不标 F。'
          : '实测：Mandart 圆半径 ' + fmt(M.r, 3) + '，圆心 M 到 F 的距离 ' + fmt(len(sub(F, M)), 3) + '，两者相等即 F 在圆上。'));
    },
    poncelet(g) {
      const sec = css('--muted'), ink = css('--ink'), R = g.R;
      if (!state.P) state.P = { x: g.G.x + 0.45 * R, y: g.G.y - 0.3 * R };
      const P = state.P, V = [g.A, g.B, g.C];
      const nrm = (p) => ({ x: (p.x - g.O.x) / R, y: (p.y - g.O.y) / R });   // 归一化，避免数值问题
      const un = (p) => ({ x: g.O.x + p.x * R, y: g.O.y + p.y * R });
      sides(g, sec);
      [g.A, g.B, g.C].forEach((X) => seg(X, P, sec, 0.9, [4, 3]));

      const thm = 'Poncelet 点：过 A、B、C、P 的二次曲线有一整族，其中渐近线互相垂直的（等轴双曲线）恰有一条，' +
        '它的中心就是这四点的 Poncelet 点 Po。等价的定义是：A、B、C、P 组成四个三角形 ABC、PBC、PCA、PAB，它们的四个九点圆交于一点，这个点也是 Po。';
      const base = '在画面上拖动（顶点以外的地方）移动 P，也可以拖动顶点。紫色是那条等轴双曲线，橙色虚线是它的两条渐近线，交点就是中心 Po；绿色是 ABC 的九点圆，蓝色是另外三个三角形的九点圆。<br>';

      // 四个三角形的九点圆
      const tris = [[g.A, g.B, g.C], [P, g.B, g.C], [P, g.C, g.A], [P, g.A, g.B]];
      const nps = tris.map(([X, Y, Z]) => {
        const M = [mid(Y, Z), mid(Z, X), mid(X, Y)];
        const d = (M[1].x - M[0].x) * (M[2].y - M[0].y) - (M[1].y - M[0].y) * (M[2].x - M[0].x);
        return Math.abs(d) < 1e-12 * R * R ? null : circumcircle(M[0], M[1], M[2]);
      });
      if (nps.some((c) => !c)) { dot(P, ink, 6.5); lab(P, 'P', 9, -9); return info(thm, base + 'P 与一个顶点重合或落在一条边所在的直线上，有的三角形退化，九点圆不存在。把 P 拖开一点。'); }
      nps.forEach((c, i) => circle({ x: c.x, y: c.y }, c.r, i ? BL : TE, i ? 1.4 : 2.2));

      const co = rectHyperbolaThrough([g.A, g.B, g.C, P].map(nrm));
      const big = Math.max(...co.map(Math.abs));
      const Po = big > 1e-12 && co.every(isFinite) ? conicCenter(co) : null;
      if (!Po) { dot(P, ink, 6.5); lab(P, 'P', 9, -9); return info(thm, base + 'P 落在垂心附近：过 A、B、C、H 的二次曲线全是等轴双曲线，中心铺满整个九点圆，Po 不再唯一。把 P 拖开一点。'); }

      ctx.strokeStyle = PU; ctx.lineWidth = LW(2.4);
      traceImplicit(ctx, (sx, sy) => evalConic(co, nrm(Wd({ x: sx, y: sy }))), W, H, 3);
      const Pw = un(Po);
      asymptoteSlopes(co).forEach((m) => lineInf(Pw, un(add(Po, { x: 1, y: m })), CO, 1.1, [7, 5]));
      dot(P, ink, 6.5); dot(Pw, CO, 6.5);
      labelPoints([[P, 'P'], [Pw, 'Po']], sub(P, Pw));

      // 实测：Po 到四个九点圆心的距离应等于各自半径
      const errs = nps.map((c) => Math.abs(len(sub(Pw, { x: c.x, y: c.y })) - c.r) / c.r);
      const worst = Math.max(...errs);
      return info(thm, base +
        '实测：Po 到四个九点圆心的距离与各自半径之差，相对误差最大 ' + worst.toExponential(1) + '，即 Po 同时落在这四个圆上。' +
        '<br>把 P 放到内心，Po 就是 Feuerbach 点；把 P 放到垂心，这条双曲线不再唯一。');
    },
  };

  /* ---------- 九点二次曲线：背景分区（离屏画布缓存） ----------
   * 每个小格把 P 放在格心，看九点二次曲线是椭圆还是双曲线。顶点、视图或画布尺寸变化后重算。 */
  const regionCv = document.createElement('canvas'), regionCtx = regionCv.getContext('2d');
  let regionKey = '';
  function ensureRegions(g, nrm) {
    const key = JSON.stringify([state.V, view, W, H]);
    if (key === regionKey) return;
    regionKey = key; regionCv.width = W; regionCv.height = H; regionCtx.clearRect(0, 0, W, H);
    const s = Math.max(6, Math.round(8 * K)), fixed = [mid(g.A, g.B), mid(g.A, g.C), mid(g.B, g.C)].map(nrm);
    for (let x = 0; x < W; x += s) for (let y = 0; y < H; y += s) {
      const Pc = Wd({ x: x + s / 2 + 0.37, y: y + s / 2 + 0.29 });
      const co = conicThrough([fixed[0], fixed[1], nrm(mid(g.A, Pc)), fixed[2], nrm(mid(g.B, Pc))]);
      const disc = co[1] * co[1] - 4 * co[0] * co[2];
      if (!isFinite(disc)) continue;
      regionCtx.fillStyle = disc < 0 ? 'rgba(29,158,117,0.13)' : 'rgba(216,90,48,0.11)';
      regionCtx.fillRect(x, y, s, s);
    }
  }
  /** P 投影到外接圆上；P 在圆心时取最右边的点 */
  function onCircumcircle(p, g) {
    const d = sub(p, g.O), L = len(d);
    return L < 1e-12 ? { x: g.O.x + g.R, y: g.O.y } : add(g.O, mul(d, g.R / L));
  }
  /** 外接圆上离三个顶点最远的位置（最大弧的中点），勾选「沿外接圆」时把 P 放在这里 */
  function arcMidpoint(g) {
    const t = [g.A, g.B, g.C].map((X) => Math.atan2(X.y - g.O.y, X.x - g.O.x)).sort((u, v) => u - v);
    const gaps = [[t[0], t[1]], [t[1], t[2]], [t[2], t[0] + 2 * Math.PI]];
    const [u, v] = gaps.reduce((best, gp) => (gp[1] - gp[0] > best[1] - best[0] ? gp : best));
    const m = (u + v) / 2;
    return { x: g.O.x + g.R * Math.cos(m), y: g.O.y + g.R * Math.sin(m) };
  }


  /* 七点球是三维的，绘制走 drawSeven（见下），不经过 DRAW 的二维流程；
     这里登记一个空项，好让 setTab 的标签校验认得它。 */
  DRAW.sevenpoint = () => '';
  DRAW.thirteen = () => '';
  const is3D = () => state.tab === 'sevenpoint' || state.tab === 'thirteen';

  /* ---------- 七点球：一套只在这个标签里用的三维工具 ---------- */
  const S3 = {
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: (a) => Math.hypot(a[0], a[1], a[2]),
  };
  /** 解 3×3 线性方程组（高斯消元，按列主元） */
  function solve3(M, r) {
    const A = M.map((row, i) => [...row, r[i]]);
    for (let i = 0; i < 3; i++) {
      let p = i;
      for (let k = i + 1; k < 3; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
      if (Math.abs(A[p][i]) < 1e-14) return null;
      [A[i], A[p]] = [A[p], A[i]];
      const d = A[i][i];
      for (let j = i; j < 4; j++) A[i][j] /= d;
      for (let k = 0; k < 3; k++) if (k !== i && A[k][i]) { const f = A[k][i]; for (let j = i; j < 4; j++) A[k][j] -= f * A[i][j]; }
    }
    return [A[0][3], A[1][3], A[2][3]];
  }
  const sq = (a) => S3.dot(a, a);
  /** 四面体外接球心 */
  function circum4(V) {
    return solve3([S3.mul(S3.sub(V[1], V[0]), 2), S3.mul(S3.sub(V[2], V[0]), 2), S3.mul(S3.sub(V[3], V[0]), 2)],
      [sq(V[1]) - sq(V[0]), sq(V[2]) - sq(V[0]), sq(V[3]) - sq(V[0])]);
  }
  /** 空间中三角形的外心 */
  function circum3d(P, Q, R) {
    const n = S3.cross(S3.sub(Q, P), S3.sub(R, P));
    return solve3([S3.mul(S3.sub(Q, P), 2), S3.mul(S3.sub(R, P), 2), n], [sq(Q) - sq(P), sq(R) - sq(P), S3.dot(n, P)]);
  }
  /** 空间中三角形的垂心 */
  function ortho3d(P, Q, R) {
    const n = S3.cross(S3.sub(Q, R), S3.sub(R, P));
    return solve3([S3.sub(Q, R), S3.sub(R, P), n], [S3.dot(S3.sub(Q, R), P), S3.dot(S3.sub(R, P), Q), S3.dot(n, P)]);
  }
  /** 七点球：给定四面体与所选顶点下标，返回七个点、球心与半径 */
  function sevenPoint(V, k) {
    const O = circum4(V); if (!O) return null;
    const R = S3.len(S3.sub(V[0], O));
    const u = V.map((p) => S3.mul(S3.sub(p, O), 1 / R));          // 归一化：O 为原点、R = 1
    const V0 = u[k], oth = [0, 1, 2, 3].filter((i) => i !== k).map((i) => u[i]);
    const G = S3.mul(oth.concat([V0]).reduce(S3.add), 0.25);
    const Op = circum3d(oth[0], oth[1], oth[2]); if (!Op) return null;
    const Hp = ortho3d(oth[0], oth[1], oth[2]); if (!Hp) return null;
    const c = solve3([S3.mul(G, 2), S3.mul(Op, 2), S3.mul(V0, 2)],
      [4 * sq(G) + 1, 4 * sq(Op) + 1, 8 * S3.dot(G, V0) - 3]);
    if (!c) return null;
    const r2 = sq(c) - 4; if (!(r2 > 0)) return null;
    const d = S3.sub(G, V0), t = 2 * (1 - S3.dot(G, V0)) / sq(d);
    const A = S3.add(V0, S3.mul(d, t));
    const B = solve3(oth, [1, 1, 1]); if (!B) return null;         // 三个切平面的交点
    const C = S3.sub(S3.mul(G, 4), S3.mul(V0, 3));
    const E = S3.mul(G, 1 / sq(G));
    const un = (p) => S3.add(O, S3.mul(p, R));                     // 还原到原坐标
    const pts = [[A, 'A'], [B, 'B'], [C, 'C'], [Hp, 'H′'], [E, 'E'], [S3.mul(G, 4), '4G−3O'], [S3.mul(Op, 4), '4O′−3O']];
    const err = Math.max(...pts.map(([p]) => Math.abs(Math.sqrt(sq(S3.sub(p, c))) - Math.sqrt(r2)))) / Math.sqrt(r2);
    return { O, R, G: un(G), Op: un(Op), c: un(c), rad: R * Math.sqrt(r2), err,
      pts: pts.map(([p, n]) => [un(p), n]) };
  }


  /* ---------- 七点球：投影与绘制 ---------- */
  /** 默认四面体（挑过形状：球不太大，七点都在画面里） */
  /* 默认四面体：外接球归一化后挑出来的——四个顶点的七点球半径都在 2.3–4.4 R，
     七个点连同顶点的包围盒只有 1.85 R，整张图不会被巨大的球撑开。 */
  const TET0 = [[0.479, 0.858, 0.185], [0.118, -0.766, 0.632], [-0.987, -0.14, 0.082], [-0.354, 0.675, 0.647]];
  /* 两个三维标签各记各的视角：十三点球的默认视角挑过，从侧面看，十三个点在屏幕上分得开 */
  const curRot = () => (state.tab === 'thirteen' ? state.rot13 : state.rot);
  function rot3(p) {
    const { yaw, pitch } = curRot();
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x = p[0] * cy - p[1] * sy, y = p[0] * sy + p[1] * cy;      // 绕 z 轴
    return [x, y * cp - p[2] * sp, y * sp + p[2] * cp];              // 再绕 x 轴
  }
  let view3 = { s: 100, ox: 0, oy: 0 };
  const P3 = (p) => { const q = rot3(p); return { x: view3.ox + q[0] * view3.s, y: view3.oy - q[2] * view3.s }; };
  /* 取景：比例只在换四面体、换顶点或画布尺寸变化时按当时的视角算一次，之后转动不再重算，
   * 图形大小不随视角忽大忽小；画面中心固定对准这些点的三维包围盒中心。最后乘用户缩放倍数。 */
  let base3 = { key: '', s: 1, c: [0, 0, 0] };
  function fit3(pts) {
    const key = JSON.stringify([pts, W, H]);
    if (key !== base3.key) {
      const lo = [0, 1, 2].map((i) => Math.min(...pts.map((p) => p[i]))), hi = [0, 1, 2].map((i) => Math.max(...pts.map((p) => p[i])));
      const c = lo.map((v, i) => (v + hi[i]) / 2), q = pts.map(rot3), qc = rot3(c);
      const hx = Math.max(...q.map((p) => Math.abs(p[0] - qc[0]))), hz = Math.max(...q.map((p) => Math.abs(p[2] - qc[2])));
      base3 = { key, c, s: Math.min((W - 90 * K) / 2 / Math.max(hx, 1e-9), (H - 70 * K) / 2 / Math.max(hz, 1e-9)) };
    }
    const s = state.zoom * base3.s, q = rot3(base3.c);
    view3 = { s, ox: W / 2 - s * q[0], oy: H / 2 + s * q[2] };
  }
  function seg3(a, b, col, w, dash) { const p = P3(a), q = P3(b); ctx.beginPath(); ctx.setLineDash(DASH(dash)); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = col; ctx.lineWidth = LW(w); ctx.stroke(); ctx.setLineDash([]); }
  function dot3(p, col, r) { const q = P3(p); ctx.beginPath(); ctx.arc(q.x, q.y, PR(r), 0, 7); ctx.fillStyle = col; ctx.fill(); }
  /** 球的线框：正交投影下轮廓是正圆，再加三个大圆当网格 */
  function sphere3(c, r, col, w, grid) {
    const q = P3(c);
    ctx.beginPath(); ctx.setLineDash([]); ctx.arc(q.x, q.y, r * view3.s, 0, 7);
    ctx.strokeStyle = col; ctx.lineWidth = LW(w); ctx.stroke();
    if (!grid) return;
    ctx.globalAlpha = 0.45;
    const rings = [[0, 1, 2], [1, 2, 0], [2, 0, 1]];
    for (const [a, b] of rings) {
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const t = i / 60 * 2 * Math.PI, e = [0, 0, 0];
        e[a] = Math.cos(t) * r; e[b] = Math.sin(t) * r;
        const s = P3(S3.add(c, e));
        i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y);
      }
      ctx.strokeStyle = col; ctx.lineWidth = LW(w * 0.5); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  /** 三维标注：在点周围试几个方位，避开已经放下的标签和点 */
  let placed3 = [];
  function lab3(p, txt, col) {
    const q = P3(p), fs = FS(), dd = OFF(10);
    if (!(q.x >= 0 && q.x <= W && q.y >= 0 && q.y <= H)) return;   // 点在画面外（比如放大后）就不标
    ctx.font = '600 ' + fs + 'px sans-serif';
    const w = ctx.measureText(txt).width;
    const dirs = [[1, -1], [1, 1], [-1, -1], [-1, 1], [1, 0], [-1, 0], [0, -1], [0, 1]];
    let best = null;
    for (const m of [1, 1.9, 2.9]) {
      for (const [ux, uy] of dirs) {
        const L = Math.hypot(ux, uy), cx = q.x + ux / L * dd * m, cy = q.y + uy / L * dd * m;
        const r = { x: ux > 0.35 ? cx : cx - w, y: (uy > 0.35 ? cy : cy - fs), w, h: fs };
        if (r.x < 2 || r.x + w > W - 2 || r.y < 2 || r.y + fs > H - 2) continue;
        if (placed3.some((o) => r.x < o.x + o.w + 4 && o.x < r.x + r.w + 4 && r.y < o.y + o.h + 4 && o.y < r.y + r.h + 4)) continue;
        best = r; break;
      }
      if (best) break;
    }
    if (!best) best = { x: Math.min(Math.max(q.x + dd, 2), W - w - 2), y: Math.min(Math.max(q.y - dd - fs, 2), H - fs - 2), w, h: fs };
    placed3.push(best);
    ctx.fillStyle = col; ctx.fillText(txt, best.x, best.y + fs * 0.82);
  }


  /** 七点球标签的绘制；返回图下说明 */
  function drawSeven(ink) {
    if (!state.tet) state.tet = TET0.map((p) => p.slice());
    const sec = css('--muted'), V = state.tet, k = state.v0;
    const d = sevenPoint(V, k);
    const thm = '<b>七点球定理</b>：取四面体 V0V1V2V3 与它的任一顶点（这里是 V' + k + '），记外接球心 O、半径 R，重心 G，对面的外心 O′、垂心 H′。' +
      '则下面七点共球：A（直线 V0G 与外接球的第二个交点）、B（外接球在另三个顶点处切平面的交点，即对面的极点）、C = 4G − 3V0、H′、E（G 关于外接球的反演点）、4G − 3O、4O′ − 3O。四个顶点各给出一个这样的球。';
    const ops = '<b>按住拖动可以转动整个图形</b>，双指捏合或 ⌘/Ctrl＋滚轮缩放；用上面的按钮换一个顶点或换一个四面体。灰色是外接球，紫色是七点球，橙、绿、蓝三条虚线是定出球心的三组共线关系。<br>';
    if (!d) return info(thm, ops + '这个四面体接近退化（O、G、O′、V0 几乎共面），七点球退化成平面，暂不绘制。换一个四面体。');
    const all = d.pts.map(([p]) => p).concat(V, [d.O]);
    fit3(all); placed3 = [];
    // 外接球
    if (state.showCircum) sphere3(d.O, d.R, GR, 1.1, true);
    // 四面体
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) seg3(V[i], V[j], ink, 1.4);
    // 七点球
    sphere3(d.c, d.rad, PU, 2.2, true);
    // 三组共线
    const by = (n) => d.pts.find(([, t]) => t === n)[0];
    seg3(V[k], by('C'), AM, 1.2, [7, 5]);
    seg3(d.O, by('4G−3O'), TE, 1.2, [7, 5]);
    seg3(d.O, by('4O′−3O'), BL, 1.2, [7, 5]);
    // 点与标注
    [[d.O, 'O', sec], [d.G, 'G', sec], [d.Op, 'O′', sec]].forEach(([p, t, c]) => { dot3(p, c, 4); lab3(p, t, sec); });
    V.forEach((p, i) => { dot3(p, ink, 5); lab3(p, 'V' + i, ink); });
    d.pts.forEach(([p, t]) => { dot3(p, CO, 6); lab3(p, t, CO); });
    return info(thm, ops + '实测：七点到球心的距离与半径之差，相对误差最大 ' + d.err.toExponential(1) +
      '；球半径 ' + fmt(d.rad / d.R, 2) + ' R。' +
      '<br>证明与文献检索见仓库中的《七点球定理》（docs/七点球定理.md）。');
  }

  /* ---------- 十三点球（垂心四面体） ---------- */
  /** 垂心四面体：底面三角形放在 z = 0，V0 放在它的垂心正上方 h 处（一个顶点的高足是对面垂心 ⇔ 垂心四面体）；
   *  再平移缩放成外接球心在原点、R = 1 */
  function orthoTet(tri, h) {
    const T = tri.map(([x, y]) => [x, y, 0]), Hp = ortho3d(...T); if (!Hp) return null;
    const V = [S3.add(Hp, [0, 0, h]), ...T], O = circum4(V); if (!O) return null;
    const R = S3.len(S3.sub(V[0], O));
    return V.map((p) => S3.mul(S3.sub(p, O), 1 / R));
  }
  /* 默认四面体：挑过形状，四个顶点的十三点球半径都在 0.6–0.86 R，十三个点彼此不太挤 */
  const TRI13 = [[-0.81, 0.173], [0.173, 0.971], [0.326, 0.066]], H13 = 0.548;
  /** 十三点球：给定垂心四面体与所选顶点下标，返回球、十三个点和几条辅助线的端点 */
  function thirteenPoint(V, k) {
    const O = circum4(V); if (!O) return null;
    const R = S3.len(S3.sub(V[0], O));
    // 垂心 H：过 V0 的高垂直于 V1V2、V1V3，过 V1 的高垂直于 V0V2
    const e = [S3.sub(V[2], V[1]), S3.sub(V[3], V[1]), S3.sub(V[2], V[0])];
    const H = solve3(e, [S3.dot(e[0], V[0]), S3.dot(e[1], V[0]), S3.dot(e[2], V[1])]); if (!H) return null;
    const p = S3.dot(S3.sub(V[0], H), S3.sub(V[1], H));           // 极球的幂 HV_i · HH_i，对四个顶点相同
    const Vd = V[k], oi = [0, 1, 2, 3].filter((i) => i !== k), T = oi.map((i) => V[i]);
    const Hp = ortho3d(...T); if (!Hp) return null;
    const M = T.map((_, j) => S3.mul(S3.add(T[(j + 1) % 3], T[(j + 2) % 3]), 0.5));
    const F = T.map((X, j) => { const A = T[(j + 1) % 3], u = S3.sub(T[(j + 2) % 3], A); return S3.add(A, S3.mul(u, S3.dot(S3.sub(X, A), u) / sq(u))); });
    const E = T.map((X) => S3.mul(S3.add(X, Hp), 0.5));
    const c = circum4([Vd, ...M]); if (!c) return null;
    const rad = S3.len(S3.sub(Vd, c));
    const Gd = S3.mul(T.reduce(S3.add), 1 / 3), g = S3.sub(Gd, H);
    if (sq(g) < 1e-20) return null;
    const P = S3.add(H, S3.mul(g, p / sq(g)));                     // ψ(Gd)：以 H 为中心、幂 p 的反演
    const anti = S3.sub(S3.mul(O, 2), Vd), Q1 = S3.mul(S3.add(H, anti), 0.5);
    const u = S3.sub(H, Vd), X2 = S3.add(Vd, S3.mul(u, -2 * S3.dot(S3.sub(Vd, O), u) / sq(u))), Q2 = S3.mul(S3.add(H, X2), 0.5);
    const nine = circum3d(...M), r9 = S3.len(S3.sub(M[0], nine)), nrm = S3.cross(S3.sub(T[1], T[0]), S3.sub(T[2], T[0]));
    const pts = [[Vd, 'V' + k]].concat(M.map((q, j) => [q, 'M' + oi[j]]), F.map((q, j) => [q, 'F' + oi[j]]), E.map((q, j) => [q, 'E' + oi[j]]),
      [[P, 'P'], [Q1, 'Q1'], [Q2, 'Q2']]);
    const err = Math.max(...pts.map(([q]) => Math.abs(S3.len(S3.sub(q, c)) - rad))) / rad;
    const pow = (sq(S3.sub(H, c)) - rad * rad) / p;
    return { O, R, H, p, Hp, Gd, T, F, c, rad, err, pow, anti, X2, nine, r9, nrm, pts };
  }
  /** 空间中的圆：圆心 c、法向 n、半径 r */
  function circle3(c, n, r, col, w) {
    const a = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    const e1 = S3.cross(n, a), e2 = S3.cross(n, e1), u1 = S3.mul(e1, r / S3.len(e1)), u2 = S3.mul(e2, r / S3.len(e2));
    ctx.beginPath();
    for (let i = 0; i <= 72; i++) {
      const t = i / 72 * 2 * Math.PI, q = P3(S3.add(c, S3.add(S3.mul(u1, Math.cos(t)), S3.mul(u2, Math.sin(t)))));
      i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
    }
    ctx.strokeStyle = col; ctx.lineWidth = LW(w); ctx.setLineDash([]); ctx.stroke();
  }
  /** 十三点球标签的绘制；返回图下说明 */
  function drawThirteen(ink) {
    if (!state.tet13) state.tet13 = orthoTet(TRI13, H13);
    const sec = css('--muted'), V = state.tet13, k = state.v0;
    const d = thirteenPoint(V, k);
    const vk = 'V' + k, others = [0, 1, 2, 3].filter((i) => i !== k).map((i) => 'V' + i).join('');
    const thm = '<b>十三点球</b>：设 V0V1V2V3 是垂心四面体（三对对棱互相垂直，四条高交于垂心 H），取一个顶点（这里是 ' + vk + '），对面 ' + others + ' 的重心 G′、垂心 H′。' +
      '过 ' + vk + ' 和对面九点圆的球 Σ 总是唯一存在（任何四面体都如此，这是 Σ 的定义）。垂心四面体中，Σ 还经过另外三个点：' +
      'P（G′ 关于极球的反演点）、Q1（H 与 ' + vk + ' 的外接球对径点的中点）、Q2（H 与高线 ' + vk + 'H 和外接球第二个交点的中点）；并且 <b>H 对 Σ 的幂恒为 (3/2)p</b>，与形状无关。' +
      '<br>这里 p = HV<sub>i</sub> · HH<sub>i</sub>（H<sub>i</sub> 是 V<sub>i</sub> 的高足）对四个顶点相同，极球反演就是以 H 为中心、幂为 p 的反演。' +
      '顶点、九点圆上的 9 个点（对面三边中点 M、三条高的垂足 F、三个欧拉点 E）再加 P、Q1、Q2，共 13 个点。';
    const ops = '<b>按住拖动可以转动整个图形</b>，双指捏合或 ⌘/Ctrl＋滚轮缩放；用上面的按钮换一个顶点或换一个垂心四面体。灰色是外接球，紫色是十三点球 Σ，浅蓝面是对面，蓝色粗圆是它的九点圆，蓝色细线是面内三条高（交于 H′）；' +
      '棕、绿、粉三条虚线分别给出 P、Q1、Q2。<br>';
    if (!d) return info(thm, ops + '这个四面体接近退化，暂不绘制。换一个四面体。');
    const all = d.pts.map(([q]) => q).concat(V, [d.O, d.H, d.anti, d.X2]);
    fit3(all); placed3 = [];
    if (state.showCircum) sphere3(d.O, d.R, GR, 1.1, true);
    // 对面：浅蓝填充、九点圆、面内三条高
    ctx.beginPath(); d.T.map(P3).forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath();
    ctx.fillStyle = 'rgba(55,138,221,0.13)'; ctx.fill();
    d.T.forEach((X, j) => seg3(X, d.F[j], BL, 0.9));
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) seg3(V[i], V[j], ink, 1.4);
    circle3(d.nine, d.nrm, d.r9, BL, 2.2);
    sphere3(d.c, d.rad, PU, 2.2, true);
    // 辅助线：P、H、G′、Q1 和对径点其实在一条直线上（对径点 − H = 3(G′ − H)），按图例分两段上色
    const by = (n) => d.pts.find(([, t]) => t === n)[0];
    seg3(by('P'), d.Gd, AM, 1.2, [7, 5]);
    seg3(d.Gd, d.anti, TE, 1.2, [7, 5]);
    seg3(V[k], d.X2, PK, 1.2, [7, 5]);
    // 点与标注：先标十三个点，再标辅助点
    d.pts.forEach(([q, t], i) => { dot3(q, CO, i === 0 || i > 9 ? 6 : 4.5); lab3(q, t, CO); });
    V.forEach((q, i) => { if (i !== k) { dot3(q, ink, 5); lab3(q, 'V' + i, ink); } });
    [[d.H, 'H'], [d.Hp, 'H′'], [d.Gd, 'G′'], [d.O, 'O'], [d.anti, vk + ' 的对径点'], [d.X2, '高线与外接球交点']].forEach(([q, t]) => { dot3(q, sec, 4); lab3(q, t, sec); });
    return info(thm, ops + '实测：十三个点到球心的距离与半径之差，相对误差最大 ' + d.err.toExponential(1) +
      '；H 对 Σ 的幂 ÷ p = ' + d.pow.toFixed(9) + '；球半径 ' + fmt(d.rad / d.R, 2) + ' R。' +
      '<br>证明与文献检索见仓库中的《垂心四面体六条定理》（docs/垂心四面体六条定理.md）第一节。');
  }

  /* ---------- 主绘制 ---------- */
  function draw() {
    ctx.clearRect(0, 0, W, H); placed = [];
    const ink = css('--ink');
    if (state.tab === 'sevenpoint') { document.getElementById('info').innerHTML = drawSeven(ink); return; }
    if (state.tab === 'thirteen') { document.getElementById('info').innerHTML = drawThirteen(ink); return; }
    if (degenerate()) {
      const [A, B, C] = state.V; tri(A, B, C, ink, 1.3);
      [[A, 'A'], [B, 'B'], [C, 'C']].forEach(([p, n]) => { dot(p, ink, 5.5); lab(p, n, -16, -9); });
      document.getElementById('info').innerHTML = 'A、B、C 几乎在一条直线上（或有两点重合），三角形退化，外接圆、垂心和九点圆都不存在。把顶点拖开一些。';
      return;
    }
    const g = geo();
    placed = [[g.A, 'A'], [g.B, 'B'], [g.C, 'C']].map(([p, n]) => { const r = labPos(p, n, -16, -9); return { x: r.x, y: r.y - r.h, w: r.w, h: r.h }; });
    if (state.tab !== 'orthocentric' && state.tab !== 'conic') tri(g.A, g.B, g.C, ink, 1.3);
    const info = DRAW[state.tab](g);
    [[g.A, 'A'], [g.B, 'B'], [g.C, 'C']].forEach(([p, n]) => { dot(p, ink, 5.5); lab(p, n, -16, -9); });
    document.getElementById('info').innerHTML = info;
  }

  /* ---------- 控件 ---------- */
  const tabsEl = document.getElementById('tabs'), optsEl = document.getElementById('opts'), legendEl = document.getElementById('legend');
  function chip(text, pressed, onClick) {
    const b = document.createElement('button'); b.className = 'chip'; b.type = 'button';
    b.textContent = text; b.setAttribute('aria-pressed', pressed ? 'true' : 'false'); b.onclick = onClick; return b;
  }
  function renderTabs() {
    tabsEl.innerHTML = '';
    TABS.forEach(([id, name]) => tabsEl.appendChild(chip(name, id === state.tab, () => setTab(id, true))));
  }
  function renderOpts() {
    optsEl.innerHTML = '';
    if (state.tab === 'euler') {
      [['pb', '中垂线'], ['md', '中线'], ['al', '高']].forEach(([key, n]) => {
        const l = document.createElement('label'); l.className = 'ck';
        const c = document.createElement('input'); c.type = 'checkbox'; c.checked = state.show[key];
        c.onchange = () => { state.show[key] = c.checked; draw(); };
        l.append(c, '显示' + n); optsEl.appendChild(l);
      });
    }
    if (state.tab === 'homothety') {
      optsEl.append(
        chip('以垂心 H 为中心', state.center === 'H', () => { state.center = 'H'; state.k = 1; renderOpts(); draw(); }),
        chip('以重心 G 为中心', state.center === 'G', () => { state.center = 'G'; state.k = 1; renderOpts(); draw(); }));
      const l = document.createElement('label'); l.style.cssText = 'display:flex;align-items:center;gap:8px;flex:1;min-width:220px';
      const s = document.createElement('input'); s.type = 'range'; s.min = state.center === 'H' ? 0.2 : -1; s.max = 1.2; s.step = 0.01; s.value = state.k; s.style.flex = '1';
      s.setAttribute('aria-label', '缩放比例 k');
      const out = document.createElement('span'); out.style.minWidth = '64px'; out.textContent = 'k = ' + fmt(state.k);
      s.oninput = () => {
        let k = +s.value; const tg = state.center === 'H' ? 0.5 : -0.5;
        if (Math.abs(k - tg) < 0.02) { k = tg; s.value = tg; }
        state.k = k; out.textContent = 'k = ' + fmt(k); draw();
      };
      l.append('缩放比例', s, out); optsEl.appendChild(l);
    }
    if (state.tab === 'orthocentric') {
      ['ABC', 'ABH', 'ACH', 'BCH'].forEach((n, i) => optsEl.appendChild(chip('三角形 ' + n, i === state.tri, () => { state.tri = i; renderOpts(); draw(); })));
    }
    if (state.tab === 'sevenpoint') {
      ['V0', 'V1', 'V2', 'V3'].forEach((n, i) => optsEl.appendChild(chip('顶点 ' + n, i === state.v0, () => { state.v0 = i; renderOpts(); draw(); })));
      optsEl.appendChild(chip('换一个四面体', false, () => {
        for (let tries = 0; tries < 200; tries++) {
          const V = Array.from({ length: 4 }, () => Array.from({ length: 3 }, () => (Math.random() * 2 - 1) * 1.3));
          const d0 = sevenPoint(V, state.v0);
          if (!d0 || d0.rad / d0.R > 4.5) continue;                       // 球别太大
          if (Math.abs(S3.dot(S3.sub(V[1], V[0]), S3.cross(S3.sub(V[2], V[0]), S3.sub(V[3], V[0])))) / 6 < 0.12 * Math.pow(d0.R, 3)) continue;  // 别太扁
          const sp = Math.max(...d0.pts.map(([q]) => S3.len(S3.sub(q, d0.O)))) / d0.R;
          if (sp > 3.2) continue;                                          // 七点别跑太远
          state.tet = V; break;
        }
        draw();
      }));
      optsEl.appendChild(chip('回到默认', false, () => { state.tet = TET0.map((p) => p.slice()); state.rot = { yaw: -0.6, pitch: -1.15 }; base3.key = ''; setZoom(1); }));
      const l = document.createElement('label'); l.className = 'ck';
      const c = document.createElement('input'); c.type = 'checkbox'; c.checked = state.showCircum;
      c.onchange = () => { state.showCircum = c.checked; draw(); };
      l.append(c, '显示外接球'); optsEl.appendChild(l);
    }
    if (state.tab === 'thirteen') {
      ['V0', 'V1', 'V2', 'V3'].forEach((n, i) => optsEl.appendChild(chip('顶点 ' + n, i === state.v0, () => { state.v0 = i; renderOpts(); draw(); })));
      optsEl.appendChild(chip('换一个垂心四面体', false, () => {
        for (let tries = 0; tries < 300; tries++) {
          const tri = [0, 1, 2].map(() => [Math.random() * 2 - 1, Math.random() * 2 - 1]);
          const V = orthoTet(tri, (0.3 + Math.random() * 1.7) * (Math.random() < 0.5 ? 1 : -1));
          if (!V) continue;
          if (Math.abs(S3.dot(S3.sub(V[1], V[0]), S3.cross(S3.sub(V[2], V[0]), S3.sub(V[3], V[0])))) / 6 < 0.15) continue;   // 别太扁（R = 1）
          const d0 = thirteenPoint(V, state.v0);
          if (!d0 || d0.rad > 1.6) continue;                                                       // 球别太大
          if (Math.max(...d0.pts.map(([q]) => S3.len(q)), S3.len(d0.H)) > 2) continue;              // 点别跑太远
          state.tet13 = V; break;
        }
        draw();
      }));
      optsEl.appendChild(chip('回到默认', false, () => { state.tet13 = orthoTet(TRI13, H13); state.rot13 = { yaw: -2.09, pitch: -0.7 }; base3.key = ''; setZoom(1); }));
      const l = document.createElement('label'); l.className = 'ck';
      const c = document.createElement('input'); c.type = 'checkbox'; c.checked = state.showCircum;
      c.onchange = () => { state.showCircum = c.checked; draw(); };
      l.append(c, '显示外接球'); optsEl.appendChild(l);
    }
    if (state.tab === 'poncelet') {
      optsEl.append(
        chip('把 P 放到内心', false, () => { const g = geo(); state.P = { x: g.I.x, y: g.I.y }; draw(); }),
        chip('把 P 放到垂心', false, () => { const g = geo(); state.P = { x: g.H.x, y: g.H.y }; draw(); }));
    }
    if (state.tab === 'conic') {
      optsEl.appendChild(chip('把 P 放到垂心', false, () => { state.onCircle = false; const g = geo(); state.P = { x: g.H.x, y: g.H.y }; renderOpts(); draw(); }));
      const l = document.createElement('label'); l.className = 'ck';
      const c = document.createElement('input'); c.type = 'checkbox'; c.checked = state.onCircle;
      c.onchange = () => { state.onCircle = c.checked; if (c.checked) state.P = arcMidpoint(geo()); draw(); };
      l.append(c, '让 P 只能沿外接圆走'); optsEl.appendChild(l);
      const k = document.createElement('span'); k.innerHTML = '曲线类型：<b id="ckind" style="color:var(--ink)">—</b>'; optsEl.appendChild(k);
    }
    legendEl.innerHTML = '';
    LEG[state.tab].forEach(([c, n]) => { const s = document.createElement('span'); s.innerHTML = '<i style="background:' + c + '"></i>' + n; legendEl.appendChild(s); });
  }
  function setTab(id, pushHash) {
    if (!DRAW[id]) id = TABS[0][0];
    state.tab = id; if (id === 'homothety') state.k = 1;
    fit();
    if (pushHash && location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    renderTabs(); renderOpts(); renderRelated(); draw();
  }

  /* ---------- 拖动 ---------- */
  let drag = null;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
  const draggablePoint = () => ['simson', 'homothety', 'conic', 'poncelet'].includes(state.tab);
  function movePoint(p) {
    const w = Wd(p), g = geo();
    if (state.tab === 'simson' || state.tab === 'homothety') state.theta = Math.atan2(w.y - g.O.y, w.x - g.O.x);
    else if (state.tab === 'conic') state.P = state.onCircle ? onCircumcircle(w, g) : w;
    else if (state.tab === 'poncelet') state.P = w;
    draw();
  }
  /* 缩放：以画布中心为中心，倍数夹在 ZMIN–ZMAX；点、线宽、文字保持像素大小不变 */
  const zoomOut = document.getElementById('zoom-level');
  function setZoom(z) {
    state.zoom = Math.min(ZMAX, Math.max(ZMIN, z));
    if (zoomOut) zoomOut.textContent = Math.round(state.zoom * 100) + '%';
    fit(); draw();
  }
  document.getElementById('zoom-in').onclick = () => setZoom(state.zoom * 1.25);
  document.getElementById('zoom-out').onclick = () => setZoom(state.zoom / 1.25);
  document.getElementById('zoom-reset').onclick = () => setZoom(1);
  // 触控板捏合（Chrome、Firefox 发出带 ctrlKey 的 wheel）和 ⌘/Ctrl＋滚轮；不按键的滚轮照常滚动页面
  cv.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom(state.zoom * Math.exp(-Math.max(-40, Math.min(40, e.deltaY)) * 0.005));   // 鼠标滚一格约 ×1.22，和按钮一步相当
  }, { passive: false });
  // Safari 的触控板捏合走 gesture 事件
  let gz = 1;
  cv.addEventListener('gesturestart', (e) => { e.preventDefault(); gz = state.zoom; });
  cv.addEventListener('gesturechange', (e) => { e.preventDefault(); setZoom(gz * e.scale); });
  // 触屏：两根手指按下即进入捏合，松开任一根后结束，不再接着拖动
  const touches = new Map();
  const spread = () => { const [a, b] = [...touches.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  cv.addEventListener('pointerdown', (e) => {
    const p = pos(e);
    touches.set(e.pointerId, p);
    if (touches.size === 2) { drag = { pinch: true, d0: Math.max(spread(), 1), z0: state.zoom }; cv.setPointerCapture(e.pointerId); return; }
    if (touches.size > 2 || (drag && drag.pinch)) return;
    if (is3D()) { drag = { rot: true, x: p.x, y: p.y }; cv.setPointerCapture(e.pointerId); return; }
    let vi = -1;
    state.V.forEach((v, i) => { const s = S(v); if (Math.hypot(s.x - p.x, s.y - p.y) < HIT()) vi = i; });
    if (vi >= 0) drag = { v: vi };
    else if (draggablePoint()) { drag = { pt: true }; movePoint(p); }
    else return;
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', (e) => {
    if (touches.has(e.pointerId)) touches.set(e.pointerId, pos(e));
    if (!drag) return; const p = pos(e);
    if (drag.pinch) { if (touches.size >= 2) setZoom(drag.z0 * spread() / drag.d0); return; }
    if (drag.rot) {
      const r = curRot();
      r.yaw += (p.x - drag.x) * 0.012;
      r.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, r.pitch + (p.y - drag.y) * 0.012));
      drag.x = p.x; drag.y = p.y; draw(); return;
    }
    if (drag.pt) movePoint(p); else { state.V[drag.v] = Wd(p); draw(); }
  });
  const endPointer = (e) => { touches.delete(e.pointerId); const wasVertex = drag && drag.v !== undefined; drag = null; if (wasVertex) { fit(); draw(); } };
  cv.addEventListener('pointerup', endPointer);
  cv.addEventListener('pointercancel', endPointer);

  /* ---------- 与目录中定理的链接（可选） ----------
   * 读取 ../data/demos.json 与 ../data/theorems.json；文件不存在时静默跳过。 */
  let demos = null, theorems = null;
  function renderRelated() {
    const el = document.getElementById('related');
    if (!demos || !theorems) { el.hidden = true; return; }
    const entry = (demos.links || []).find((l) => l.anchor === state.tab);
    const ids = entry ? entry.theorem_ids || [] : [];
    const items = ids.map((id) => theorems.find((t) => t.id === id)).filter(Boolean);
    if (!items.length) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = '目录中对应的定理：' + items.map((t) => '<a href="../index.html#' + t.id + '">' + t.id + ' ' + t.name + '</a>').join('，');
  }
  Promise.all([fetch('../data/demos.json').then((r) => r.ok ? r.json() : null), fetch('../data/theorems.json').then((r) => r.ok ? r.json() : null)])
    .then(([d, t]) => { demos = d; theorems = t && (t.theorems || t); renderRelated(); })
    .catch(() => {});

  window.addEventListener('hashchange', () => setTab(location.hash.slice(1), false));
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  let lastW = W;
  const onResize = () => { const w = Math.round(cv.clientWidth); if (w && w !== lastW) { lastW = w; resizeCanvas(); fit(); draw(); } };
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(cv.parentElement); else window.addEventListener('resize', onResize);

  fit();
  setTab(location.hash.slice(1) || TABS[0][0], false);
})();
