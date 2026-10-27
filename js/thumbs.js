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
  const APEX = { x: 102, y: -20 };                 // 等边位置（y 向下，所以更高）
  const verts = (k) => ({
    A: { x: BASE.A.x + (APEX.x - BASE.A.x) * k, y: BASE.A.y + (APEX.y - BASE.A.y) * k },
    B: BASE.B, C: BASE.C,
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
    // 位似：外接圆被送到九点圆
    N03: (g) => [tri(g.A, g.B, g.C), circle(g.circum, 'aux'), circle(g.nine, 'hi'),
                 line(g.A, g.T.G, 'thin'), line(g.B, g.T.G, 'thin'), line(g.C, g.T.G, 'thin'),
                 dot(g.T.G, 'key')],
    // Feuerbach：九点圆与内切圆相切
    N04: (g) => {
      const d = sub(g.incir, g.nine), L = len(d) || 1;
      const F = add(g.nine, mul(d, g.nine.r / L));
      return [tri(g.A, g.B, g.C), circle(g.nine, 'alt'), circle(g.incir, 'hi'), dot(F, 'key')];
    },
    // 西姆松线：外接圆上一点的三个投影共线
    N05: (g) => {
      const th = 250 * Math.PI / 180;
      const P = { x: g.circum.x + g.circum.r * Math.cos(th), y: g.circum.y + g.circum.r * Math.sin(th) };
      const F1 = foot(P, g.B, g.C), F2 = foot(P, g.C, g.A), F3 = foot(P, g.A, g.B);
      const [p, q] = long(F2, F3, 90);
      return [circle(g.circum, 'aux'), tri(g.A, g.B, g.C),
              line(P, F1, 'thin'), line(P, F2, 'thin'), line(P, F3, 'thin'),
              line(p, q, 'hi'),
              dot(F1, 'key'), dot(F2, 'key'), dot(F3, 'key'), dot(P)];
    },
    // 垂心组：四个点共享同一个九点圆
    N07: (g) => [circle(g.nine, 'hi'),
                 tri(g.A, g.B, g.C),
                 tri(g.A, g.B, g.T.H, 'tri dim'), tri(g.B, g.C, g.T.H, 'tri dim'),
                 tri(g.C, g.A, g.T.H, 'tri dim'),
                 dot(g.A), dot(g.B), dot(g.C), dot(g.T.H, 'key')],
    // 九点二次曲线：仿射推广
    N08: (g) => {
      const P = { x: g.T.G.x + 22, y: g.T.G.y - 6 };     // 一般的第四点，才得到真正的椭圆
      const pts = [mid(g.A, g.B), mid(g.B, g.C), mid(g.C, g.A), mid(g.A, P), mid(g.B, P)];
      const el = conicEllipse(conicThrough(pts));
      const out = [tri(g.A, g.B, g.C, 'tri dim'),
                   line(g.A, P, 'thin'), line(g.B, P, 'thin'), line(g.C, P, 'thin')];
      if (el) out.push(ellipse(el, 'hi'));
      return out.concat([mid(g.A, g.B), mid(g.B, g.C), mid(g.C, g.A),
                         mid(g.A, P), mid(g.B, P), mid(g.C, P)].map((p) => dot(p, 'key')));
    },
    // Nagel 线：I、G、Na 共线
    N09: (g) => {
      const n = nagelData(g.A, g.B, g.C);
      const [p, q] = long(n.I, n.Na);
      return [tri(g.A, g.B, g.C), circle(g.incir, 'aux'),
              line(p, q, 'hi'), dot(n.I, 'key'), dot(n.G, 'key'), dot(n.Na, 'key')];
    },
    // Soddy：三个顶点圆两两外切
    K07: (g) => {
      const s = soddyData(g.A, g.B, g.C), V = [g.A, g.B, g.C];
      const out = [tri(g.A, g.B, g.C, 'tri dim')];
      s.radii.forEach((r, i) => out.push(circle({ x: V[i].x, y: V[i].y, r }, 'alt')));
      if (s.S1 && s.r1 > 0) out.push(circle({ x: s.S1.x, y: s.S1.y, r: s.r1 }, 'hi'));
      return out.concat(V.map((p) => dot(p)));
    },
    // Mandart 内切椭圆：过三个旁切点
    B04: (g) => {
      const n = nagelData(g.A, g.B, g.C), U = [n.Ua, n.Ub, n.Uc];
      const el = conicEllipse(conicThrough([U[0], U[1], U[2], mid(U[0], U[1]), mid(U[1], U[2])]));
      const out = [tri(g.A, g.B, g.C)];
      if (el) out.push(ellipse(el, 'hi'));
      return out.concat(U.map((p) => dot(p, 'key')));
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

  const body = (id, k) =>
    DRAW[id](geom(k)).map((s, i) => s.replace('class="', `style="--i:${i}" class="`)).join('');

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
