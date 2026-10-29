/* 几何图谱 · 家族页「九点圆家族」
 * 依赖 geometry.js（window.GA）。
 * 每个标签页有锚点：#orthocentric #euler #homothety #feuerbach #simson #conic #nagel #soddy #mandart #poncelet */
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

  /* 配色和视频、卡片缩略图统一：颜色编码的是角色，跨定理一致。
     中线蓝 · 中垂线绿 · 高红 · 欧拉线和关键点橙 · 九点圆与欧拉点紫 · 灰是陪衬。 */
  const C_BLU = '#7fb2ee',   // 中线
        C_GRN = '#2fbf8a',   // 中垂线、内切圆
        C_RED = '#e0616a',   // 高、垂足
        C_ORG = '#ef7a3a',   // 欧拉线、关键点
        C_PUR = '#b07ae8',   // 九点圆、欧拉点
        C_AMB = '#e0b061',   // 第二组辅助对象
        C_WHT = 'MAIN',      // 主对象：欧拉线、九点圆。跟主题走，见下面的 mainCol()
        C_FOT = '#58a6f0',   // 垂足（视频里垂足用的是另一种蓝）
        C_GRY = '#8a8f99';   // 外接圆这类陪衬
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#888';
  /** 主对象的颜色：深色底上接近白，浅色底上是墨色。视频只有深色版，照搬固定白会在浅色主题里消失。 */
  const mainCol = () => css('--ink');
  /** 画的时候把 'MAIN' 这个占位换成当前主题的墨色 */
  const col = (c) => (c === 'MAIN' ? mainCol() : c);

  /* 顺序、编号、名字全部从 data/atlas.js 推导：图谱和这里是同一份清单，
     改名、调顺序、加定理都只动那一个文件，两边不可能再对不上。
     只收这一页有画法（DRAW 里有）的那些锚点。 */
  const PAGE = 'figures.html';
  const TABS = (function () {
    const A = window.ATLAS;
    const out = [];
    if (A) {
      A.theorems.forEach((t) => {
        const d = t.demo || '';
        if (d.indexOf(PAGE) < 0) return;
        const id = d.slice(d.indexOf('#') + 1);
        if (!id || out.some((x) => x[0] === id)) return;
        out.push([id, t.name, t.id]);
      });
    }
    return out.length ? out : [['orthocentric', '九点圆', '']];
  })();
  const tabIndex = (id) => TABS.findIndex((x) => x[0] === id);
  const LEG = {
    euler: [[C_GRN, '中垂线 → O'], [C_BLU, '中线 → G'], [C_RED, '高 → H'], [C_WHT, '欧拉线 · 九点圆'], [C_ORG, 'O、G、H']],
    homothety: [[C_GRY, '外接圆与样点'], [C_AMB, '缩放后的圆'], [C_PUR, '九点圆']],
    feuerbach: [[C_GRN, '角平分线、内切圆、旁切圆'], [C_ORG, '直线 NI 与切点'], [C_WHT, '九点圆']],
    simson: [[C_WHT, '西姆松线'], [C_FOT, '三个垂足'], [C_RED, '三条高 → 垂心 H'], [C_AMB, '线段 PH'], [C_WHT, '九点圆']],
    ninepoint: [[C_WHT, '九点圆'], [C_ORG, '三边中点'], [C_FOT, '三个垂足'], [C_PUR, '三个欧拉点'], [C_RED, '三条高 → 垂心'], [C_GRY, '外接圆']],
    orthocentric: [[C_WHT, '当前三角形 · 九点圆'], [C_RED, '它的三条高 → 垂心'], [C_ORG, '三边中点'], [C_FOT, '三个垂足'], [C_PUR, '三个欧拉点']],
    power: [[C_AMB, 'PA'], [C_BLU, 'PB'], [C_ORG, 'P · 切线 PT'], [C_WHT, '圆（圆锥曲线）']],
    radical: [[C_WHT, '三条根轴'], [C_ORG, '根心'], [C_AMB, '圆① 与它的切线'], [C_BLU, '圆②'], [C_GRN, '圆③']],
    monge: [[C_WHT, 'Monge 线'], [C_AMB, '第一对与它们的外位似中心'], [C_BLU, '第二对'], [C_GRN, '第三对']],
    miquel: [[C_ORG, 'Miquel 点 M'], [C_AMB, '三角形 AXY'], [C_BLU, 'BXZ'], [C_GRN, 'CYZ'], [C_PUR, 'ABC']],
    pascal: [[C_WHT, 'Pascal 线'], [C_ORG, '三组对边的交点'], [C_AMB, '第一组对边'], [C_BLU, '第二组'], [C_GRN, '第三组']],
    brianchon: [[C_WHT, '外切六边形'], [C_ORG, 'Brianchon 点'], [C_AMB, '第一条对角线'], [C_BLU, '第二条'], [C_GRN, '第三条']],
    pappus: [[C_WHT, '六个点 · Pappus 线'], [C_ORG, '三个交点'], [C_AMB, '第一组交叉连线'], [C_BLU, '第二组'], [C_GRN, '第三组']],
    desargues: [[C_WHT, '透视轴'], [C_ORG, '透视中心 O（空心）与三个交点（实心）'], [C_AMB, '第一组对应边'], [C_BLU, '第二组'], [C_GRN, '第三组']],
    napoleon: [[C_WHT, '拿破仑三角形'], [C_ORG, '三个正三角形的中心'], [C_AMB, '三个外接正三角形与刻度']],
    morley: [[C_WHT, 'Morley 三角形'], [C_ORG, '相邻三等分线的交点'], [C_AMB, '六条三等分线与刻度']],
    gergonne: [[C_ORG, 'Gergonne 点'], [C_GRN, '内切圆'], [C_AMB, '切点与切线长的刻度'], [C_BLU, '三条连线']],
    nagelpoint: [[C_ORG, 'Nagel 点'], [C_GRN, '三个旁切圆'], [C_AMB, '切点与三种长度的刻度'], [C_BLU, '三条连线']],
    fermat: [[C_ORG, 'Fermat 点 F 与三个 120° 角'], [C_AMB, 'PA、PB、PC']],
    centers: [[C_ORG, '四个心 G、O、I、H'], [C_BLU, '中线 → G'], [C_GRN, '中垂线 → O'], [C_AMB, '角平分线 → I'], [C_RED, '高 → H']],
    ceva: [[C_AMB, '三段分子 BX、CY、AZ'], [C_BLU, '三段分母 XC、YA、ZB'], [C_ORG, '塞瓦点 P']],
    menelaus: [[C_WHT, '横截线'], [C_AMB, '三段分子'], [C_BLU, '三段分母'], [C_ORG, '积为 −1']],
    nagel: [[C_WHT, 'Nagel 线'], [C_ORG, 'I、G、Sp、Na'], [C_GRN, '内切圆'], [C_AMB, '到旁切点的连线 → Na'], [C_BLU, '中线 → G']],
    soddy: [[C_GRY, '以顶点为圆心的三个圆'], [C_BLU, '顶点到切点的连线 → Ge'], [C_PUR, '内 Soddy 圆'], [C_RED, '外 Soddy 圆'], [C_GRN, 'de Longchamps 点 L'], [C_ORG, 'Soddy 线']],
    mandart: [[C_WHT, 'Mandart 圆'], [C_ORG, '费尔巴哈点 F'], [C_AMB, '旁切点 Ua、Ub、Uc 与旁切点三角形'], [C_GRN, '内切圆、三个旁切圆'], [C_PUR, '九点圆']],
    sevenpoint: [[C_PUR, '七点球'], [C_GRY, '外接球'], [C_ORG, '七个点'], [C_AMB, 'V0、G、A、C 共线'], [C_BLU, '欧拉线上的 O、G、E、4G−3O'], [C_GRN, 'O、O′、B、4O′−3O 共线']],
    thirteen: [[C_PUR, '十三点球 Σ'], [C_GRY, '外接球'], [C_GRN, '对面、它的九点圆和三条高'], [C_ORG, '十三个点'], [C_AMB, '直线 HG′ → P'], [C_BLU, 'HX → Q1'], [C_RED, '高线 V0H → Y → Q2']],
    eulerplane: [[C_GRN, '欧拉线 H、G、O'], [C_BLU, '欧拉线上的点 P'], [C_ORG, '等角共轭 P*、等截共轭 Pᵗ'], [C_AMB, '过欧拉线和 P*、Pᵗ 的平面'], [C_GRY, '外接球']],
    poncelet: [[C_PUR, '过 A、B、C、P 的等轴双曲线'], [C_ORG, '两条渐近线、中心 Po'], [C_BLU, 'ABC 的九点圆'], [C_GRN, 'PBC、PCA、PAB 的九点圆']],
    conic: [[C_WHT, '九点二次曲线'], [C_BLU, '6 条连线的中点'], [C_AMB, '3 个对角点、渐近线'], [C_ORG, '第四点 P'], ['rgba(29,158,117,.45)', '背景绿：P 在此处时是椭圆'], ['rgba(216,90,48,.4)', '背景橙：P 在此处时是双曲线']],
  };

  const state = {
    tab: TABS[0][0],
    V: [{ x: -2.0, y: 1.2 }, { x: 2.2, y: 1.2 }, { x: -1.0, y: -1.5 }],
    show: { pb: true, md: true, al: true },
    k: 1, center: 'H', theta: -0.6, tri: 0, P: null, onCircle: false,
    rot: { yaw: -0.6, pitch: -1.15 }, rot13: { yaw: -2.09, pitch: -0.7 }, rotE: { yaw: -1.67, pitch: -0.19 }, tet: null, tet13: null, tetE: null, tE: 1, v0: 0, showCircum: true,
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
    // 拿破仑那张的三个外接正三角形伸得比外接圆还远，不单独算进来会被切掉
    if (state.tab === 'power') {
      // 圆是舞台，<b>整个圆要进画框</b> —— 只放 A、B、C 的话三点在圆上，
      // 包围盒装不下圆本身，圆会被裁掉（第一版就是这样）
      const P = state.Ppow || defPpow(g);
      return [{ x: g.O.x - g.R, y: g.O.y - g.R }, { x: g.O.x + g.R, y: g.O.y + g.R }, P]; }
    if (state.tab === 'radical') { const C3 = [g.A, g.B, g.C], out = [];
      C3.forEach((c, i) => { out.push({ x: c.x - RAD_R[i], y: c.y - RAD_R[i] }, { x: c.x + RAD_R[i], y: c.y + RAD_R[i] }); });
      const a = radAxisOf(C3[0], RAD_R[0], C3[1], RAD_R[1]), b = radAxisOf(C3[1], RAD_R[1], C3[2], RAD_R[2]);
      const R = a && b ? axMeet(a, b) : null; if (R) out.push(R);
      return out; }                              // 根轴本身不进画框：直线该跑出画面
    if (state.tab === 'monge') { const C3 = [g.A, g.B, g.C], out = [];
      C3.forEach((c, i) => { out.push({ x: c.x - MON_R[i], y: c.y - MON_R[i] }, { x: c.x + MON_R[i], y: c.y + MON_R[i] }); });
      [[0, 1], [1, 2], [0, 2]].forEach(([i, j]) => { const e = extCen(C3[i], MON_R[i], C3[j], MON_R[j]); if (e) out.push(e); });
      return out; }
    if (state.tab === 'miquel') { const c = miquelCfg(g);
      if (!c) return [g.A, g.B, g.C];
      const out = [g.A, g.B, g.C, c.X, c.Y, c.Z, c.M];
      c.cir.forEach((z) => out.push({ x: z.o.x - z.r, y: z.o.y - z.r }, { x: z.o.x + z.r, y: z.o.y + z.r }));
      return out; }
    if (state.tab === 'brianchon') return [g.A, g.B, g.C].concat(brianchonCfg(g).V.filter(Boolean));
    if (state.tab === 'pappus') { const c = pappusCfg(g);
      return [g.A, g.B, g.C].concat(c.A3, c.B3, c.X.filter(Boolean)); }
    if (state.tab === 'desargues') { const c = desarguesCfg(g);
      return [g.A, g.B, g.C, c.O].concat(c.V2, c.X.filter(Boolean)); }
    if (state.tab === 'napoleon') {
      return [g.A, g.B, g.C].concat(napTri(g.A, g.B, g.C).map((t) => t.apex));
    }
    return [g.A, g.B, g.C, g.H, { x: g.O.x - g.R, y: g.O.y - g.R }, { x: g.O.x + g.R, y: g.O.y + g.R }];
  }
  /** 三边向外各作一个正三角形：顶点在中点沿「背离第三个顶点」的法向、距离 |UW|·√3/2 处 */
  function napTri(A, B, C) {
    const one = (U, W, V) => {
      const m = mid(U, W), d = sub(W, U), L = Math.max(len(d), 1e-9);
      let n = { x: -d.y / L, y: d.x / L };
      if ((V.x - m.x) * n.x + (V.y - m.y) * n.y > 0) n = { x: -n.x, y: -n.y };
      const apex = { x: m.x + n.x * L * Math.sqrt(3) / 2, y: m.y + n.y * L * Math.sqrt(3) / 2 };
      return { U, W, apex, cen: { x: (U.x + W.x + apex.x) / 3, y: (U.y + W.y + apex.y) / 3 } };
    };
    return [one(B, C, A), one(C, A, B), one(A, B, C)];
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
  function lab(P, txt, dx, dy, colr) {
    const q = S(P); if (!(q.x >= 0 && q.x <= W && q.y >= 0 && q.y <= H)) return;   // 点在画面外（比如放大后）就不标
    const r = labPos(P, txt, dx, dy);
    placed.push({ x: r.x, y: r.y - r.h, w: r.w, h: r.h });
    ctx.fillStyle = colr || css('--ink'); ctx.fillText(txt, r.x, r.y);
  }
  /* 标签防重叠：本次绘制已占用的文字框（屏幕坐标）。每个标签依次试点周围的候选位置，
   * 选第一个不出画布、不压到已有文字和这组点的；都不行就用第一个候选。 */
  let placed = [];
  const GAP = 4;   // 文字框之间至少留的间隔
  const overlap = (r, q) => r.x < q.x + q.w + GAP && q.x < r.x + r.w + GAP && r.y < q.y + q.h + GAP && q.y < r.y + r.h + GAP;
  /** 半透明填一块多边形：用来标「这是哪个三角形」，不占线条 */
  function fillPoly(pts, hex, alpha) {
    const n = parseInt(hex.slice(1), 16);
    ctx.save(); ctx.beginPath();
    pts.forEach((p, i) => { const z = S(p); i ? ctx.lineTo(z.x, z.y) : ctx.moveTo(z.x, z.y); });
    ctx.closePath();
    ctx.fillStyle = 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
    ctx.fill(); ctx.restore();
  }
  /** 一道刻度：一样多 = 一样长 */
  function tick(P, Q, c) {
    const d = sub(Q, P), L = Math.max(len(d), 1e-9);
    const u2 = { x: d.x / L, y: d.y / L }, nv = { x: -u2.y, y: u2.x };
    const m = mid(P, Q), h = 0.055;
    seg({ x: m.x - nv.x * h, y: m.y - nv.y * h }, { x: m.x + nv.x * h, y: m.y + nv.y * h }, c, 2.2);
  }
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
  /** 空心圈：套在已经画好的点外面，用来点名「这个点现在是主角」 */
  function ring(P, r, c, w) {
    const p = S(P);
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
    ctx.strokeStyle = col(c); ctx.lineWidth = w; ctx.setLineDash([]); ctx.stroke();
  }
  /** 刻度：线段中部打 n 道短垂线。相等的两段打一样多，眼睛自己去配对。 */
  function ticks(P1, Q1, n, col) {
    const d = sub(Q1, P1), L = Math.max(len(d), 1e-9);
    const u = { x: d.x / L, y: d.y / L }, nv = { x: -u.y, y: u.x };
    const m = mid(P1, Q1), gap = L * 0.055, half = Math.max(L * 0.05, 0.035);
    for (let k = 0; k < n; k++) {
      const o = (k - (n - 1) / 2) * gap;
      const c0 = { x: m.x + u.x * o, y: m.y + u.y * o };
      seg({ x: c0.x - nv.x * half, y: c0.y - nv.y * half },
          { x: c0.x + nv.x * half, y: c0.y + nv.y * half }, col, 1.8);
    }
  }
  function tri(X, Y, Z, col, w) { seg(X, Y, col, w); seg(Y, Z, col, w); seg(Z, X, col, w); }
  function sides(g, c) { lineInf(g.A, g.B, c, 0.5, [2, 4]); lineInf(g.B, g.C, c, 0.5, [2, 4]); lineInf(g.C, g.A, c, 0.5, [2, 4]); }
  const fmt = (x, n = 2) => x.toFixed(n);
  /** 图下说明：上面一段只写定理，下面一段写操作方法、图上标记和实测 */
  const info = (thm, ops) => '<p class="thm">' + thm + '</p>' + (ops ? '<p class="ops">' + ops + '</p>' : '');

  /* ---------- 各标签页 ---------- */
  /* ---------- 射影四条的构型。放在外面，fitPoints 和 DRAW 都要用 ----------
     舞台一律借用现成的东西：Pascal / Brianchon 用三角形的外接圆当圆锥曲线，
     Pappus 用 AB、AC 两条边当两条直线，Desargues 用 ABC 加一个可拖的透视中心。
     这样拖 A、B、C 就能改变整个构型，不用另造一套交互。 */
  const PJ_TRIO = [C_AMB, C_BLU, C_GRN];           // 三组对应元素：琥珀 / 蓝 / 绿
  // 六个角度是搜出来的，三条硬条件：(1) 间隔别太小 —— 间隔一小那两条切线就快平行，
  // Brianchon 的顶点甩得老远；(2) <b>Pascal 线不能和任何一条边近乎平行</b> —— 否则白色的
  // 结论线整条压在一条彩色的边上，看着像边断了；现在最小夹角 41°；(3) 可拖的那个点不能
  // 贴着某个交点，圈和橙点叠在一起分不清。交点全在 0.51R 以内。
  const PJ_BASE = [-0.083, 0.852, 2.341, 3.219, 4.011, 5.36];
  const PJ_ORD = [0, 4, 1, 3, 5, 2];               // 交叉六边形：扫过所有连法挑出来的，
                                                   // 三个交点全落在 0.75R 以内（凸六边形会甩到十万八千里）
  const xl2 = (P1, P2, P3, P4) => {
    const d1 = sub(P2, P1), d2 = sub(P4, P3), den = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(den) < 1e-11) return null;
    const w = sub(P3, P1), k = (w.x * d2.y - w.y * d2.x) / den;
    return { x: P1.x + d1.x * k, y: P1.y + d1.y * k };
  };
  /** 六个点在圆锥曲线上的位置。<b>六个都能拖</b> —— 它们才是这两条定理的点，
      之前只有第一个能动、其余五个和 A/B/C 一样杵着不动，拖半天图上没有对应关系。 */
  const pjAngles = () => {
    if (!state.hex) state.hex = PJ_BASE.slice();
    return state.hex;
  };
  /** 命中哪个点（返回角度数组的下标），没命中返回 -1 */
  function pjHit(g, p) {
    const a = pjAngles(); let hit = -1;
    a.forEach((th, i) => {
      const q = S({ x: g.O.x + g.R * Math.cos(th), y: g.O.y + g.R * Math.sin(th) });
      if (Math.hypot(q.x - p.x, q.y - p.y) < HIT()) hit = i;
    });
    return hit;
  }
  /** Pappus 的六个点：各自在自己那条直线上的参数，六个都能拖 */
  const papParams = () => {
    if (!state.pap) state.pap = { a: [0.42, 0.78, 1.18], b: [0.45, 0.82, 1.22] };
    return state.pap;
  };
  function papHit(g, p) {
    const c = pappusCfg(g); let hit = null;
    c.A3.forEach((q, i) => { const t = S(q); if (Math.hypot(t.x - p.x, t.y - p.y) < HIT()) hit = ['a', i]; });
    c.B3.forEach((q, i) => { const t = S(q); if (Math.hypot(t.x - p.x, t.y - p.y) < HIT()) hit = ['b', i]; });
    return hit;
  }
  function pascalCfg(g) {
    const on = (th) => ({ x: g.O.x + g.R * Math.cos(th), y: g.O.y + g.R * Math.sin(th) });
    const A6 = pjAngles(), P = PJ_ORD.map((k) => on(A6[k]));
    const side = [0, 1, 2, 3, 4, 5].map((k) => [P[k], P[(k + 1) % 6]]);
    const pair = [[0, 3], [1, 4], [2, 5]];
    const X = pair.map(([m, n]) => xl2(side[m][0], side[m][1], side[n][0], side[n][1]));
    return { P, side, pair, X, on };
  }
  function brianchonCfg(g) {
    const A6 = pjAngles();
    // 圆上参数 φ、ψ 两条切线的交点：沿角平分方向，距圆心 R / cos((φ−ψ)/2)
    const tx = (f, h) => {
      const c = Math.cos((f - h) / 2);
      if (Math.abs(c) < 1e-6) return null;
      return { x: g.O.x + g.R * Math.cos((f + h) / 2) / c, y: g.O.y + g.R * Math.sin((f + h) / 2) / c };
    };
    const V = [0, 1, 2, 3, 4, 5].map((k) => tx(A6[k], A6[(k + 1) % 6]));
    if (!V.every(Boolean)) return { V: [], diag: [], B: null, T6: [] };
    const diag = [[V[0], V[3]], [V[1], V[4]], [V[2], V[5]]];
    return { V, diag, B: xl2(V[0], V[3], V[1], V[4]),
             T6: A6.map((th) => ({ x: g.O.x + g.R * Math.cos(th), y: g.O.y + g.R * Math.sin(th) })) };
  }
  function pappusCfg(g) {
    const at = (U, W, k) => ({ x: U.x + (W.x - U.x) * k, y: U.y + (W.y - U.y) * k });
    const pp = papParams();
    const A3 = pp.a.map((k) => at(g.A, g.B, k));
    const B3 = pp.b.map((k) => at(g.A, g.C, k));
    const X = [xl2(A3[1], B3[2], A3[2], B3[1]),
               xl2(A3[0], B3[2], A3[2], B3[0]),
               xl2(A3[0], B3[1], A3[1], B3[0])];
    const pair = [[[A3[1], B3[2]], [A3[2], B3[1]]],
                  [[A3[0], B3[2]], [A3[2], B3[0]]],
                  [[A3[0], B3[1]], [A3[1], B3[0]]]];
    return { A3, B3, X, pair };
  }
  function desarguesCfg(g) {
    // 透视中心默认放在三角形<b>内部</b>（重心坐标），这样第二个三角形是嵌在第一个
    // 里面的。O 在外面时两个三角形互相穿插，根本看不出是「两个三角形」。
    // 单独存一份，不跟 Ceva / Fermat 共用 state.P —— 从那边切过来会继承一个乱七八糟的位置。
    // U 和 KK 是按大图自己的标准三角形搜出来的。硬条件：小三角形最小角 ≥ 22°（否则扁成
    // 一条）、三个交点互相分得开、<b>透视轴不能和六条边里任何一条近乎平行</b>（贴上了白轴
    // 就压在彩色的边上）。打分<b>不是</b>「交点别太远」—— 那样搜出来是一条巨大的轴配两个
    // 挤在角落的小三角形；打分要用<b>自动取景之后大三角形还剩多大</b>。现在轴与各边最小
    // 夹角 24°，小/大面积比 0.28，取景后大三角形占画面 24%。
    const U = [0.27, 0.378, 0.351];
    const O = state.Pdes || { x: U[0] * g.A.x + U[1] * g.B.x + U[2] * g.C.x,
                              y: U[0] * g.A.y + U[1] * g.B.y + U[2] * g.C.y };
    const KK = [0.531, 0.283, 0.814];              // 三个比例必须互不相同，相等则对应边平行、交点在无穷远
    const V = [g.A, g.B, g.C];
    const V2 = V.map((q, i) => ({ x: O.x + (q.x - O.x) * KK[i], y: O.y + (q.y - O.y) * KK[i] }));
    const pair = [[0, 1], [1, 2], [2, 0]];
    const X = pair.map(([m, n]) => xl2(V[m], V[n], V2[m], V2[n]));
    return { O, V, V2, pair, X };
  }
  /** 结论线要带一层底色描边。默认构型我卡掉了「结论线和某条边近乎平行」，可<b>用户一拖，
      迟早会拖到擦在一起的位置</b> —— 白线压在彩色的边上，两条糊成一条。先用画布底色
      描一道粗的，再画白线，这样不管压在什么上面都看得出是两条。 */
  function segHalo(P, R, c, w) {
    seg(P, R, css('--panel'), w + 3.4);
    seg(P, R, c, w);
  }
  /** 结论线：取最远的一对交点当端点再往两头延。直接拿第一个和第三个的话，
      中间那个可能落在线段外面，线就盖不住它。 */
  function thruLine(X, ext) {
    let bi = [0, 1], bd = -1;
    [[0, 1], [1, 2], [0, 2]].forEach((ij) => {
      const d = len(sub(X[ij[0]], X[ij[1]])); if (d > bd) { bd = d; bi = ij; }
    });
    const p1 = X[bi[0]], p2 = X[bi[1]], d = sub(p2, p1);
    return [{ x: p1.x - d.x * ext, y: p1.y - d.y * ext }, { x: p2.x + d.x * ext, y: p2.y + d.y * ext }];
  }
  /** 只画伸出线段之外的那一截：交点落在边内部时，连过去会压在白边上，看着像断线 */
  function extSeg(P1, P2, q, c, w) {
    const d = sub(P2, P1), L2 = d.x * d.x + d.y * d.y;
    const sp = ((q.x - P1.x) * d.x + (q.y - P1.y) * d.y) / L2;
    if (sp >= 0 && sp <= 1) return;
    seg(sp < 0 ? P1 : P2, q, c, w, [5, 4]);
  }

  /* ---------- 圆这一族的四条 ----------
     舞台同样借用现成的东西：圆幂用三角形的外接圆，根轴和 Monge 把三个圆的圆心
     放在 A、B、C 上，Miquel 用三角形的三条边加一条横截线。拖 A、B、C 就能改变全局。
     Monge 的半径是算出来的：外位似中心 = (r₂c₁ − r₁c₂)/(r₂ − r₁)，放大倍数是
     r₂/(r₂ − r₁)，<b>半径一接近中心就飞出画面</b>。按标准三角形扫了一遍半径三元组，
     [0.25, 0.55, 1.30] 是折中点：最小的圆还占画宽 4.7%（看得见），三角形横跨 40%。 */
  const KTRIO = [C_AMB, C_BLU, C_GRN];
  const RAD_R = [0.55, 0.70, 0.50];            // 根轴那张：三个圆的半径
  const MON_R = [0.25, 0.55, 1.30];            // Monge 那张：必须拉开，理由见上
  /** 两圆的根轴：到两圆等幂的点，垂直于连心线 */
  function radAxisOf(c1, r1, c2, r2) {
    const d = sub(c2, c1), L = len(d);
    if (L < 1e-9) return null;
    const ux = { x: d.x / L, y: d.y / L };
    const k = (L * L + r1 * r1 - r2 * r2) / (2 * L);
    return { foot: { x: c1.x + ux.x * k, y: c1.y + ux.y * k }, dir: { x: -ux.y, y: ux.x } };
  }
  function axMeet(a, b) {
    const den = a.dir.x * b.dir.y - a.dir.y * b.dir.x;
    if (Math.abs(den) < 1e-9) return null;
    const w = sub(b.foot, a.foot), t = (w.x * b.dir.y - w.y * b.dir.x) / den;
    return { x: a.foot.x + a.dir.x * t, y: a.foot.y + a.dir.y * t };
  }
  /** 从 P 到圆 (c,r) 的切点，sgn 选左右 */
  function tanPt(P, c, r, sgn) {
    const d = sub(c, P), L = len(d);
    if (L <= r + 1e-9) return null;
    const tl = Math.sqrt(L * L - r * r), b = Math.asin(r / L) * sgn, ux = { x: d.x / L, y: d.y / L };
    return { x: P.x + (ux.x * Math.cos(b) - ux.y * Math.sin(b)) * tl,
             y: P.y + (ux.x * Math.sin(b) + ux.y * Math.cos(b)) * tl };
  }
  const extCen = (c1, r1, c2, r2) => (Math.abs(r2 - r1) < 1e-9 ? null
    : { x: (r2 * c1.x - r1 * c2.x) / (r2 - r1), y: (r2 * c1.y - r1 * c2.y) / (r2 - r1) });
  /** 直线与圆的两个交点，按到 P 的距离排序 */
  function lineCircle(P, dir, O, R) {
    const f = sub(P, O), a = dir.x * dir.x + dir.y * dir.y;
    const b = 2 * (f.x * dir.x + f.y * dir.y), c = f.x * f.x + f.y * f.y - R * R;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return null;
    const sq = Math.sqrt(disc), t1 = (-b - sq) / (2 * a), t2 = (-b + sq) / (2 * a);
    const P1 = { x: P.x + dir.x * t1, y: P.y + dir.y * t1 };
    const P2 = { x: P.x + dir.x * t2, y: P.y + dir.y * t2 };
    return Math.abs(t1) <= Math.abs(t2) ? [P1, P2, t1, t2] : [P2, P1, t2, t1];
  }
  const miqParams = () => { if (!state.miq) state.miq = { x: 0.62, y: 1.25 }; return state.miq; };
  /** Miquel：三角形三边 + 一条横截线 → 六个点、四个三角形、四个外接圆 */
  function miquelCfg(g) {
    const m = miqParams();
    const at = (U, V2, t) => ({ x: U.x + (V2.x - U.x) * t, y: U.y + (V2.y - U.y) * t });
    const X = at(g.A, g.B, m.x), Y = at(g.A, g.C, m.y);
    const Z = xl2(X, Y, g.B, g.C);
    if (!Z) return null;
    const tri = [[g.A, X, Y], [g.B, X, Z], [g.C, Y, Z], [g.A, g.B, g.C]];
    const cir = tri.map((t) => circum3(t[0], t[1], t[2]));
    if (!cir.every(Boolean)) return null;
    // Miquel 点：前两个圆的第二个交点（不是六个顶点里的那个）
    const [c1, c2] = cir, d = sub(c2.o, c1.o), L = len(d);
    if (L < 1e-9) return null;
    const a = (L * L + c1.r * c1.r - c2.r * c2.r) / (2 * L), h2 = c1.r * c1.r - a * a;
    if (h2 < 0) return null;
    const h = Math.sqrt(h2), ux = { x: d.x / L, y: d.y / L };
    const base = { x: c1.o.x + ux.x * a, y: c1.o.y + ux.y * a };
    const cand = [{ x: base.x - ux.y * h, y: base.y + ux.x * h },
                  { x: base.x + ux.y * h, y: base.y - ux.x * h }];
    const vs = [g.A, g.B, g.C, X, Y, Z];
    const M = cand.reduce((best, z) => {
      const dm = Math.min(...vs.map((v) => len(sub(z, v))));
      return (!best || dm > best.d) ? { p: z, d: dm } : best;
    }, null).p;
    return { X, Y, Z, tri, cir, M };
  }
  function circum3(A, B, C) {
    const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
    if (Math.abs(d) < 1e-9) return null;
    const a2 = A.x * A.x + A.y * A.y, b2 = B.x * B.x + B.y * B.y, c2 = C.x * C.x + C.y * C.y;
    const o = { x: (a2 * (B.y - C.y) + b2 * (C.y - A.y) + c2 * (A.y - B.y)) / d,
                y: (a2 * (C.x - B.x) + b2 * (A.x - C.x) + c2 * (B.x - A.x)) / d };
    return { o, r: len(sub(o, A)) };
  }
  const defPpow = (g) => ({ x: g.O.x - g.R * 1.55, y: g.O.y - g.R * 0.28 });
  const fx = (v) => (Math.round(v * 1000) / 1000).toFixed(3);

  const DRAW = {
    /* ── 共点与共线 ───────────────────────────────────────── */
    pascal(g) {
      const c = pascalCfg(g);
      if (!c.X.every(Boolean)) return info('Pascal 定理', '这个位置上有两条对边平行，交点跑到无穷远。把点拖开一点。');
      circle(g.O, g.R, css('--muted'), 1.4);
      // 六条边按三组对边上色（第 k 条和第 k+3 条同色，k % 3 刚好配对）。
      // 之前六条全白、只给延长线上色 —— 可交点几乎总落在边的内部，extSeg 就跳过，
      // 结果一条彩线都不画，图例列着三种颜色，图上一种都没有。颜色要给边本身。
      c.side.forEach(([p, q], k) => seg(p, q, PJ_TRIO[k % 3], 1.8));
      c.pair.forEach(([m, n], i) => {
        [m, n].forEach((k) => extSeg(c.side[k][0], c.side[k][1], c.X[i], PJ_TRIO[i], 1.2));
      });
      const e = thruLine(c.X, 0.22);
      segHalo(e[0], e[1], col(C_WHT), 3.0);
      c.X.forEach((q) => dot(q, C_ORG, 6));
      c.P.forEach((q, i) => { dot(q, col(C_WHT), 5); lab(q, 'ABCDEF'[i], -15, -9); });
      return info('Pascal 定理：圆锥曲线的内接六边形，三组对边的交点共线 —— 这条线叫 Pascal 线。',
        '<b>A 到 F 六个点都能拖</b>，拖着它们沿圆走，三个交点始终在一条直线上。' +
        '圆就是这里的圆锥曲线；六边形是交叉的（凸六边形的对边几乎平行，三个交点会跑到画面外）。' +
        '<b>同色的两条边是一组对边</b>，虚线是它们的延长线，橙点是交点，白粗线是 Pascal 线。');
    },
    brianchon(g) {
      const c = brianchonCfg(g);
      if (!c.V.length || !c.B) return info('Brianchon 定理', '这个位置上有两条切线平行，顶点跑到无穷远。把点拖开一点。');
      circle(g.O, g.R, css('--muted'), 1.4);
      [0, 1, 2, 3, 4, 5].forEach((k) => seg(c.V[k], c.V[(k + 1) % 6], col(C_WHT), 1.5));
      c.diag.forEach(([p, q], i) => seg(p, q, PJ_TRIO[i], 1.8));
      c.T6.forEach((q, i) => { dot(q, col(C_WHT), 5); lab(q, 'ABCDEF'[i], -15, -9); });
      c.V.forEach((q) => dot(q, css('--muted'), 4));
      dot(c.B, C_ORG, 7);
      return info('Brianchon 定理：圆锥曲线的外切六边形，三条对角线共点 —— 这是 Pascal 定理的对偶（点 ↔ 线，共线 ↔ 共点）。',
        '<b>A 到 F 是六个切点，都能拖</b>，拖着它们沿圆走，三条对角线始终交于一点。' +
        '白色六边形的每条边都是过对应切点的切线，灰点是六边形的顶点；琥珀、蓝、绿是三条对角线，橙点是它们的交点。');
    },
    pappus(g) {
      const c = pappusCfg(g);
      if (!c.X.every(Boolean)) return info('Pappus 定理', '这个位置上有两条连线平行，交点跑到无穷远。把顶点拖开一点。');
      const sec = css('--muted');
      lineInf(g.A, g.B, sec, 1.3); lineInf(g.A, g.C, sec, 1.3);
      c.pair.forEach((two, i) => two.forEach(([p, q]) => seg(p, q, PJ_TRIO[i], 1.5)));
      const e = thruLine(c.X, 0.30);
      segHalo(e[0], e[1], col(C_WHT), 3.2);
      c.X.forEach((q) => dot(q, C_ORG, 6));
      c.A3.forEach((q, i) => { dot(q, col(C_WHT), 5); lab(q, 'ABC'[i], -15, -9); });
      c.B3.forEach((q, i) => { dot(q, col(C_WHT), 5); lab(q, "ABC"[i] + '′', -15, -9); });
      return info('Pappus 定理：两条直线上各取三点，三组交叉连线的交点共线。' +
        '它是 Pascal 定理的特例 —— 圆锥曲线退化成两条直线时就是它。',
        '<b>A B C 和 A′ B′ C′ 六个点都能拖</b>，各自沿自己那条直线滑动；灰色小圈是两条直线的控制点，拖它们可以改变两条线的夹角。' +
        '琥珀、蓝、绿是三组交叉连线，橙点是它们的交点，白粗线是 Pappus 线。');
    },
    desargues(g) {
      const c = desarguesCfg(g);
      if (!state.P) state.P = c.O;
      if (!c.X.every(Boolean)) return info('Desargues 定理', '这个位置上有两条对应边平行，交点跑到无穷远。把透视中心拖开一点。');
      const sec = css('--muted');
      c.V.forEach((q) => seg(c.O, q, sec, 1.1, [6, 5]));
      // 三组对应边直接上色（大三角形粗、小三角形细）。两个三角形原来都是白实线、
      // 同样粗细，叠在一起根本分不出谁是谁，白色还跟结论线（透视轴）撞了。
      c.pair.forEach(([m, n], i) => {
        seg(c.V[m], c.V[n], PJ_TRIO[i], 2.0);
        seg(c.V2[m], c.V2[n], PJ_TRIO[i], 1.4);
        extSeg(c.V[m], c.V[n], c.X[i], PJ_TRIO[i], 1.1);
        extSeg(c.V2[m], c.V2[n], c.X[i], PJ_TRIO[i], 1.1);
      });
      const e = thruLine(c.X, 0.16);
      segHalo(e[0], e[1], col(C_WHT), 3.2);
      c.X.forEach((q) => dot(q, C_ORG, 6));
      ring(c.O, 8, C_ORG, 2.2); lab(c.O, 'O', 11, -11);   // 中心是空心圈，交点是实心点
      c.V2.forEach((q, i) => { dot(q, col(C_WHT), 4.5); lab(q, 'ABC'[i] + '′', 13, -8); });
      return info('Desargues 定理：两个三角形透视于一点 O，当且仅当它们透视于一条线 —— 三组对应边的交点共线，这条线叫透视轴。',
        '在画面上拖动（顶点以外的地方）移动透视中心 O，也可以拖动 A、B、C。' +
        '灰虚线是 O 到三个顶点的射线，第二个三角形（细线）就长在上面；<b>同色的两条边是一组对应边</b>，' +
        '橙<b>圈</b>是透视中心 O，橙<b>点</b>是三个交点，白粗线是透视轴。O 拖到三角形外面时两个三角形会互相穿插，拖回内部就恢复嵌套。' +
        '<br>这是四条射影定理里唯一把<b>点和线的对偶同时放在一张图上</b>的：一个中心 O，一条轴。');
    },
    power(g) {
      if (!state.Ppow) state.Ppow = defPpow(g);
      // 默认让割线<b>横穿</b>圆：Q 取在圆的右侧，弦才够长。
      // 取 2.25（左上）的话割线擦着圆边过去，A 和 B 几乎重合，什么也看不出来
      if (state.thPow === undefined) state.thPow = 0.42;
      const P = state.Ppow;
      const Q = { x: g.O.x + g.R * Math.cos(state.thPow), y: g.O.y + g.R * Math.sin(state.thPow) };
      circle(g.O, g.R, css('--muted'), 1.5);
      dot(g.O, css('--muted'), 3.5);
      const hit = lineCircle(P, sub(Q, P), g.O, g.R);
      if (!hit) return info('圆幂', '这条割线和圆不相交了，把点拖回去。');
      const [A, B, ta, tb] = hit;
      const dir = sub(Q, P), L = len(dir);
      const u2 = { x: dir.x / L, y: dir.y / L };
      lineInf(P, Q, css('--muted'), 1.1, [7, 6]);
      seg(P, B, C_BLU, 3.2); seg(P, A, C_AMB, 3.2);
      dot(A, C_AMB, 5.5); dot(B, C_BLU, 5.5);
      lab(A, 'A', -15, -9); lab(B, 'B', 13, -9);
      const pa = Math.abs(ta) * L, pb = Math.abs(tb) * L;
      const d0 = len(sub(P, g.O)), pw = d0 * d0 - g.R * g.R;
      const inside = pw < 0;
      let tl = null;
      if (!inside) {
        const Tp = tanPt(P, g.O, g.R, +1);
        if (Tp) { seg(P, Tp, C_ORG, 2.6, [6, 5]); dot(Tp, C_ORG, 5); lab(Tp, 'T', 13, -9); tl = len(sub(P, Tp)); }
      }
      dot(P, C_ORG, 6.5); lab(P, 'P', -15, 2);
      ring(Q, 9, C_ORG, 1.8);
      return info('圆幂：过 P 的任一条直线交圆于 A、B，<b>PA · PB 是定值</b>（P 在圆外时它等于切线长的平方）。',
        '拖动 P，也可以拖动圆上套圈的那个点让割线绕 P 转动；拖 A、B、C 改变这个圆。' +
        '<br><b>PA · PB = ' + fx(pa * pb) + '</b>' +
        (tl === null ? '；P 在圆内，幂是负的，A、B 落在 P 的两侧。'
                     : '　　PT² = ' + fx(tl * tl) + '　（割线怎么转，这两个数都不动）'));
    },
    radical(g) {
      const C3 = [g.A, g.B, g.C];
      C3.forEach((c, i) => { circle(c, RAD_R[i], KTRIO[i], 1.8); dot(c, KTRIO[i], 3.5); });
      const ax = [[0, 1], [1, 2], [2, 0]].map(([i, j]) => radAxisOf(C3[i], RAD_R[i], C3[j], RAD_R[j]));
      if (!ax.every(Boolean)) return info('根轴与根心', '有两个圆心重合了，把顶点拖开。');
      const R = axMeet(ax[0], ax[1]);
      ax.forEach((a, i) => {
        const e = 9;                           // 直线跑出画面，别算进画框
        seg({ x: a.foot.x + a.dir.x * e, y: a.foot.y + a.dir.y * e },
            { x: a.foot.x - a.dir.x * e, y: a.foot.y - a.dir.y * e }, col(C_WHT), i === 2 ? 2.2 : 2.6);
      });
      if (!R) return info('根轴与根心', '三条根轴平行了（三个圆心共线），没有根心。');
      const pw = C3.map((c, i) => len(sub(R, c)) ** 2 - RAD_R[i] * RAD_R[i]);
      dot(R, C_ORG, 7.5);
      if (Math.min(...pw) > 1e-4) {
        C3.forEach((c, i) => {
          const Tp = tanPt(R, c, RAD_R[i], i === 1 ? -1 : +1);
          if (Tp) { seg(R, Tp, KTRIO[i], 2.4); dot(Tp, KTRIO[i], 4); tick(R, Tp, KTRIO[i]); }
        });
      }
      return info('根轴与根心：对两个圆等幂的点组成一条直线（根轴）；三个圆的三条根轴<b>共点</b>，这点叫根心。',
        '拖动 A、B、C 移动三个圆。两圆相交时根轴就是公共弦所在的直线 —— 把圆拖到相交看看。' +
        '<br>橙点到三个圆的切线长相等（各打一道刻度）：<b>' +
        (Math.min(...pw) > 1e-4 ? fx(Math.sqrt(pw[0])) : '根心落在某个圆内，切线长是虚的') + '</b>');
    },
    monge(g) {
      const C3 = [g.A, g.B, g.C];
      C3.forEach((c, i) => { circle(c, MON_R[i], KTRIO[i], 1.8); dot(c, KTRIO[i], 3.5); });
      const E = [[0, 1], [1, 2], [0, 2]].map(([i, j]) => extCen(C3[i], MON_R[i], C3[j], MON_R[j]));
      if (!E.every(Boolean)) return info('Monge 定理', '有两个圆半径相等，它们的外位似中心在无穷远。');
      [[0, 1], [1, 2], [0, 2]].forEach(([i, j], k) => {
        [+1, -1].forEach((sg) => {
          const t1 = tanPt(E[k], C3[i], MON_R[i], sg), t2 = tanPt(E[k], C3[j], MON_R[j], sg);
          if (t1 && t2) seg(E[k], len(sub(E[k], t1)) > len(sub(E[k], t2)) ? t1 : t2, KTRIO[k], 1.4, [6, 5]);
          if (t1) dot(t1, KTRIO[k], 3.2);
          if (t2) dot(t2, KTRIO[k], 3.2);
        });
      });
      let bi = [0, 1], bd = -1;
      [[0, 1], [1, 2], [0, 2]].forEach(([a, b]) => { const d = len(sub(E[a], E[b])); if (d > bd) { bd = d; bi = [a, b]; } });
      const d = sub(E[bi[1]], E[bi[0]]);
      seg({ x: E[bi[0]].x - d.x * 0.2, y: E[bi[0]].y - d.y * 0.2 },
          { x: E[bi[1]].x + d.x * 0.2, y: E[bi[1]].y + d.y * 0.2 }, col(C_WHT), 3.0);
      E.forEach((e, i) => dot(e, KTRIO[i], 6.5));
      return info('Monge 定理：三个圆两两的<b>外位似中心</b>（两条外公切线的交点）共线。',
        '拖动 A、B、C 移动三个圆，三个中心跟着跑，白线始终穿过它们。' +
        '三个半径是写死的（0.25 / 0.55 / 1.30）：外位似中心 = (r₂c₁ − r₁c₂)/(r₂ − r₁)，' +
        '<b>两个半径一接近，分母趋于零，中心就飞出画面</b>，所以必须拉开。');
    },
    miquel(g) {
      const c = miquelCfg(g);
      if (!c) return info('Miquel 定理', '这个位置上横截线和某条边平行了，把点拖开一点。');
      const sec = css('--muted');
      lineInf(g.A, g.B, sec, 1.2); lineInf(g.B, g.C, sec, 1.2); lineInf(g.A, g.C, sec, 1.2);
      lineInf(c.X, c.Y, sec, 1.2);
      const QUAD = [C_AMB, C_BLU, C_GRN, C_PUR];   // 四个三角形要四种颜色，紫借用欧拉点那支
      // 四个三角形<b>只填色，不描边</b>。完全四边形里相邻两个三角形共用一条线上的一段，
      // 四个都描边的话后画的会盖掉先画的（视频里是用「顺序交接」解决的，静态图没这个
      // 办法）。填色加同色的外接圆已经够认：这块是谁的，那个圈就是谁的。
      c.tri.forEach((t, i) => {
        fillPoly(t, QUAD[i], 0.13);
        circle(c.cir[i].o, c.cir[i].r, QUAD[i], 1.9);
      });
      [g.A, g.B, g.C, c.X, c.Y, c.Z].forEach((q) => dot(q, col(C_WHT), 4.5));
      lab(c.X, 'X', -14, -9); lab(c.Y, 'Y', 13, -9); lab(c.Z, 'Z', 13, 9);
      dot(c.M, C_ORG, 7.5); lab(c.M, 'M', 14, 8);
      return info('Miquel 定理：完全四边形的四个三角形，它们的外接圆<b>共点</b> —— 这点叫 Miquel 点。',
        '四条线是三角形的三条边加一条横截线。<b>拖动 X 和 Y</b> 让横截线动，' +
        '也可以拖 A、B、C。四个三角形各略去一条线：AXY、BXZ、CYZ、ABC，四个外接圆始终过同一点 M。');
    },
    napoleon(g) {
      const E = napTri(g.A, g.B, g.C), N = E.map((e) => e.cen);
      E.forEach((e) => { seg(e.U, e.apex, C_AMB, 1.2); seg(e.W, e.apex, C_AMB, 1.2); });
      // 结论填色加粗，输入退到细淡线 —— 两个三角形都画成白实线会叠成一个六角星
      ctx.globalAlpha = 0.16;
      const q = N.map(S); ctx.beginPath(); ctx.moveTo(q[0].x, q[0].y);
      ctx.lineTo(q[1].x, q[1].y); ctx.lineTo(q[2].x, q[2].y); ctx.closePath();
      ctx.fillStyle = col(C_WHT); ctx.fill(); ctx.globalAlpha = 1;
      tri(N[0], N[1], N[2], col(C_WHT), 2.8);
      // 三条边各一道刻度：一样多 = 一样长
      [[0, 1], [1, 2], [2, 0]].forEach(([m, n]) => ticks(N[m], N[n], 1, C_AMB));
      N.forEach((P1) => dot(P1, C_ORG, 6));
      E.forEach((e) => dot(e.apex, C_AMB, 4));
      labelPoints([[N[0], 'Na'], [N[1], 'Nb'], [N[2], 'Nc']], sub(N[1], N[0]));
      const L = [len(sub(N[0], N[1])), len(sub(N[1], N[2])), len(sub(N[2], N[0]))];
      return info('拿破仑定理：在三边向外各作一个正三角形，它们的中心 Na、Nb、Nc 又构成一个正三角形 —— 和原三角形的形状完全无关。',
        '拖动顶点 A、B、C 改变三角形。琥珀细线是三个外接正三角形，橙点是它们的中心，白色实心三角形就是拿破仑三角形；' +
        '三条边各一道刻度，意思是三边等长。' +
        '<br>实测三边：' + fmt(L[0], 3) + '、' + fmt(L[1], 3) + '、' + fmt(L[2], 3) +
        '，<b style="color:' + C_ORG + '">最大差 ' + fmt(Math.max(...L) - Math.min(...L), 4) + '</b>。');
    },
    morley(g) {
      const rot = (d, th) => ({ x: d.x * Math.cos(th) - d.y * Math.sin(th),
                                y: d.x * Math.sin(th) + d.y * Math.cos(th) });
      const un = (d) => { const L = Math.max(len(d), 1e-9); return { x: d.x / L, y: d.y / L }; };
      const tri3 = (V, U, W) => {
        const d1 = un(sub(U, V)), d2 = un(sub(W, V));
        const a = Math.atan2(d1.x * d2.y - d1.y * d2.x, d1.x * d2.x + d1.y * d2.y);
        return { d1, d2, a, t1: rot(d1, a / 3), t2: rot(d1, 2 * a / 3) };
      };
      const xl = (P1, d1, P2, d2) => {
        const den = d1.x * d2.y - d1.y * d2.x;
        if (Math.abs(den) < 1e-12) return null;
        const w = sub(P2, P1);
        return { x: P1.x + d1.x * (w.x * d2.y - w.y * d2.x) / den,
                 y: P1.y + d1.y * (w.x * d2.y - w.y * d2.x) / den };
      };
      const tA = tri3(g.A, g.B, g.C), tB = tri3(g.B, g.C, g.A), tC = tri3(g.C, g.A, g.B);
      const P = [xl(g.B, tB.t1, g.C, tC.t2), xl(g.C, tC.t1, g.A, tA.t2), xl(g.A, tA.t1, g.B, tB.t2)];
      if (!P.every(Boolean)) return info('Morley 定理', '这个位置上三等分线平行，交点跑到无穷远。把顶点拖开一点。');
      // 三等分线只画到对边为止，不满屏延伸
      const ray = (V, d, U, W) => xl(V, d, U, un(sub(W, U))) || add(V, mul(d, 2));
      [[g.A, tA, g.B, g.C], [g.B, tB, g.C, g.A], [g.C, tC, g.A, g.B]].forEach(([V, t, U, W]) => {
        seg(V, ray(V, t.t1, U, W), C_AMB, 1.1, [5, 4]);
        seg(V, ray(V, t.t2, U, W), C_AMB, 1.1, [5, 4]);
      });
      ctx.globalAlpha = 0.16;
      const q = P.map(S); ctx.beginPath(); ctx.moveTo(q[0].x, q[0].y);
      ctx.lineTo(q[1].x, q[1].y); ctx.lineTo(q[2].x, q[2].y); ctx.closePath();
      ctx.fillStyle = col(C_WHT); ctx.fill(); ctx.globalAlpha = 1;
      tri(P[0], P[1], P[2], col(C_WHT), 2.8);
      [[0, 1], [1, 2], [2, 0]].forEach(([m, n]) => ticks(P[m], P[n], 1, C_AMB));
      P.forEach((p1) => dot(p1, C_ORG, 6));
      labelPoints([[P[0], 'Pa'], [P[1], 'Pb'], [P[2], 'Pc']], sub(P[1], P[0]));
      const L = [len(sub(P[0], P[1])), len(sub(P[1], P[2])), len(sub(P[2], P[0]))];
      return info('Morley 定理：三个内角的三等分线，相邻两条的交点 Pa、Pb、Pc 构成一个正三角形 —— 和原三角形的形状无关。',
        '拖动顶点 A、B、C 改变三角形。琥珀虚线是六条三等分线（只画到对边为止），橙点是相邻两条的交点，白色实心三角形就是 Morley 三角形；' +
        '三条边各一道刻度，意思是三边等长。' +
        '<br>实测三边：' + fmt(L[0], 3) + '、' + fmt(L[1], 3) + '、' + fmt(L[2], 3) +
        '，<b style="color:' + C_ORG + '">最大差 ' + fmt(Math.max(...L) - Math.min(...L), 4) + '</b>。');
    },
    gergonne(g) {
      const sec = css('--muted'), V = [g.A, g.B, g.C];
      const a = len(sub(g.C, g.B)), b = len(sub(g.A, g.C)), c = len(sub(g.B, g.A));
      const s2 = (a + b + c) / 2;
      const un = (P1, Q1) => { const d = sub(Q1, P1), L = Math.max(len(d), 1e-9); return { x: d.x / L, y: d.y / L }; };
      const at = (P1, Q1, t) => { const u = un(P1, Q1); return { x: P1.x + u.x * t, y: P1.y + u.y * t }; };
      const X = at(g.B, g.C, s2 - b), Y = at(g.C, g.A, s2 - c), Z = at(g.A, g.B, s2 - a);
      const w = [1 / (s2 - a), 1 / (s2 - b), 1 / (s2 - c)], sw = w[0] + w[1] + w[2];
      const Ge = { x: (g.A.x * w[0] + g.B.x * w[1] + g.C.x * w[2]) / sw,
                   y: (g.A.y * w[0] + g.B.y * w[1] + g.C.y * w[2]) / sw };
      circle(g.I, g.r, C_GRN, 1.8);
      [[g.A, X], [g.B, Y], [g.C, Z]].forEach(([P1, Q1]) => seg(P1, Q1, C_BLU, 1.3, [5, 4]));
      // 每个顶点的两条切线等长：一道 / 两道 / 三道，成对挨着
      [[g.A, Z, 1], [g.A, Y, 1], [g.B, X, 2], [g.B, Z, 2], [g.C, Y, 3], [g.C, X, 3]]
        .forEach(([P1, Q1, n]) => ticks(P1, Q1, n, C_AMB));
      [X, Y, Z].forEach((q) => dot(q, C_AMB, 5));
      dot(g.I, C_GRN, 4.5); dot(Ge, C_ORG, 6.5);
      labelPoints([[X, 'X'], [Y, 'Y'], [Z, 'Z'], [Ge, 'Ge']], sub(Ge, g.I));
      return info('Gergonne 点：内切圆与三边切于 X、Y、Z，三条连线 AX、BY、CZ 共点。',
        '拖动顶点 A、B、C 改变三角形。绿圈是内切圆，琥珀点是三个切点，蓝虚线是三条连线，橙点是 Gergonne 点。' +
        '<br>刻度是关键：<b>从每个顶点出发的两条切线等长</b>（都等于 s−a、s−b、s−c），' +
        'Ceva 的乘积 (BX/XC)·(CY/YA)·(AZ/ZB) 因此一项项约掉，正好是 1。' +
        '<br>实测：s−a = ' + fmt(s2 - a) + '，s−b = ' + fmt(s2 - b) + '，s−c = ' + fmt(s2 - c) +
        '；乘积 = <b style="color:' + C_ORG + '">' +
        fmt(((s2 - b) / (s2 - c)) * ((s2 - c) / (s2 - a)) * ((s2 - a) / (s2 - b)), 3) + '</b>。');
    },
    nagelpoint(g) {
      const sec = css('--muted');
      const a = len(sub(g.C, g.B)), b = len(sub(g.A, g.C)), c = len(sub(g.B, g.A));
      const s2 = (a + b + c) / 2;
      const un = (P1, Q1) => { const d = sub(Q1, P1), L = Math.max(len(d), 1e-9); return { x: d.x / L, y: d.y / L }; };
      const at = (P1, Q1, t) => { const u = un(P1, Q1); return { x: P1.x + u.x * t, y: P1.y + u.y * t }; };
      const X = at(g.B, g.C, s2 - c), Y = at(g.C, g.A, s2 - a), Z = at(g.A, g.B, s2 - b);
      const n = nagelData(g.A, g.B, g.C);
      g.excircles.forEach((e) => circle(e, e.r, C_GRN, 1, [4, 3]));
      [[g.A, X], [g.B, Y], [g.C, Z]].forEach(([P1, Q1]) => seg(P1, Q1, C_BLU, 1.3, [5, 4]));
      // 六段只有三种长度，每种出现两次 —— 而且在两条不同的边上，这是和 Gergonne 的区别
      [[g.B, X, 3], [X, g.C, 2], [g.C, Y, 1], [Y, g.A, 3], [g.A, Z, 2], [Z, g.B, 1]]
        .forEach(([P1, Q1, k]) => ticks(P1, Q1, k, C_AMB));
      [X, Y, Z].forEach((q) => dot(q, C_AMB, 5));
      dot(n.Na, C_ORG, 6.5);
      labelPoints([[X, 'X'], [Y, 'Y'], [Z, 'Z'], [n.Na, 'Na']], sub(n.Na, g.I));
      return info('Nagel 点：三个旁切圆与三边切于 X、Y、Z，三条连线 AX、BY、CZ 共点。',
        '拖动顶点 A、B、C 改变三角形。绿虚线圆是三个旁切圆（可能伸出画面），琥珀点是三个切点，蓝虚线是三条连线，橙点是 Nagel 点。' +
        '<br>刻度是关键：<b>六段只有三种长度 s−a、s−b、s−c，每种正好出现两次</b>，一次当分子一次当分母，' +
        'Ceva 的乘积是望远镜式地约掉的。和 Gergonne 点的区别就在排法：那边两段相等挨在同一个顶点，这边同一种长度分在两条不同的边上。' +
        '<br>实测：s−a = ' + fmt(s2 - a) + '，s−b = ' + fmt(s2 - b) + '，s−c = ' + fmt(s2 - c) + '。');
    },
    fermat(g) {
      const ink = css('--ink');
      // Weiszfeld 迭代求 Fermat 点
      let F = { x: g.G.x, y: g.G.y };
      for (let k = 0; k < 160; k++) {
        let wx = 0, wy = 0, ws = 0;
        [g.A, g.B, g.C].forEach((V) => {
          const d = Math.max(len(sub(F, V)), 1e-7);
          wx += V.x / d; wy += V.y / d; ws += 1 / d;
        });
        F = { x: wx / ws, y: wy / ws };
      }
      if (!state.P) state.P = { x: F.x, y: F.y };
      const P0 = state.P;
      const sum = (q) => len(sub(q, g.A)) + len(sub(q, g.B)) + len(sub(q, g.C));
      [g.A, g.B, g.C].forEach((V) => seg(P0, V, C_AMB, 2.0));
      const near2 = len(sub(P0, F)) < g.R * 0.012;
      if (!near2) { circle(F, g.R * 0.022, C_ORG, 2.0); lab(F, 'F', 10, 10); }
      // 三个 120°：只在 P 落到 F 上时画，它正是「F 在这儿」的特征
      if (near2) {
        [[g.A, g.B], [g.B, g.C], [g.C, g.A]].forEach(([U, V]) => {
          const r = g.R * 0.17;
          const a1 = Math.atan2(U.y - P0.y, U.x - P0.x), a2 = Math.atan2(V.y - P0.y, V.x - P0.x);
          let d = a2 - a1; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
          const pad = 0.22 * Math.sign(d), q = S(P0);   // 三个角加起来 360°，缝留小了就拼成一个整圈
          ctx.beginPath(); ctx.arc(q.x, q.y, r * view.s, a1 + pad, a2 - pad, d < 0);
          ctx.strokeStyle = C_ORG; ctx.lineWidth = LW(2.2); ctx.stroke();
        });
      }
      dot(P0, C_ORG, 6.5); lab(P0, near2 ? 'F' : 'P', 9, -9);
      const d0 = sum(P0), dF = sum(F);
      return info('Fermat 点：到三个顶点距离之和最小的那个点。三角形各角都小于 120° 时，它对三边的张角都是 120°。',
        '在画面上拖动（顶点以外的地方）移动 P，也可以拖动顶点。橙圈是 Fermat 点 F —— 把 P 拖到它上面，三个 120° 的角就出现了。' +
        '<br>实测：PA + PB + PC = ' + fmt(d0, 3) + '，最小值（在 F 处）= <b style="color:' + C_ORG + '">' + fmt(dF, 3) + '</b>' +
        (near2 ? '，<b style="color:' + C_ORG + '">P 就在 F 上。</b>' : '，差 ' + fmt(d0 - dF, 3) + ' —— 怎么拖都减不到更小。'));
    },
    centers(g) {
      const sec = css('--muted'), V = [g.A, g.B, g.C];
      const a = len(sub(g.C, g.B)), b = len(sub(g.A, g.C)), c = len(sub(g.B, g.A));
      // 角平分线的垂足：BD : DC = AB : AC = c : b
      const D = [add(g.B, mul(sub(g.C, g.B), c / (b + c))),
                 add(g.C, mul(sub(g.A, g.C), a / (c + a))),
                 add(g.A, mul(sub(g.B, g.A), b / (a + b)))];
      const M = [mid(g.B, g.C), mid(g.C, g.A), mid(g.A, g.B)];
      // 和视频同一套色：中线蓝、中垂线绿、角平分线琥珀、高红，四个心全橙
      V.forEach((P, i) => seg(P, M[i], C_BLU, 1.2, [5, 4]));
      M.forEach((m, i) => {
        const d = sub(V[(i + 2) % 3], V[(i + 1) % 3]), n = mul([-d.y, d.x], 1 / len(d));
        seg(sub(m, mul(n, g.R * 1.05)), add(m, mul(n, g.R * 1.05)), C_GRN, 1.2, [5, 4]);
      });
      V.forEach((P, i) => seg(P, D[i], C_AMB, 1.2, [5, 4]));
      V.forEach((P, i) => seg(P, foot(P, V[(i + 1) % 3], V[(i + 2) % 3]), C_RED, 1.2, [5, 4]));
      [g.G, g.O, g.I, g.H].forEach((P) => dot(P, C_ORG, 5.5));
      labelPoints([[g.G, 'G'], [g.O, 'O'], [g.I, 'I'], [g.H, 'H']], sub(g.H, g.O));
      return info('三条中线交于重心 G，三条中垂线交于外心 O，三条角平分线交于内心 I，三条高交于垂心 H —— 四族线各自共点。' +
        '<br>三条线交于一点本来是稀罕事：随手画三条塞瓦线，它们只会围出一个小三角形。这四族每一族都共点，才是定理。',
        '拖动顶点 A、B、C 改变三角形。蓝虚线是中线 → G，绿虚线是中垂线 → O，琥珀虚线是角平分线 → I，红虚线是高 → H；四个心同色，因为它们是同一类东西。' +
        '<br>实测：OG = ' + fmt(len(sub(g.G, g.O))) + '，GH = ' + fmt(len(sub(g.H, g.G))) + '，比值 ' + fmt(len(sub(g.H, g.G)) / Math.max(len(sub(g.G, g.O)), 1e-9)) + '（这就是欧拉线的 1 : 2）。');
    },
    ceva(g) {
      const sec = css('--muted'), ink = css('--ink');
      if (!state.P) state.P = { x: g.G.x + 0.10 * g.R, y: g.G.y - 0.06 * g.R };
      const P0 = state.P;
      const X = intersect(g.A, P0, g.B, g.C), Y = intersect(g.B, P0, g.C, g.A), Z = intersect(g.C, P0, g.A, g.B);
      if (!X || !Y || !Z) { dot(P0, C_ORG, 6.5); lab(P0, 'P', 9, -9);
        return info('Ceva 定理', '这个位置上塞瓦线和某条边平行，交点跑到无穷远。把 P 拖开一点。'); }
      // 六段交替染色：分子段琥珀、分母段蓝，和视频、和底部式子同色
      [[g.B, X], [g.C, Y], [g.A, Z]].forEach(([p, q]) => seg(p, q, C_AMB, 3.0));
      [[X, g.C], [Y, g.A], [Z, g.B]].forEach(([p, q]) => seg(p, q, C_BLU, 3.0));
      [[g.A, X], [g.B, Y], [g.C, Z]].forEach(([p, q]) => seg(p, q, sec, 1.1, [4, 4]));
      [X, Y, Z].forEach((q) => dot(q, ink, 5));
      dot(P0, C_ORG, 6.5);
      labelPoints([[X, 'X'], [Y, 'Y'], [Z, 'Z'], [P0, 'P']], sub(X, g.A));
      const r = [len(sub(X, g.B)) / len(sub(g.C, X)), len(sub(Y, g.C)) / len(sub(g.A, Y)),
                 len(sub(Z, g.A)) / len(sub(g.B, Z))];
      return info('Ceva 定理：三条塞瓦线 AX、BY、CZ 共点，当且仅当 (BX/XC)·(CY/YA)·(AZ/ZB) = 1。',
        '在画面上拖动（顶点以外的地方）移动 P，也可以拖动顶点。琥珀是三段分子 BX、CY、AZ，蓝是三段分母 XC、YA、ZB。' +
        '<br>实测：BX/XC = ' + fmt(r[0]) + '，CY/YA = ' + fmt(r[1]) + '，AZ/ZB = ' + fmt(r[2]) +
        '，三者之积 = <b style="color:' + C_ORG + '">' + fmt(r[0] * r[1] * r[2], 3) + '</b>。');
    },
    menelaus(g) {
      const sec = css('--muted'), ink = css('--ink');
      // 滑块直接定 X 在直线 BC 上的位置（参数 > 1 即落在 C 外侧），Z 固定在 AB 上，
      // Y 由这两点的连线截出来。原来反过来定 Z、Y 再求 X —— 换个三角形 X 就飞出画面了。
      if (!state.mw) state.mw = 1.16;
      const sX = state.mw, aZ = 0.35;   // X 只伸出 C 一点点 —— 伸远了就跑出画框，而画框是十三张图共用的
      const X = add(g.B, mul(sub(g.C, g.B), sX));
      const Z = add(g.A, mul(sub(g.B, g.A), aZ));
      const Y = intersect(Z, X, g.C, g.A);
      if (!Y) { return info('Menelaus 定理', '横截线此刻平行于 CA，交点在无穷远。用下面的滑块挪一下。'); }
      sides(g, sec);
      [[g.B, X], [g.C, Y], [g.A, Z]].forEach(([p, q]) => seg(p, q, C_AMB, 3.0));
      [[X, g.C], [Y, g.A], [Z, g.B]].forEach(([p, q]) => seg(p, q, C_BLU, 3.0));
      const d = sub(X, Z);
      seg(sub(Z, mul(d, 0.16)), add(X, mul(d, 0.10)), col(C_WHT), 2.2);
      [X, Y, Z].forEach((q) => dot(q, ink, 5));
      labelPoints([[X, 'X'], [Y, 'Y'], [Z, 'Z']], d);
      const sp = (Q, P1, R1) => { const e = sub(R1, P1);
        return ((Q.x - P1.x) * e.x + (Q.y - P1.y) * e.y) / (e.x * e.x + e.y * e.y); };
      const sx = sp(X, g.B, g.C), sy = sp(Y, g.C, g.A), sz = sp(Z, g.A, g.B);
      const r = [sx / (1 - sx), sy / (1 - sy), sz / (1 - sz)];
      return info('Menelaus 定理：一条横截线与三边所在直线交于 X、Y、Z，则有向分比满足 (BX/XC)·(CY/YA)·(AZ/ZB) = −1。',
        '用下面的滑块移动横截线，也可以拖动顶点。琥珀是三段分子，蓝是三段分母；三个交点里必有一个落在边的延长线上，那一段是反向的，负号就从这儿来。' +
        '<br>实测：BX/XC = ' + fmt(r[0]) + '，CY/YA = ' + fmt(r[1]) + '，AZ/ZB = ' + fmt(r[2]) +
        '，三者之积 = <b style="color:' + C_ORG + '">' + fmt(r[0] * r[1] * r[2], 3) + '</b>。');
    },
    euler(g) {
      const sec = css('--muted');
      sides(g, sec); circle(g.O, g.R, sec, 1, [5, 4]);
      const M = [mid(g.B, g.C), mid(g.C, g.A), mid(g.A, g.B)];
      const F = [foot(g.A, g.B, g.C), foot(g.B, g.C, g.A), foot(g.C, g.A, g.B)];
      const vs = [g.A, g.B, g.C];
      if (state.show.pb) M.forEach((m) => seg(m, g.O, C_GRN, 1.1, [4, 3]));
      if (state.show.md) M.forEach((m, i) => seg(vs[i], m, C_BLU, 1.1));
      if (state.show.al) F.forEach((f, i) => { seg(vs[i], f, C_RED, 1.1); if (len(sub(g.H, f)) > len(sub(vs[i], f))) seg(f, g.H, C_RED, 0.8, [3, 3]); else seg(vs[i], g.H, C_RED, 0.8, [3, 3]); });
      circle(g.N, g.r9, col(C_WHT), 2.6); lineInf(g.O, g.H, col(C_WHT), 1.2, [7, 4]); seg(g.O, g.H, col(C_WHT), 2.2);
      ninePoints(g.A, g.B, g.C).forEach((p, i) => dot(p, i < 3 ? C_ORG : i < 6 ? C_FOT : C_PUR, 3.5));
      const dir = sub(g.H, g.O), same = near(g.O, g.G, g);
      if (same) { dot(g.O, C_ORG, 5.5); lab(g.O, 'O = G = H = N', 9, -9); }
      else [[g.O, 'O', C_ORG, 1], [g.G, 'G', C_ORG, -1], [g.N, 'N', col(C_WHT), 1], [g.H, 'H', C_ORG, -1]].forEach(([p, n, c, sd]) => { dot(p, c, 5.5); labPerp(p, n, dir, sd); });
      return info('三条中垂线交于外心 O，三条中线交于重心 G，三条高交于垂心 H。O、G、H 在一条直线上，叫做欧拉线，并且 OG : GH = 1 : 2。九点圆的圆心 N 是 OH 的中点。',
        '拖动顶点 A、B、C 改变三角形；用上面的复选框显示或隐藏中垂线（绿）、中线（蓝）、高（红）。白色粗线是欧拉线，白圈是九点圆，橙点是 O、G、H。<br>' +
        (same ? '三角形接近等边：O、G、H、N 几乎重合，欧拉线不再确定。' :
          '实测：ON = ' + fmt(len(sub(g.N, g.O))) + '，NH = ' + fmt(len(sub(g.H, g.N))) + '；OG : GH = 1 : ' + fmt(len(sub(g.H, g.G)) / len(sub(g.G, g.O))) + '。'));
    },
    homothety(g) {
      const Cn = state.center === 'H' ? g.H : g.G, cn = state.center, k = state.k, target = cn === 'H' ? 0.5 : -0.5;
      circle(g.O, g.R, C_GRY, 1.2, [5, 4]); circle(g.N, g.r9, C_PUR, 2.2);
      const img = (X) => add(Cn, mul(sub(X, Cn), k));
      for (let i = 0; i < 16; i++) {
        const t = i / 16 * 2 * Math.PI, X = { x: g.O.x + g.R * Math.cos(t), y: g.O.y + g.R * Math.sin(t) };
        dot(X, C_GRY, 2.5); dot(img(X), C_AMB, 3);
      }
      [g.A, g.B, g.C].forEach((X) => { seg(Cn, X, C_GRY, 0.9); dot(img(X), C_AMB, 4.5); });
      const P = { x: g.O.x + g.R * Math.cos(state.theta), y: g.O.y + g.R * Math.sin(state.theta) }, Pi = img(P);
      seg(Cn, P, C_AMB, 1.4); dot(P, C_AMB, 6.5); lab(P, 'P', 9, -9); dot(Pi, C_ORG, 6.5); lab(Pi, 'P′', 9, 14);
      const Oi = img(g.O); circle(Oi, g.R * k, C_AMB, 2); seg(Cn, g.O, C_GRN, 1, [3, 3]); dot(g.O, C_GRN, 5); lab(g.O, 'O', 8, -8); dot(Oi, C_AMB, 4.5);
      dot(Cn, C_RED, 6); lab(Cn, cn, 8, -8);
      const hit = Math.abs(k - target) < 0.006;
      if (hit) { dot(g.N, C_PUR, 5); lab(g.N, 'N', 8, 14); }
      const ops = '缩放的意思：以一个点为中心，每个点 X 沿着从中心出发、经过 X 的射线移动，新位置 X′ 到中心的距离 = k × 原来的距离（k 为负时，X′ 跑到中心的另一侧）。' +
        '<br>用上面的按钮选择以 H 还是 G 为中心，拖动滑块改变 k；在画面上拖动（顶点以外的地方）让 P 沿外接圆移动，也可以拖动顶点。灰色是外接圆上 16 个样点，棕色是它们缩放后的位置，连起来就是缩放后的圆。' +
        '<br>现在中心是 ' + cn + '，k = ' + fmt(k) + '：' + cn + 'P = ' + fmt(len(sub(P, Cn))) + '，' + cn + 'P′ = ' + fmt(len(sub(Pi, Cn))) + '。' +
        (hit ? '<b style="color:' + C_PUR + '">此时缩放后的圆和九点圆重合：圆心 O 被送到 N，半径从 R 变成 R/2；' +
          (cn === 'H' ? 'A、B、C 的像是 AH、BH、CH 的中点，P 的像就是 PH 的中点。' : 'A、B、C 的像是三边的中点。') + '</b>'
          : '把滑块拖到 k = ' + target + '，看缩放后的圆会变成什么。');
      return info('以垂心 H 为中心，把外接圆缩小到一半（k = 1/2），得到的正是九点圆；以重心 G 为中心、按 k = −1/2 缩放，也得到九点圆。所以九点圆的半径是外接圆半径的一半，圆心 N 是 OH 的中点。', ops);
    },
    feuerbach(g) {
      const sec = css('--muted');
      sides(g, sec); [g.A, g.B, g.C].forEach((P) => seg(P, g.I, C_GRN, 0.9, [4, 3]));
      circle(g.I, g.r, C_GRN, 1.6); seg(g.I, foot(g.I, g.A, g.B), C_GRN, 0.8);
      g.excircles.forEach((e) => circle(e, e.r, C_GRN, 1, [4, 3])); circle(g.N, g.r9, col(C_WHT), 2.6);
      const tp = (c) => add(g.N, mul(sub(c, g.N), g.r9 / len(sub(c, g.N)))), same = near(g.N, g.I, g);
      if (!same) { const T = tp(g.I); lineInf(g.N, g.I, C_ORG, 1, [6, 4]); seg(g.N, T, C_ORG, 1.8); dot(T, C_ORG, 6); lab(T, 'T', 8, 14); }
      g.excircles.forEach((e) => { const q = tp(e); seg(g.N, q, C_ORG, 0.8, [3, 3]); dot(q, C_ORG, 4.5); });
      dot(g.N, col(C_WHT), 5); dot(g.I, C_GRN, 5);
      if (same) lab(g.N, 'N = I', 8, -8); else { lab(g.N, 'N', 8, -8); lab(g.I, 'I', 8, -8); }
      return info('费尔巴哈定理：三角形的九点圆与内切圆相切，也与三个旁切圆相切。设 R 为外接圆半径、r 为内切圆半径、I 为内心，则九点圆圆心 N 到内心的距离 NI = R/2 − r，九点圆与内切圆的切点 T 在直线 NI 上。',
        '拖动顶点 A、B、C 改变三角形。绿色虚线是三条角平分线（交于内心 I），绿色实线圆是内切圆，绿色虚线圆是三个旁切圆（可能伸出画面），白色是九点圆，橙色点是四个切点。<br>' +
        (same ? '等边三角形中九点圆与内切圆重合（N 与 I 重合，r = R/2），切点不再唯一，所以不画直线 NI 和切点 T。' :
          '实测：NI = ' + fmt(len(sub(g.I, g.N)), 3) + '，R/2 − r = ' + fmt(g.r9 - g.r, 3) + '。'));
    },
    simson(g) {
      const sec = css('--muted');
      sides(g, sec); circle(g.O, g.R, sec, 1, [5, 4]); circle(g.N, g.r9, col(C_WHT), 2.6);
      // 三条高（红色虚线）交于垂心 H；H 在三角形外时延长到 H
      [[g.A, g.B, g.C], [g.B, g.C, g.A], [g.C, g.A, g.B]].forEach(([X, U, V]) => {
        const F = foot(X, U, V); seg(X, F, C_RED, 0.9, [4, 3]);
        if (len(sub(g.H, F)) > len(sub(X, F)) || len(sub(g.H, X)) > len(sub(F, X))) seg(len(sub(g.H, F)) < len(sub(g.H, X)) ? F : X, g.H, C_RED, 0.9, [4, 3]);
      });
      const P = { x: g.O.x + g.R * Math.cos(state.theta), y: g.O.y + g.R * Math.sin(state.theta) };
      const f = [foot(P, g.B, g.C), foot(P, g.C, g.A), foot(P, g.A, g.B)];
      // 垂足落在边外时，把那条边延长出去（虚线）—— 不画的话垂足就是悬空的
      [[g.B, g.C], [g.C, g.A], [g.A, g.B]].forEach(([U, V], i) => {
        const qf = f[i], d = sub(V, U);
        const k = ((qf.x - U.x) * d.x + (qf.y - U.y) * d.y) / (d.x * d.x + d.y * d.y);
        if (k < 0 || k > 1) seg(k < 0 ? U : V, qf, col(C_WHT), 1, [6, 5]);
      });
      f.forEach((q) => { seg(P, q, sec, 0.8); dot(q, C_FOT, 4.5); });
      const pr = [[0, 1], [1, 2], [0, 2]].reduce((b, ij) => len(sub(f[ij[0]], f[ij[1]])) > len(sub(f[b[0]], f[b[1]])) ? ij : b);
      lineInf(f[pr[0]], f[pr[1]], col(C_WHT), 2.2);
      seg(P, g.H, C_AMB, 1.6); const M = mid(P, g.H);
      dot(M, C_ORG, 6.5); dot(P, C_AMB, 7); dot(g.H, C_RED, 5); lab(P, 'P', 9, -9); lab(g.H, 'H', 8, -8); lab(M, 'M', 8, 14);
      return info('西姆松定理：P 是三角形外接圆上任意一点，从 P 向三边（或其延长线）作垂线，三个垂足在一条直线上，这条直线叫做 P 的西姆松线。西姆松线平分 P 与垂心 H 的连线 PH，PH 的中点 M 在九点圆上。',
        '在画面上拖动（顶点以外的地方），P 沿外接圆移动；也可以拖动顶点。红色虚线是三角形的三条高，交于垂心 H；灰线是 P 到三边的垂线，蓝色点是三个垂足，白色直线是西姆松线，琥珀色线段是 PH，橙色点是它的中点 M。' +
        '<br>M 为什么在九点圆上：以 H 为中心把外接圆缩小一半就是九点圆，P 被送到 PH 的中点 M。');
    },
    ninepoint(g) {
      // 和视频同一套：中点橙、垂足蓝、欧拉点紫，九点圆用主对象色
      const V = [g.A, g.B, g.C];
      circle(g.O, g.R, C_GRY, 1.2, [5, 4]);
      V.forEach((P) => seg(P, foot(P, ...V.filter((x) => x !== P)), C_RED, 1.1, [4, 3]));
      V.forEach((P) => seg(P, g.H, C_PUR, 1.0, [4, 3]));
      circle(g.N, g.r9, col(C_WHT), 2.6);
      ninePoints(g.A, g.B, g.C).forEach((p, i) => dot(p, i < 3 ? C_ORG : i < 6 ? C_FOT : C_PUR, 4.8));
      dot(g.H, C_RED, 5.5); lab(g.H, 'H', 8, -8);
      dot(g.N, col(C_WHT), 4.6); lab(g.N, 'N', 8, 14);
      return info('三边的中点、三条高的垂足、三个顶点到垂心 H 连线的中点 —— 这九个点在同一个圆上。' +
        '圆心 N 是 OH 的中点，半径是外接圆半径的一半。',
        '拖动顶点 A、B、C 改变三角形，九个点始终落在同一个圆上。' +
        '橙色是三边中点，蓝色是三个垂足，紫色是三个欧拉点；红虚线是三条高，紫虚线是顶点到 H 的连线，' +
        '灰虚线是外接圆。现在 R = ' + fmt(g.R) + '，九点圆半径 = ' + fmt(g.r9) + '。');
    },
    orthocentric(g) {
      const sec = css('--muted');
      circle(g.N, g.r9, col(C_WHT), 2.6);
      const four = [[g.A, g.B, g.C], [g.A, g.B, g.H], [g.A, g.C, g.H], [g.B, g.C, g.H]];
      const left = [g.H, g.C, g.B, g.A];              // 每个三角形空出来的那个点，正是它的垂心
      four.forEach((T) => tri(T[0], T[1], T[2], sec, 0.7));
      const T = four[state.tri]; tri(T[0], T[1], T[2], col(C_WHT), 2.2);
      const m = Math.max(len(sub(T[1], T[0])), len(sub(T[2], T[0])), len(sub(T[2], T[1])));
      const flat = Math.abs((T[1].x - T[0].x) * (T[2].y - T[0].y) - (T[1].y - T[0].y) * (T[2].x - T[0].x)) < 1e-6 * m * m;
      if (!flat) {
        T.forEach((P) => seg(P, foot(P, ...T.filter((x) => x !== P)), C_RED, 1.2, [4, 3]));
        // 三组点三种颜色：中点橙、垂足蓝、欧拉点紫 —— 和视频、卡片缩略图一致
        ninePoints(T[0], T[1], T[2]).forEach((p, i) => {
          dot(p, i < 3 ? C_ORG : i < 6 ? C_FOT : C_PUR, 4.5);
        });
      }
      // 当前三角形的垂心 = 它空出来的那个点。A、B、C 这三个把手由 draw() 统一画在最后，
      // 这里再画点、再标字母会被盖掉、字母还会重一份，所以只套一个红圈。
      const Hc = left[state.tri];
      if (state.tri === 0) { dot(Hc, C_RED, 6); lab(Hc, 'H', 8, -8); }
      else { ring(Hc, 10, C_RED, 1.8); dot(g.H, col(C_WHT), 4.5); lab(g.H, 'H', 8, -8); }
      return info('三角形三边的中点、三条高的垂足、三个顶点到垂心连线的中点，这九个点在同一个圆上，叫做九点圆。' +
        '<br>进一步：A、B、C 和垂心 H 这四个点中任取三点，组成四个三角形，每个三角形的垂心正好是剩下的那个点；这四个三角形共用同一个九点圆。',
        '拖动顶点 A、B、C 改变三角形；用上面的按钮在四个三角形之间切换。白色粗线是当前三角形，红色虚线是它的三条高、交于它的垂心（就是空出来的那个点，标红），三组点分别是三边中点（橙）、三个垂足（蓝）、三个欧拉点（紫），白圈是九点圆 —— 四个三角形共用同一个，切换时它一动不动。' +
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
      const ops0 = '在画面上拖动（顶点以外的地方）移动 P，也可以拖动顶点。蓝色点是 6 个中点，琥珀点是 3 个对角点，白线是过这 9 点的二次曲线；背景浅绿表示 P 在这里时曲线是椭圆，浅橙表示是双曲线。' +
        '「把 P 放到垂心」会把 P 移到垂心；勾选「让 P 只能沿外接圆走」后，P 被限制在外接圆上。' +
        '<br>九点圆是这条定理在 P 落在垂心时的特例：从欧氏几何升到仿射几何，「圆」变成了「二次曲线」。<br>';
      const finishP = () => { dot(P, C_ORG, 6.5); lab(P, 'P', 9, -9); };
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
      ctx.strokeStyle = col(C_WHT); ctx.lineWidth = LW(2.6);
      traceImplicit(ctx, (sx, sy) => evalConic(co, nrm(Wd({ x: sx, y: sy }))), W, H, 3);

      const [a, b, c] = co, sc = Math.abs(a) + Math.abs(c) + 1e-300, disc = b * b - 4 * a * c;
      let kind, note = '';
      if (Math.abs(a - c) / sc < 0.03 && Math.abs(b) / sc < 0.03) { kind = '圆'; note = '<b style="color:' + C_PUR + '">这就是九点圆</b>：P 落在垂心时，九点二次曲线变成圆，9 个点正是三边中点、三条高的垂足和顶点到垂心连线的中点。'; }
      else if (Math.abs(disc) / (sc * sc) < 1e-4) kind = '抛物线';
      else if (disc < 0) kind = '椭圆';
      else {
        const rect = Math.abs(a + c) / sc < 0.03; kind = rect ? '等轴双曲线' : '双曲线';
        const cn = conicCenter(co);
        if (cn && isFinite(cn.x) && isFinite(cn.y)) {
          const cen = { x: g.O.x + cn.x * R, y: g.O.y + cn.y * R };
          const ms = asymptoteSlopes(co), dirs = ms.length ? ms.map((m) => ({ x: 1, y: m })) : [{ x: 0, y: 1 }, { x: 1, y: -a / b }];
          dirs.forEach((d) => lineInf(cen, add(cen, d), C_AMB, 1.2, [7, 5]));
          const cosT = Math.abs(dirs[0].x * dirs[1].x + dirs[0].y * dirs[1].y) / (len(dirs[0]) * len(dirs[1]));
          note = '两条渐近线（橙色虚线）夹角约 ' + fmt(Math.acos(Math.min(1, cosT)) * 180 / Math.PI, 1) + '°' + (rect ? '，互相垂直。' : '。');
        }
      }
      setKind(kind);
      mids.forEach((p) => dot(p, C_BLU, 4.5));
      const far = diag.filter((p) => !p).length;
      diag.forEach((p) => { if (p) { const q = S(p); if (q.x > -W && q.x < 2 * W && q.y > -H && q.y < 2 * H) dot(p, C_AMB, 5); } });
      finishP();
      return info(thm, ops0 + '现在曲线是<b>' + kind + '</b>。' + note +
        (far ? '有 ' + far + ' 个对角点在无穷远处（P 与某个顶点的连线平行于对边）。' : ''));
    },
    nagel(g) {
      const sec = css('--muted'), n = nagelData(g.A, g.B, g.C), V = [g.A, g.B, g.C], U = [n.Ua, n.Ub, n.Uc];
      sides(g, sec); circle(g.I, g.r, C_GRN, 1.6);
      U.forEach((u, i) => seg(V[i], u, C_AMB, 1.2, [5, 4]));
      [mid(g.B, g.C), mid(g.C, g.A), mid(g.A, g.B)].forEach((m, i) => seg(V[i], m, C_BLU, 1.1));
      const same = len(sub(n.Na, n.I)) < g.R * 1e-6;
      if (!same) { lineInf(n.I, n.Na, col(C_WHT), 1.0, [7, 4]); seg(n.I, n.Na, col(C_WHT), 2.4); }
      U.forEach((u) => dot(u, C_AMB, 4.4));
      // I、G、Sp、Na 同色：它们是一伙的，正是「共线」要说的那件事
      [n.I, n.G, n.Sp, n.Na].forEach((P2) => dot(P2, C_ORG, 5.5));
      labelPoints(same ? [[n.I, 'I = G = Sp = Na'], [n.Ua, 'Ua'], [n.Ub, 'Ub'], [n.Uc, 'Uc']]
        : [[n.I, 'I'], [n.G, 'G'], [n.Sp, 'Sp'], [n.Na, 'Na'], [n.Ua, 'Ua'], [n.Ub, 'Ub'], [n.Uc, 'Uc']], sub(n.Na, n.I));
      const ig = len(sub(n.G, n.I)), gn = len(sub(n.Na, n.G));
      return info('Nagel 线：三角形的内心 I、重心 G、Spieker 点 Sp 和 Nagel 点 Na 在一条直线上，并且 IG : GNa = 1 : 2，Sp 是 I 与 Na 的中点。' +
        '其中 Nagel 点是三个顶点与对边上旁切圆切点的连线的交点，Spieker 点是三边中点所成三角形的内心。' +
        '<br>以 G 为中心、比例 −1/2 的位似把 Na 变成 I、把 I 变成 Sp，和欧拉线上把 H 变成 O、把 O 变成 N 是同一个位似。',
        '拖动顶点 A、B、C 改变三角形。绿圈是内切圆；琥珀虚线是三个顶点到对边上旁切圆切点 Ua、Ub、Uc 的连线，交于 Nagel 点 Na；蓝虚线是三条中线，交于重心 G；白线是 Nagel 线，I、G、Sp、Na 四个橙点都在它上面。<br>' +
        (same ? '三角形接近等边：I、G、Sp、Na 几乎重合，Nagel 线不再确定。'
          : '实测：IG : GNa = 1 : ' + fmt(gn / ig) + '；ISp = ' + fmt(len(sub(n.Sp, n.I))) + '，SpNa = ' + fmt(len(sub(n.Na, n.Sp))) + '，Sp 是 I 与 Na 的中点。'));
    },
    soddy(g) {
      const sec = css('--muted'), d = soddyData(g.A, g.B, g.C), V = [g.A, g.B, g.C], T = [d.Ta, d.Tb, d.Tc];
      const outer = d.S2 && d.r2 > 0 && d.r2 < 100 * g.R;   // 外 Soddy 圆太大时看作已退化成直线
      sides(g, sec);
      V.forEach((X, i) => circle(X, d.radii[i], C_GRY, 1.3));
      T.forEach((t, i) => seg(V[i], t, C_BLU, 1.1));
      if (d.S1) circle(d.S1, d.r1, C_PUR, 2);
      if (outer) circle(d.S2, d.r2, C_RED, 1.8);
      const pts = [[d.I, 'I', C_AMB], [d.Ge, 'Ge', C_BLU], [d.L, 'L', C_GRN], [d.S1, 'S₁', C_PUR]].concat(outer ? [[d.S2, 'S₂', C_RED]] : []).filter(([P]) => P);
      // Soddy 线：取这些点里相距最远的两个连线
      let far = [pts[0][0], pts[0][0]], fd = 0;
      pts.forEach(([P]) => pts.forEach(([Q]) => { const x = len(sub(P, Q)); if (x > fd) { fd = x; far = [P, Q]; } }));
      const same = fd < g.R * 1e-6;
      if (!same) { lineInf(far[0], far[1], C_ORG, 1.2, [7, 4]); seg(far[0], far[1], C_ORG, 2.2); }
      T.forEach((t) => dot(t, C_BLU, 4));
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
      g.excircles.forEach((e) => circle(e, e.r, C_GRN, 1, [4, 3]));
      circle(g.I, g.r, C_GRN, 1.6);
      const U = [d.Ua, d.Ub, d.Uc];
      tri(U[0], U[1], U[2], C_AMB, 1.3);
      const M = circumcircle(U[0], U[1], U[2]);
      circle(M, M.r, col(C_WHT), 2.6);
      circle(g.N, g.r9, C_PUR, 2.6);
      U.forEach((u) => dot(u, C_AMB, 5));
      // 费尔巴哈点：九点圆与内切圆的切点，在直线 NI 上
      const same = near(g.N, g.I, g);
      let F = null;
      if (!same) {
        F = add(g.N, mul(sub(g.I, g.N), g.r9 / len(sub(g.I, g.N))));
        seg(g.N, g.I, C_AMB, 0.8, [3, 3]); dot(F, C_ORG, 6.5);
      }
      dot(g.N, C_PUR, 5); dot(g.I, C_GRN, 5); dot(M, col(C_WHT), 4.5);
      labelPoints([[U[0], 'Ua'], [U[1], 'Ub'], [U[2], 'Uc'], [g.N, 'N'], [g.I, 'I'], [M, 'M']]
        .concat(F ? [[F, 'F']] : []), sub(g.I, g.N));
      const ops = '拖动顶点 A、B、C 改变三角形。绿虚线圆是三个旁切圆（可能伸出画面），绿实线圆是内切圆；' +
        '琥珀点是三个旁切点 Ua、Ub、Uc，琥珀细线是它们连成的旁切点三角形，白圈是这个三角形的外接圆，也就是 Mandart 圆（圆心 M）；' +
        '紫色是九点圆，橙点是费尔巴哈点 F —— 它是九点圆与内切圆的切点，和旁切点三角形毫无关系，却正好落在白圈上。<br>';
      return info('Mandart 圆：三个旁切圆与它们所对的边分别切于 Ua、Ub、Uc，这三点连成旁切点三角形，它的外接圆叫 Mandart 圆。这个圆经过 费尔巴哈点 F —— 也就是九点圆与内切圆的切点。',
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
      nps.forEach((c, i) => circle({ x: c.x, y: c.y }, c.r, i ? C_GRN : C_BLU, i ? 1.4 : 2.2));

      const co = rectHyperbolaThrough([g.A, g.B, g.C, P].map(nrm));
      const big = Math.max(...co.map(Math.abs));
      const Po = big > 1e-12 && co.every(isFinite) ? conicCenter(co) : null;
      if (!Po) { dot(P, ink, 6.5); lab(P, 'P', 9, -9); return info(thm, base + 'P 落在垂心附近：过 A、B、C、H 的二次曲线全是等轴双曲线，中心铺满整个九点圆，Po 不再唯一。把 P 拖开一点。'); }

      ctx.strokeStyle = C_PUR; ctx.lineWidth = LW(2.4);
      traceImplicit(ctx, (sx, sy) => evalConic(co, nrm(Wd({ x: sx, y: sy }))), W, H, 3);
      const Pw = un(Po);
      asymptoteSlopes(co).forEach((m) => lineInf(Pw, un(add(Po, { x: 1, y: m })), C_ORG, 1.1, [7, 5]));
      dot(P, ink, 6.5); dot(Pw, C_ORG, 6.5);
      labelPoints([[P, 'P'], [Pw, 'Po']], sub(P, Pw));

      // 实测：Po 到四个九点圆心的距离应等于各自半径
      const errs = nps.map((c) => Math.abs(len(sub(Pw, { x: c.x, y: c.y })) - c.r) / c.r);
      const worst = Math.max(...errs);
      return info(thm, base +
        '实测：Po 到四个九点圆心的距离与各自半径之差，相对误差最大 ' + worst.toExponential(1) + '，即 Po 同时落在这四个圆上。' +
        '<br>把 P 放到内心，Po 就是 费尔巴哈点；把 P 放到垂心，这条双曲线不再唯一。');
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
  DRAW.eulerplane = () => '';
  const is3D = () => ['sevenpoint', 'thirteen', 'eulerplane'].includes(state.tab);

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
  const curRot = () => (state.tab === 'thirteen' ? state.rot13 : state.tab === 'eulerplane' ? state.rotE : state.rot);
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
    if (state.showCircum) sphere3(d.O, d.R, C_GRY, 1.1, true);
    // 四面体
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) seg3(V[i], V[j], ink, 1.4);
    // 七点球
    sphere3(d.c, d.rad, C_PUR, 2.2, true);
    // 三组共线
    const by = (n) => d.pts.find(([, t]) => t === n)[0];
    seg3(V[k], by('C'), C_AMB, 1.2, [7, 5]);
    seg3(d.O, by('4G−3O'), C_BLU, 1.2, [7, 5]);
    seg3(d.O, by('4O′−3O'), C_GRN, 1.2, [7, 5]);
    // 点与标注
    [[d.O, 'O', sec], [d.G, 'G', sec], [d.Op, 'O′', sec]].forEach(([p, t, c]) => { dot3(p, c, 4); lab3(p, t, sec); });
    V.forEach((p, i) => { dot3(p, ink, 5); lab3(p, 'V' + i, ink); });
    d.pts.forEach(([p, t]) => { dot3(p, C_ORG, 6); lab3(p, t, C_ORG); });
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
      'P（G′ 关于极球的反演点）、Q1（HX' + k + ' 的中点）、Q2（HY' + k + ' 的中点）；并且 <b>H 对 Σ 的幂恒为 (3/2)p</b>，与形状无关。' +
      '<br>这里 X' + k + ' 是 ' + vk + ' 在外接球上的对径点，Y' + k + ' 是高线 ' + vk + 'H 与外接球的第二个交点；p = HV<sub>i</sub> · HH<sub>i</sub>（H<sub>i</sub> 是 V<sub>i</sub> 的高足）对四个顶点相同，极球反演就是以 H 为中心、幂为 p 的反演。' +
      '顶点、九点圆上的 9 个点（对面三边中点 M、三条高的垂足 F、三个欧拉点 E）再加 P、Q1、Q2，共 13 个点。';
    const ops = '<b>按住拖动可以转动整个图形</b>，双指捏合或 ⌘/Ctrl＋滚轮缩放；用上面的按钮换一个顶点或换一个垂心四面体。灰色是外接球，紫色是十三点球 Σ，浅蓝面是对面，蓝色粗圆是它的九点圆，蓝色细线是面内三条高（交于 H′）；' +
      '棕、绿、粉三条虚线分别给出 P、Q1、Q2（绿线到 X' + k + '，粉线是高线，到 Y' + k + '）。<br>';
    if (!d) return info(thm, ops + '这个四面体接近退化，暂不绘制。换一个四面体。');
    const all = d.pts.map(([q]) => q).concat(V, [d.O, d.H, d.anti, d.X2]);
    fit3(all); placed3 = [];
    if (state.showCircum) sphere3(d.O, d.R, C_GRY, 1.1, true);
    // 对面：浅蓝填充、九点圆、面内三条高
    ctx.beginPath(); d.T.map(P3).forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath();
    ctx.fillStyle = 'rgba(55,138,221,0.13)'; ctx.fill();
    d.T.forEach((X, j) => seg3(X, d.F[j], C_GRN, 0.9));
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) seg3(V[i], V[j], ink, 1.4);
    circle3(d.nine, d.nrm, d.r9, C_GRN, 2.2);
    sphere3(d.c, d.rad, C_PUR, 2.2, true);
    // 辅助线：P、H、G′、Q1、X 其实在一条直线上（X − H = 3(G′ − H)），按图例分两段上色
    const by = (n) => d.pts.find(([, t]) => t === n)[0];
    seg3(by('P'), d.Gd, C_AMB, 1.2, [7, 5]);
    seg3(d.Gd, d.anti, C_BLU, 1.2, [7, 5]);
    seg3(V[k], d.X2, C_RED, 1.2, [7, 5]);
    // 点与标注：先标十三个点，再标辅助点
    d.pts.forEach(([q, t], i) => { dot3(q, C_ORG, i === 0 || i > 9 ? 6 : 4.5); lab3(q, t, C_ORG); });
    V.forEach((q, i) => { if (i !== k) { dot3(q, ink, 5); lab3(q, 'V' + i, ink); } });
    [[d.H, 'H'], [d.Hp, 'H′'], [d.Gd, 'G′'], [d.O, 'O'], [d.anti, 'X' + k], [d.X2, 'Y' + k]].forEach(([q, t]) => { dot3(q, sec, 4); lab3(q, t, sec); });
    return info(thm, ops + '实测：十三个点到球心的距离与半径之差，相对误差最大 ' + d.err.toExponential(1) +
      '；H 对 Σ 的幂 ÷ p = ' + d.pow.toFixed(9) + '；球半径 ' + fmt(d.rad / d.R, 2) + ' R。' +
      '<br>证明与文献检索见仓库中的《垂心四面体六条定理》（docs/垂心四面体六条定理.md）第一节。');
  }

  /* ---------- 欧拉线共轭平面（垂心四面体） ---------- */
  /* 默认四面体：挑过形状，P = O 时 V0–V3、O、G、H、P*、Pᵗ 两两相距至少 0.24 R，P* 和 Pᵗ 都在外接球附近 */
  const TRIE = [[-0.755, 0.335], [0.941, 0.686], [0.821, -0.224]], HE = 1.735;
  const areaT = (A, B, C) => S3.len(S3.cross(S3.sub(B, A), S3.sub(C, A))) / 2;
  /** 重心坐标 → 点；权重和接近 0（点在无穷远）时返回 null */
  function fromBary(V, w) {
    const s = w.reduce((a, b) => a + b);
    if (!isFinite(s) || Math.abs(s) < 1e-9 * Math.max(...w.map(Math.abs))) return null;
    return V.reduce((acc, v, i) => S3.add(acc, S3.mul(v, w[i] / s)), [0, 0, 0]);
  }
  /** 欧拉线上的点 P = H + t(O − H) 与它的等角共轭 P*、等截共轭 Pᵗ，以及过欧拉线的那张平面 */
  function eulerConj(V, t) {
    const O = circum4(V); if (!O) return null;
    const R = S3.len(S3.sub(V[0], O));
    const e = [S3.sub(V[2], V[1]), S3.sub(V[3], V[1]), S3.sub(V[2], V[0])];
    const H = solve3(e, [S3.dot(e[0], V[0]), S3.dot(e[1], V[0]), S3.dot(e[2], V[1])]); if (!H) return null;
    const G = S3.mul(V.reduce(S3.add), 0.25), u = S3.sub(O, H);
    if (S3.len(u) < 1e-6 * R) return null;                          // 正四面体：欧拉线退化成一点
    const P = S3.add(H, S3.mul(u, t));
    const l = solve3([0, 1, 2].map((i) => [V[1][i] - V[0][i], V[2][i] - V[0][i], V[3][i] - V[0][i]]), S3.sub(P, V[0])); if (!l) return null;
    const x = [1 - l[0] - l[1] - l[2], ...l];                        // P 的重心坐标
    const S = [0, 1, 2, 3].map((i) => areaT(...V.filter((_, j) => j !== i)));   // S_i：V_i 对面的面积
    const Ps = fromBary(V, x.map((xi, i) => S[i] * S[i] / xi)), Pt = fromBary(V, x.map((xi) => 1 / xi));
    // 两点到欧拉线的距离；用离得远的那个定平面，量另一个到平面的距离
    const uu = S3.mul(u, 1 / S3.len(u));
    const off = (q) => { if (!q) return null; const v = S3.sub(q, H); return S3.sub(v, S3.mul(uu, S3.dot(v, uu))); };
    const os = off(Ps), ot = off(Pt), ls = os ? S3.len(os) : -1, lt = ot ? S3.len(ot) : -1;
    const far = Math.max(ls, lt);
    let w = null, res = null;
    if (far > 1e-6 * R) {
      w = S3.mul(ls >= lt ? os : ot, 1 / far);
      const other = ls >= lt ? Pt : Ps;
      if (other) { const n = S3.cross(uu, w); res = Math.abs(S3.dot(S3.sub(other, H), n)) / R; }
    }
    return { O, R, H, G, P, Ps, Pt, uu, w, res, trivial: ls >= 0 && ls < 1e-6 * R ? 'P*' : lt >= 0 && lt < 1e-6 * R ? 'Pᵗ' : '' };
  }
  /** 欧拉线共轭平面标签的绘制；返回图下说明 */
  function drawEulerPlane(ink) {
    if (!state.tetE) state.tetE = orthoTet(TRIE, HE);
    const sec = css('--muted'), V = state.tetE;
    const d = eulerConj(V, state.tE);
    const thm = '<b>欧拉线共轭平面</b>：设 V0V1V2V3 是垂心四面体，欧拉线是过外心 O、重心 G、垂心 H 的直线（G 是 HO 的中点）。' +
      '对欧拉线上任意一点 P，它的等角共轭 P*（重心坐标 x<sub>i</sub> → S<sub>i</sub>²/x<sub>i</sub>，S<sub>i</sub> 是 V<sub>i</sub> 对面的面积）和等截共轭 Pᵗ（x<sub>i</sub> → 1/x<sub>i</sub>）' +
      '<b>与欧拉线在同一个平面上</b>。这张平面随 P 转动，不是固定的一张。';
    const ops = '<b>按住拖动可以转动整个图形</b>，双指捏合或 ⌘/Ctrl＋滚轮缩放；拖滑块让 P 沿欧拉线移动，橙色平面跟着绕欧拉线转。' +
      'P = G、P = H 时有一个共轭本身就在欧拉线上（Gᵗ = G，H* 是 H 的补点），「一条线加一个点」必然共面，是平凡情形；P = O 才是真正有内容的例子。<br>';
    if (!d) return info(thm, ops + '这个四面体接近退化，暂不绘制。换一个四面体。');
    const near = (q) => q && S3.len(S3.sub(q, d.O)) < 3 * d.R;     // 太远的共轭点不画
    fit3(V.concat([d.O, d.H], [0, 1, 2].flatMap((i) => [-1, 1].map((s) => { const q = d.O.slice(); q[i] += s * d.R; return q; }))));
    placed3 = [];
    if (state.showCircum) sphere3(d.O, d.R, C_GRY, 1.1, true);
    // 平面：在 (欧拉线方向 uu, 垂直方向 w) 坐标里取一块刚好盖住四面体和两个共轭点的矩形
    const pts = V.concat([d.O, d.H, d.P], [d.Ps, d.Pt].filter(near));
    const at = (a, b) => S3.add(d.H, S3.add(S3.mul(d.uu, a), S3.mul(d.w || [0, 0, 0], b)));
    let a0 = -0.3, a1 = 0.3, b0 = -0.3, b1 = 0.3;
    pts.forEach((q) => { const v = S3.sub(q, d.H), a = S3.dot(v, d.uu); a0 = Math.min(a0, a); a1 = Math.max(a1, a); if (d.w) { const b = S3.dot(v, d.w); b0 = Math.min(b0, b); b1 = Math.max(b1, b); } });
    a0 -= 0.25 * d.R; a1 += 0.25 * d.R; b0 -= 0.2 * d.R; b1 += 0.2 * d.R;
    if (d.w) {
      ctx.beginPath(); [[a0, b0], [a1, b0], [a1, b1], [a0, b1]].map(([a, b]) => P3(at(a, b))).forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath();
      ctx.fillStyle = 'rgba(186,117,23,0.16)'; ctx.fill(); ctx.strokeStyle = C_AMB; ctx.lineWidth = LW(0.8); ctx.stroke();
    }
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) seg3(V[i], V[j], ink, 1.4);
    seg3(at(a0, 0), at(a1, 0), C_GRN, 2.6);
    // 点与标注
    [[d.H, 'H'], [d.G, 'G'], [d.O, 'O']].forEach(([q, t]) => { dot3(q, C_GRN, 4.5); lab3(q, t, C_GRN); });
    dot3(d.P, C_BLU, 6.5); lab3(d.P, 'P', C_BLU);
    [[d.Ps, 'P*'], [d.Pt, 'Pᵗ']].forEach(([q, t]) => { if (near(q)) { dot3(q, C_ORG, 6.5); lab3(q, t, C_ORG); } });
    V.forEach((q, i) => { dot3(q, ink, 5); lab3(q, 'V' + i, ink); });
    let msg = 'P = H + t·(O − H)，t = ' + fmt(state.tE, 2) + '。';
    const gone = [[d.Ps, 'P*'], [d.Pt, 'Pᵗ']].filter(([q]) => !near(q)).map(([, t]) => t);
    if (gone.length) msg += gone.join('、') + ' 跑到了很远的地方，不在图里（P 靠近某个面所在的平面时，共轭点趋向无穷远）。';
    if (d.trivial) msg += '这时 ' + d.trivial + ' 就在欧拉线上，是平凡情形。';
    if (d.res !== null) msg += '实测：另一个共轭点到「欧拉线 + 远的那个共轭点」所定平面的距离 ' + d.res.toExponential(1) + ' R。';
    return info(thm, ops + msg + '<br>证明与文献检索见仓库中的《垂心四面体六条定理》（docs/垂心四面体六条定理.md）第二节。');
  }

  /* ---------- 主绘制 ---------- */
  function draw() {
    ctx.clearRect(0, 0, W, H); placed = [];
    const ink = css('--ink');
    if (state.tab === 'sevenpoint') { document.getElementById('info').innerHTML = drawSeven(ink); return; }
    if (state.tab === 'thirteen') { document.getElementById('info').innerHTML = drawThirteen(ink); return; }
    if (state.tab === 'eulerplane') { document.getElementById('info').innerHTML = drawEulerPlane(ink); return; }
    if (degenerate()) {
      const [A, B, C] = state.V; tri(A, B, C, ink, 1.3);
      [[A, 'A'], [B, 'B'], [C, 'C']].forEach(([p, n]) => { dot(p, ink, 5.5); lab(p, n, -16, -9); });
      document.getElementById('info').innerHTML = 'A、B、C 几乎在一条直线上（或有两点重合），三角形退化，外接圆、垂心和九点圆都不存在。把顶点拖开一些。';
      return;
    }
    const g = geo();
    placed = [[g.A, 'A'], [g.B, 'B'], [g.C, 'C']].map(([p, n]) => { const r = labPos(p, n, -16, -9); return { x: r.x, y: r.y - r.h, w: r.w, h: r.h }; });
    // 射影那四条自己画舞台（圆、两条直线、两个三角形），默认的 ABC 三角形只会添乱
    const NO_TRI = ['orthocentric', 'conic', 'pascal', 'brianchon', 'pappus', 'desargues',
                    'power', 'radical', 'monge', 'miquel'];
    if (NO_TRI.indexOf(state.tab) < 0) tri(g.A, g.B, g.C, ink, 1.3);
    const info = DRAW[state.tab](g);
    // Pascal / Brianchon 的六个点自己标了 A–F，三角形顶点再标一次 A、B、C 就成了
    // 一张图上两套 ABC；而且拖它们只是把那个圆挪一挪、缩一缩，和定理无关（要缩放
    // 有右上角的按钮）。<b>干脆不画、也不让拖。</b>
    // Pappus 不一样：拖顶点会改变两条直线的夹角，是有意义的，所以留着，但不标字母。
    if (state.tab === 'pascal' || state.tab === 'brianchon' || state.tab === 'power') {
      /* 不画手柄 */
    } else if (state.tab === 'pappus') {
      [g.A, g.B, g.C].forEach((p) => ring(p, 5.5, css('--muted'), 1.5));
    } else {
      [[g.A, 'A'], [g.B, 'B'], [g.C, 'C']].forEach(([p, n]) => { dot(p, ink, 5.5); lab(p, n, -16, -9); });
    }
    document.getElementById('info').innerHTML = info;
  }

  /* ---------- 控件 ---------- */
  const tabsEl = document.getElementById('tabs'), optsEl = document.getElementById('opts'), legendEl = document.getElementById('legend');
  function chip(text, pressed, onClick) {
    const b = document.createElement('button'); b.className = 'chip'; b.type = 'button';
    b.textContent = text; b.setAttribute('aria-pressed', pressed ? 'true' : 'false'); b.onclick = onClick; return b;
  }
  function renderTabs() {
    const i = Math.max(0, tabIndex(state.tab));
    const [, name, num] = TABS[i] || ['', '', ''];
    tabsEl.innerHTML = '';
    tabsEl.className = 'navbar';

    const left = document.createElement('div'); left.className = 'navname';
    if (num) { const k = document.createElement('i'); k.className = 'navnum'; k.textContent = num; left.appendChild(k); }
    left.appendChild(document.createTextNode(name));

    const right = document.createElement('div'); right.className = 'navpos';
    const count = document.createElement('span');
    count.className = 'navcount'; count.textContent = (i + 1) + ' / ' + TABS.length;

    const prev = document.createElement('button');
    prev.type = 'button'; prev.className = 'navarrow'; prev.textContent = '\u2039';
    prev.title = '上一条'; prev.onclick = () => step(-1);

    const dots = document.createElement('div'); dots.className = 'navdots';
    TABS.forEach(([id, nm], j) => {
      const d = document.createElement('button');
      d.type = 'button'; d.className = 'navdot' + (j === i ? ' on' : '');
      d.title = nm; d.setAttribute('aria-label', nm);
      d.onclick = () => setTab(id, true);
      dots.appendChild(d);
    });

    const next = document.createElement('button');
    next.type = 'button'; next.className = 'navarrow'; next.textContent = '\u203a';
    next.title = '下一条'; next.onclick = () => step(1);

    right.append(count, prev, dots, next);
    tabsEl.append(left, right);
  }
  function step(d) {
    const n = TABS.length, i = Math.max(0, tabIndex(state.tab));
    setTab(TABS[(i + d + n) % n][0], true);
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
    if (state.tab === 'menelaus') {
      const l = document.createElement('label');
      l.style.cssText = 'display:flex;align-items:center;gap:8px;flex:1;min-width:240px';
      const sl = document.createElement('input');
      sl.type = 'range'; sl.min = 1.10; sl.max = 1.34; sl.step = 0.005;
      sl.value = state.mw === undefined ? 1.16 : state.mw; sl.style.flex = '1';
      sl.setAttribute('aria-label', '横截线的位置');
      sl.oninput = () => { state.mw = +sl.value; draw(); };
      l.append('移动横截线', sl); optsEl.appendChild(l);
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
    if (state.tab === 'eulerplane') {
      [['P = H', 0], ['P = G', 0.5], ['P = O', 1]].forEach(([n, t]) => optsEl.appendChild(chip(n, Math.abs(state.tE - t) < 1e-9, () => { state.tE = t; renderOpts(); draw(); })));
      const l = document.createElement('label'); l.style.cssText = 'display:flex;align-items:center;gap:8px;flex:1;min-width:220px';
      const s = document.createElement('input'); s.type = 'range'; s.min = -0.5; s.max = 2; s.step = 0.005; s.value = state.tE; s.style.flex = '1';
      s.setAttribute('aria-label', 'P 在欧拉线上的位置 t');
      const out = document.createElement('span'); out.style.minWidth = '64px'; out.textContent = 't = ' + fmt(state.tE, 2);
      s.oninput = () => {
        let t = +s.value; const tg = [0, 0.5, 1].find((v) => Math.abs(t - v) < 0.02);
        if (tg !== undefined) { t = tg; s.value = tg; }
        state.tE = t; out.textContent = 't = ' + fmt(t, 2);
        optsEl.querySelectorAll('.chip').forEach((b, i) => { if (i < 3) b.setAttribute('aria-pressed', t === [0, 0.5, 1][i] ? 'true' : 'false'); });
        draw();
      };
      l.append('P 的位置', s, out); optsEl.appendChild(l);
      optsEl.appendChild(chip('换一个垂心四面体', false, () => {
        for (let tries = 0; tries < 300; tries++) {
          const tri = [0, 1, 2].map(() => [Math.random() * 2 - 1, Math.random() * 2 - 1]);
          const V = orthoTet(tri, (0.3 + Math.random() * 1.7) * (Math.random() < 0.5 ? 1 : -1));
          if (!V) continue;
          if (Math.abs(S3.dot(S3.sub(V[1], V[0]), S3.cross(S3.sub(V[2], V[0]), S3.sub(V[3], V[0])))) / 6 < 0.15) continue;   // 别太扁（R = 1）
          const d0 = eulerConj(V, 1);
          if (!d0 || S3.len(S3.sub(d0.O, d0.H)) < 0.4) continue;                                    // 欧拉线别太短
          if (!d0.Ps || !d0.Pt || S3.len(d0.Ps) > 1.6 || S3.len(d0.Pt) > 1.6) continue;             // P = O 时两个共轭点别跑太远
          state.tetE = V; break;
        }
        draw();
      }));
      optsEl.appendChild(chip('回到默认', false, () => { state.tetE = orthoTet(TRIE, HE); state.tE = 1; state.rotE = { yaw: -1.67, pitch: -0.19 }; base3.key = ''; renderOpts(); setZoom(1); }));
      const c = document.createElement('input'), lc = document.createElement('label'); lc.className = 'ck';
      c.type = 'checkbox'; c.checked = state.showCircum;
      c.onchange = () => { state.showCircum = c.checked; draw(); };
      lc.append(c, '显示外接球'); optsEl.appendChild(lc);
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
    LEG[state.tab].forEach(([c, n]) => { const s = document.createElement('span'); s.innerHTML = '<i style="background:' + col(c) + '"></i>' + n; legendEl.appendChild(s); });
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
  const draggablePoint = () => ['simson', 'homothety', 'conic', 'poncelet', 'ceva', 'fermat', 'desargues', 'power'].includes(state.tab);
  /** 拖六个点中的一个：沿圆滑动 */
  function moveHex(i, p) {
    const w = Wd(p), g = geo();
    pjAngles()[i] = Math.atan2(w.y - g.O.y, w.x - g.O.x);
    draw();
  }
  /** 拖 Pappus 的六个点中的一个：投影到自己那条直线上 */
  function movePap(which, i, p) {
    const w = Wd(p), g = geo(), pp = papParams();
    const U = g.A, V2 = which === 'a' ? g.B : g.C, d = sub(V2, U), L2 = d.x * d.x + d.y * d.y;
    if (L2 < 1e-12) return;
    const t = ((w.x - U.x) * d.x + (w.y - U.y) * d.y) / L2;
    pp[which][i] = Math.max(0.10, Math.min(1.75, t));   // 别滑到 A 的另一侧，也别跑出画框
    draw();
  }
  function movePoint(p) {
    const w = Wd(p), g = geo();
    if (state.tab === 'simson' || state.tab === 'homothety')
      state.theta = Math.atan2(w.y - g.O.y, w.x - g.O.x);
    else if (state.tab === 'conic') state.P = state.onCircle ? onCircumcircle(w, g) : w;
    else if (state.tab === 'poncelet' || state.tab === 'ceva' || state.tab === 'fermat') state.P = w;
    else if (state.tab === 'desargues') state.Pdes = w;
    else if (state.tab === 'power') state.Ppow = w;
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
    // 先看有没有抓到「图上的点」—— 它们才是定理的主角，优先级高于三角形顶点
    if (state.tab === 'pascal' || state.tab === 'brianchon') {
      const h = pjHit(geo(), p);
      if (h >= 0) { drag = { hex: h }; cv.setPointerCapture(e.pointerId); return; }
      return;                       // 这两条只有那六个点能拖，别让人误拖到看不见的三角形
    }
    if (state.tab === 'pappus') {
      const h = papHit(geo(), p);
      if (h) { drag = { pap: h }; cv.setPointerCapture(e.pointerId); return; }
    }
    if (state.tab === 'power') {                 // 圆上套圈的那个点：拖它让割线绕 P 转
      const g0 = geo();
      const Q = { x: g0.O.x + g0.R * Math.cos(state.thPow === undefined ? 2.25 : state.thPow),
                  y: g0.O.y + g0.R * Math.sin(state.thPow === undefined ? 2.25 : state.thPow) };
      const z = S(Q);
      if (Math.hypot(z.x - p.x, z.y - p.y) < HIT()) { drag = { thp: true }; cv.setPointerCapture(e.pointerId); return; }
    }
    if (state.tab === 'miquel') {
      const g0 = geo(), c = miquelCfg(g0);
      if (c) {
        const zx = S(c.X), zy = S(c.Y);
        if (Math.hypot(zx.x - p.x, zx.y - p.y) < HIT()) { drag = { miq: 'x' }; cv.setPointerCapture(e.pointerId); return; }
        if (Math.hypot(zy.x - p.x, zy.y - p.y) < HIT()) { drag = { miq: 'y' }; cv.setPointerCapture(e.pointerId); return; }
      }
    }
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
    if (drag.hex !== undefined) { moveHex(drag.hex, p); return; }
    if (drag.thp) { const w = Wd(p), g0 = geo();
      state.thPow = Math.atan2(w.y - g0.O.y, w.x - g0.O.x); draw(); return; }
    if (drag.miq) { const w = Wd(p), g0 = geo(), m = miqParams();
      const U = g0.A, V2 = drag.miq === 'x' ? g0.B : g0.C, d = sub(V2, U);
      const L2 = d.x * d.x + d.y * d.y;
      if (L2 > 1e-12) m[drag.miq] = Math.max(0.15, Math.min(1.75, ((w.x - U.x) * d.x + (w.y - U.y) * d.y) / L2));
      draw(); return; }
    if (drag.pap) { movePap(drag.pap[0], drag.pap[1], p); return; }
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
   * 数据取自 window.ATLAS（data/atlas.js），不发任何请求。 */
  function renderRelated() {
    const el = document.getElementById('related'), A = window.ATLAS;
    if (!el || !A) { if (el) el.hidden = true; return; }
    const hit = A.theorems.filter((t) => (t.demo || '').endsWith('#' + state.tab));
    if (!hit.length) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = '图谱里对应的定理：' + hit.map((t) =>
      '<a href="../index.html#' + t.family + '">' + t.id + ' ' + t.name + '</a>').join('，');
  }

  window.addEventListener('hashchange', () => setTab(location.hash.slice(1), false));
  window.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  let lastW = W;
  const onResize = () => { const w = Math.round(cv.clientWidth); if (w && w !== lastW) { lastW = w; resizeCanvas(); fit(); draw(); } };
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(cv.parentElement); else window.addEventListener('resize', onResize);

  fit();
  setTab(location.hash.slice(1) || TABS[0][0], false);
})();
