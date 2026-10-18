/* Geometry Atlas · 专题页「九点圆和它的邻居」
 * 依赖 geometry.js（window.GA）。
 * 每个标签页有锚点：#euler #homothety #feuerbach #simson #orthocentric #hyperbola */
(function () {
  const { sub, add, mul, mid, len, foot, ninePoints, orthocenter, triangleData,
    lineCoeffs, lineProduct, evalConic, conicCenter, asymptoteSlopes, traceImplicit } = window.GA;

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
    ['orthocentric', '九点圆'], ['euler', '欧拉线'], ['homothety', '外接圆位似'],
    ['feuerbach', 'Feuerbach 相切'], ['simson', '西摩松线'], ['hyperbola', '等轴双曲线'],
  ];
  const LEG = {
    euler: [[BL, '中垂线 → O'], [TE, '中线 → G'], [PK, '高 → H'], [CO, '欧拉线'], [PU, '九点圆']],
    homothety: [[GR, '外接圆与射线'], [AM, '缩放后的圆'], [PU, '九点圆']],
    feuerbach: [[TE, '角平分线、内切圆、旁切圆'], [CO, '直线 NI 与切点'], [PU, '九点圆']],
    simson: [[TE, '西摩松线'], [AM, '线段 PH'], [PU, '九点圆']],
    orthocentric: [[TE, '当前三角形'], [PK, '它的三条高'], [CO, '它的 9 个点'], [PU, '九点圆']],
    hyperbola: [[AM, '等轴双曲线与渐近线'], [CO, '中心及其轨迹'], [PU, '九点圆']],
  };

  const state = {
    tab: TABS[0][0],
    V: [{ x: -2.0, y: 1.2 }, { x: 2.2, y: 1.2 }, { x: -1.0, y: -1.5 }],
    show: { pb: true, md: true, al: true },
    k: 1, center: 'H', theta: -0.6, tri: 0, Q: null, trail: [],
  };
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
  function fit() {
    let pts = state.V;
    if (!degenerate()) {
      const g = geo();
      pts = [g.A, g.B, g.C, g.H, { x: g.O.x - g.R, y: g.O.y - g.R }, { x: g.O.x + g.R, y: g.O.y + g.R }];
    }
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    if (!(x1 - x0 > 1e-9 || y1 - y0 > 1e-9)) return;
    const s = Math.min((W - 80 * K) / Math.max(x1 - x0, 1e-9), (H - 60 * K) / Math.max(y1 - y0, 1e-9));
    view = { s, ox: W / 2 - s * (x0 + x1) / 2, oy: H / 2 - s * (y0 + y1) / 2 };
  }

  /* ---------- 画图小工具 ---------- */
  function circle(c, r, col, w, dash) { const p = S(c); ctx.beginPath(); ctx.setLineDash(DASH(dash)); ctx.arc(p.x, p.y, Math.abs(r) * view.s, 0, 7); ctx.strokeStyle = col; ctx.lineWidth = LW(w); ctx.stroke(); ctx.setLineDash([]); }
  function seg(P, R, col, w, dash) { const p = S(P), q = S(R); ctx.beginPath(); ctx.setLineDash(DASH(dash)); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = col; ctx.lineWidth = LW(w); ctx.stroke(); ctx.setLineDash([]); }
  function lineInf(P, R, col, w, dash) { const d = sub(R, P), L = len(d); if (L < 1e-9) return; seg(sub(P, mul(d, 50 / L)), add(R, mul(d, 50 / L)), col, w, dash); }
  function dot(P, col, r) { const p = S(P); ctx.beginPath(); ctx.arc(p.x, p.y, PR(r), 0, 7); ctx.fillStyle = col; ctx.fill(); }
  /** 文字标注：默认放在点的 (dx, dy) 处；右边或下边放不下时改放到左侧或上方，再夹在画布内 */
  function lab(P, txt, dx, dy) {
    const p = S(P), fs = FS(), ox = OFF(dx), oy = OFF(dy), pad = 4;
    ctx.font = '500 ' + fs + 'px sans-serif';
    const w = ctx.measureText(txt).width;
    let x = p.x + ox, y = p.y + oy;
    if (x + w > W - pad) x = p.x - Math.abs(ox) - w;
    if (x < pad) x = p.x + Math.abs(ox);
    if (y > H - pad) y = p.y - Math.abs(oy);
    if (y - fs < pad) y = p.y + Math.abs(oy) + fs * 0.8;
    x = Math.min(Math.max(x, pad), W - pad - w); y = Math.min(Math.max(y, fs + pad / 2), H - pad);
    ctx.fillStyle = css('--ink'); ctx.fillText(txt, x, y);
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
      return '三条中垂线交于外心 O，三条中线交于重心 G，三条高交于垂心 H。O、G、H 在一条线上（欧拉线），九点圆圆心 N 是 OH 的中点。' +
        '<br><span class="note">' + (same ? '三角形接近等边：O、G、H、N 几乎重合，欧拉线不再确定。' :
          '实测：ON = ' + fmt(len(sub(g.N, g.O))) + '，NH = ' + fmt(len(sub(g.H, g.N))) + '；OG : GH = 1 : ' + fmt(len(sub(g.H, g.G)) / len(sub(g.G, g.O))) + '。') + '</span>';
    },
    homothety(g) {
      const Cn = state.center === 'H' ? g.H : g.G, cn = state.center, k = state.k, target = cn === 'H' ? 0.5 : -0.5;
      circle(g.O, g.R, GR, 1.2, [5, 4]); circle(g.N, g.r9, PU, 2.2);
      const img = (X) => add(Cn, mul(sub(X, Cn), k));
      for (let i = 0; i < 16; i++) {
        const t = i / 16 * 2 * Math.PI, X = { x: g.O.x + g.R * Math.cos(t), y: g.O.y + g.R * Math.sin(t) };
        seg(Cn, X, GR, 0.5, [2, 3]); dot(X, GR, 2.5); dot(img(X), AM, 3);
      }
      [g.A, g.B, g.C].forEach((X) => { seg(Cn, X, GR, 0.9); dot(img(X), AM, 4.5); });
      const P = { x: g.O.x + g.R * Math.cos(state.theta), y: g.O.y + g.R * Math.sin(state.theta) }, Pi = img(P);
      seg(Cn, P, AM, 1.4); dot(P, AM, 6.5); lab(P, 'P（拖我）', 9, -9); dot(Pi, CO, 6.5); lab(Pi, 'P′', 9, 14);
      const Oi = img(g.O); circle(Oi, g.R * k, AM, 2); seg(Cn, g.O, BL, 1, [3, 3]); dot(g.O, BL, 5); lab(g.O, 'O', 8, -8); dot(Oi, AM, 4.5);
      dot(Cn, PK, 6); lab(Cn, cn, 8, -8);
      const hit = Math.abs(k - target) < 0.006;
      if (hit) { dot(g.N, PU, 5); lab(g.N, 'N', 8, 14); }
      let s = '<b>位似</b>就是以一个点为中心，按同一个比例把整个图放大或缩小：每个点 X 沿着从中心出发、经过 X 的射线移动，新位置 X′ 到中心的距离 = k × 原来的距离（k 为负时，X′ 跑到中心的另一侧）。' +
        '<br><span class="note">现在中心是 ' + cn + '，k = ' + fmt(k) + '。以 P 为例：' + cn + 'P = ' + fmt(len(sub(P, Cn))) + '，' + cn + 'P′ = ' + fmt(len(sub(Pi, Cn))) +
        '。灰色是外接圆上 16 个样点，琥珀色是它们的像，连起来就是缩放后的圆。</span><br>';
      s += hit ? '<b style="color:' + PU + '">此时 k = ' + target + '：外接圆上每个点的像都正好落在九点圆上，缩放后的圆和九点圆重合；圆心 O 被送到九点圆圆心 N，半径从 R 变成 R/2。' +
        (cn === 'H' ? 'A、B、C 的像是 AH、BH、CH 的中点，P 的像就是 PH 的中点。' : 'A、B、C 的像是三边的中点。') + '</b>'
        : '把滑块拖到 k = ' + target + '，看缩放后的圆会变成什么。';
      return s;
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
      return '三条角平分线交于内心 I。九点圆与内切圆相切，切点 T 在直线 NI 上，且 NI = R/2 − r（R 为外接圆半径，r 为内切圆半径）。三个旁切圆（虚线，可能伸出画面）也与九点圆相切。' +
        '<br><span class="note">' + (same ? '等边三角形中九点圆与内切圆重合（N 与 I 重合，r = R/2），切点不再唯一，所以不画直线 NI 和切点 T。' :
          '实测：NI = ' + fmt(len(sub(g.I, g.N)), 3) + '，R/2 − r = ' + fmt(g.r9 - g.r, 3) + '。') + '</span>';
    },
    simson(g) {
      const sec = css('--muted');
      sides(g, sec); circle(g.O, g.R, sec, 1, [5, 4]); circle(g.N, g.r9, PU, 2.6);
      const P = { x: g.O.x + g.R * Math.cos(state.theta), y: g.O.y + g.R * Math.sin(state.theta) };
      const f = [foot(P, g.B, g.C), foot(P, g.C, g.A), foot(P, g.A, g.B)];
      f.forEach((q) => { seg(P, q, sec, 0.8); dot(q, TE, 4.5); });
      const pr = [[0, 1], [1, 2], [0, 2]].reduce((b, ij) => len(sub(f[ij[0]], f[ij[1]])) > len(sub(f[b[0]], f[b[1]])) ? ij : b);
      lineInf(f[pr[0]], f[pr[1]], TE, 1.8);
      seg(P, g.H, AM, 1.6); const M = mid(P, g.H);
      dot(M, CO, 6.5); dot(P, AM, 7); dot(g.H, PK, 5); lab(P, 'P（拖我）', 9, -9); lab(g.H, 'H', 8, -8); lab(M, 'M', 8, 14);
      return '在画面上拖动（顶点以外的地方），P 沿外接圆移动。P 到三边的三个垂足共线（西摩松线），这条线平分 PH，中点 M 始终在九点圆上。' +
        '<br><span class="note">M 在九点圆上，是因为以 H 为中心缩小一半把外接圆变成九点圆（见「外接圆位似」）；西摩松线经过 M，可以用复数直接算出来。</span>';
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
      return '三角形三边的中点、三条高的垂足、三个顶点到垂心连线的中点，这九个点在同一个圆上，叫做九点圆。' +
        '<br>用上面的按钮切换三角形：A、B、C、H 中任取三点组成的四个三角形，每个的垂心正好是剩下的那个点，它们的九点圆是同一个。' +
        (flat ? '<br><span class="note">现在是直角三角形，垂心 H 落在直角顶点上，这个三角形退化成一条线段，没有高和九点，只画出三边。</span>' : '');
    },
    hyperbola(g) {
      circle(g.N, g.r9, PU, 2.6);
      [g.A, g.B, g.C].forEach((P) => seg(P, foot(P, ...[g.A, g.B, g.C].filter((x) => x !== P)), PK, 0.8, [3, 3]));
      if (!state.Q) state.Q = { x: g.O.x + g.R * 1.15, y: g.O.y - 0.2 };
      const hv = [g.A, g.B, g.C].some((V) => near(V, g.H, g));
      const qv = [g.A, g.B, g.C, g.H].some((V) => len(sub(S(V), S(state.Q))) < 2);
      if (hv || qv) {
        dot(state.Q, AM, 7); lab(state.Q, 'Q（拖我）', 9, -9); dot(g.H, PK, 5); lab(g.H, 'H', 8, -8);
        return hv ? '现在是直角三角形，垂心 H 落在直角顶点上，A、B、C、H 只剩三个不同的点，过它们和 Q 的二次曲线不唯一，所以不画双曲线。把顶点拖开一些。'
          : 'Q 与 A、B、C、H 之一重合，五个点只剩四个，确定不了唯一的二次曲线，所以暂不画双曲线。把 Q 拖开一点。';
      }
      const q1 = lineProduct(lineCoeffs(g.A, g.B), lineCoeffs(g.C, g.H));
      const q2 = lineProduct(lineCoeffs(g.A, g.C), lineCoeffs(g.B, g.H));
      const ph = Math.atan2(-evalConic(q1, state.Q), evalConic(q2, state.Q));
      const co = q1.map((v, j) => Math.cos(ph) * v + Math.sin(ph) * q2[j]);
      ctx.strokeStyle = AM; ctx.lineWidth = LW(2);
      traceImplicit(ctx, (sx, sy) => evalConic(co, Wd({ x: sx, y: sy })), W, H, 4);
      const cen = conicCenter(co);
      if (cen && isFinite(cen.x) && isFinite(cen.y)) {
        asymptoteSlopes(co).forEach((m) => lineInf(cen, { x: cen.x + 1, y: cen.y + m }, AM, 0.8, [4, 4]));
        state.trail.push(cen); if (state.trail.length > 800) state.trail.shift();
        const ts = Math.max(2.4, 2.4 * K);
        ctx.fillStyle = CO; state.trail.forEach((p) => { const s = S(p); ctx.fillRect(s.x - ts / 2, s.y - ts / 2, ts, ts); });
        dot(cen, CO, 6);
      }
      dot(state.Q, AM, 7); lab(state.Q, 'Q（拖我）', 9, -9); dot(g.H, PK, 5); lab(g.H, 'H', 8, -8);
      return '在画面上拖动（顶点以外的地方）点 Q：过 A、B、C、H、Q 五点的二次曲线总是等轴双曲线（两条渐近线垂直），它的中心总在九点圆上。拖多了，橙色轨迹会描出九点圆。';
    },
  };

  /* ---------- 主绘制 ---------- */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const ink = css('--ink');
    if (degenerate()) {
      const [A, B, C] = state.V; tri(A, B, C, ink, 1.3);
      [[A, 'A'], [B, 'B'], [C, 'C']].forEach(([p, n]) => { dot(p, ink, 5.5); lab(p, n, -16, -9); });
      document.getElementById('info').innerHTML = 'A、B、C 几乎在一条直线上（或有两点重合），三角形退化，外接圆、垂心和九点圆都不存在。把顶点拖开一些。';
      return;
    }
    const g = geo();
    if (state.tab !== 'orthocentric') tri(g.A, g.B, g.C, ink, 1.3);
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
    if (state.tab === 'hyperbola') optsEl.appendChild(chip('清除轨迹', false, () => { state.trail = []; draw(); }));
    legendEl.innerHTML = '';
    LEG[state.tab].forEach(([c, n]) => { const s = document.createElement('span'); s.innerHTML = '<i style="background:' + c + '"></i>' + n; legendEl.appendChild(s); });
  }
  function setTab(id, pushHash) {
    if (!DRAW[id]) id = TABS[0][0];
    state.tab = id; state.trail = []; if (id === 'homothety') state.k = 1;
    if (pushHash && location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    renderTabs(); renderOpts(); renderRelated(); draw();
  }

  /* ---------- 拖动 ---------- */
  let drag = null;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
  const draggablePoint = () => ['simson', 'homothety', 'hyperbola'].includes(state.tab);
  function movePoint(p) {
    const w = Wd(p), g = geo();
    if (state.tab === 'simson' || state.tab === 'homothety') state.theta = Math.atan2(w.y - g.O.y, w.x - g.O.x);
    else if (state.tab === 'hyperbola') state.Q = w;
    draw();
  }
  cv.addEventListener('pointerdown', (e) => {
    const p = pos(e); let vi = -1;
    state.V.forEach((v, i) => { const s = S(v); if (Math.hypot(s.x - p.x, s.y - p.y) < HIT()) vi = i; });
    if (vi >= 0) drag = { v: vi };
    else if (draggablePoint()) { drag = { pt: true }; movePoint(p); }
    else return;
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return; const p = pos(e);
    if (drag.pt) movePoint(p); else { state.V[drag.v] = Wd(p); state.trail = []; draw(); }
  });
  cv.addEventListener('pointerup', () => { if (drag && drag.v !== undefined) { fit(); draw(); } drag = null; });

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
