/* 几何图谱 · 卡片缩略图与首屏大图
 * 每张图都是现场算出来的 SVG，不是图片；线条用 stroke-dashoffset 自己画出来。
 * 依赖 geometry.js（window.GA）。 */
(function () {
  const GA = window.GA;
  const { sub, add, mul, mid, len, foot, circumcircle, orthocenter,
          triangleData, ninePoints, nagelData, soddyData,
          conicThrough, conicCenter, intersect } = GA;

  const W = 200, H = 140;                      // 缩略图坐标系
  const A = { x: 26, y: 116 }, B = { x: 176, y: 116 }, C = { x: 116, y: 26 };

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

  /** 把直线 PQ 延长到画布外，用来画欧拉线这类「一条线」 */
  function long(P, Q, k) {
    const d = sub(Q, P), L = len(d) || 1, u = mul(d, (k || 240) / L);
    return [sub(mid(P, Q), u), add(mid(P, Q), u)];
  }

  /** 二次曲线系数 → SVG 椭圆参数；不是椭圆时返回 null */
  function conicEllipse(co) {
    const [a, b, c, d, e, g] = co;                 // ax²+bxy+cy²+dx+ey+g
    if (b * b - 4 * a * c >= 0) return null;       // 不是椭圆
    const ctr = conicCenter(co);
    if (!ctr) return null;
    // 平移到中心后的常数项
    const g2 = g + (d * ctr.x + e * ctr.y) / 2;
    const m = [[a, b / 2], [b / 2, c]];
    const tr = m[0][0] + m[1][1], dt = m[0][0] * m[1][1] - m[0][1] * m[1][0];
    const disc = Math.sqrt(Math.max(tr * tr / 4 - dt, 0));
    const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
    if (l1 * g2 >= 0 || l2 * g2 >= 0) return null;
    const rx = Math.sqrt(-g2 / l1), ry = Math.sqrt(-g2 / l2);
    const ang = 0.5 * Math.atan2(b, a - c) * 180 / Math.PI;
    return { cx: ctr.x, cy: ctr.y, rx, ry, ang };
  }
  const ellipse = (el, cls) =>
    `<ellipse class="${cls}" cx="${f(el.cx)}" cy="${f(el.cy)}" rx="${f(el.rx)}" ry="${f(el.ry)}"` +
    ` transform="rotate(${f(el.ang)} ${f(el.cx)} ${f(el.cy)})"/>`;

  /* ---------- 每条定理画什么 ---------- */
  const T = triangleData(A, B, C);
  const NP = ninePoints(A, B, C);
  const nine = { x: T.N.x, y: T.N.y, r: T.r9 };
  const circum = { x: T.O.x, y: T.O.y, r: T.R };
  const incir = { x: T.I.x, y: T.I.y, r: T.r };

  const DRAW = {
    // 欧拉线：O、G、H 共线
    N01: () => {
      const [p, q] = long(T.O, T.H, 115);
      return [tri(A, B, C), circle(circum, 'aux'),
              line(p, q, 'hi'),
              dot(T.O), dot(T.G), dot(T.H, 'key')];
    },

    // 九点圆：九个点共圆
    N02: () => [tri(A, B, C), circle(nine, 'hi'),
                ...NP.map((p) => dot(p, 'key'))],

    // 位似：外接圆被送到九点圆
    N03: () => [tri(A, B, C), circle(circum, 'aux'), circle(nine, 'hi'),
                line(A, T.G, 'thin'), line(B, T.G, 'thin'), line(C, T.G, 'thin'),
                dot(T.G, 'key')],

    // Feuerbach：九点圆与内切圆相切
    N04: () => {
      const d = sub(incir, nine), L = len(d) || 1;
      const F = add(nine, mul(d, nine.r / L));     // 内切时的切点
      return [tri(A, B, C), circle(nine, 'alt'), circle(incir, 'hi'), dot(F, 'key')];
    },

    // 西姆松线：外接圆上一点的三个投影共线
    N05: () => {
      const th = 250 * Math.PI / 180;            // 这个位置三个垂足分得最开
      const P = { x: circum.x + circum.r * Math.cos(th), y: circum.y + circum.r * Math.sin(th) };
      const F1 = foot(P, B, C), F2 = foot(P, C, A), F3 = foot(P, A, B);
      const [p, q] = long(F2, F3, 90);
      return [circle(circum, 'aux'), tri(A, B, C),
              line(P, F1, 'thin'), line(P, F2, 'thin'), line(P, F3, 'thin'),
              line(p, q, 'hi'),
              dot(F1, 'key'), dot(F2, 'key'), dot(F3, 'key'), dot(P)];
    },

    // 垂心组：四个点共享同一个九点圆
    N07: () => [circle(nine, 'hi'),
                tri(A, B, C), tri(A, B, T.H, 'tri dim'), tri(B, C, T.H, 'tri dim'), tri(C, A, T.H, 'tri dim'),
                dot(A), dot(B), dot(C), dot(T.H, 'key')],

    // 九点二次曲线：仿射观点下圆变成二次曲线
    N08: () => {
      const P = { x: 140, y: 90 };                    // 完全四点形 A B C P：一般点才给出真正的椭圆
      const pts = [mid(A, B), mid(B, C), mid(C, A), mid(A, P), mid(B, P)];
      const el = conicEllipse(conicThrough(pts));
      const out = [tri(A, B, C, 'tri dim'),
                   line(A, P, 'thin'), line(B, P, 'thin'), line(C, P, 'thin')];
      if (el) out.push(ellipse(el, 'hi'));
      return out.concat([mid(A, B), mid(B, C), mid(C, A), mid(A, P), mid(B, P), mid(C, P)]
        .map((p) => dot(p, 'key')));
    },

    // Nagel 线：I、G、Na 共线
    N09: () => {
      const n = nagelData(A, B, C);
      const [p, q] = long(n.I, n.Na, 115);
      return [tri(A, B, C), circle(incir, 'aux'),
              line(p, q, 'hi'),
              dot(n.I), dot(n.G), dot(n.Na, 'key')];
    },

    // Soddy：三个顶点圆两两外切
    K07: () => {
      const s = soddyData(A, B, C);
      const V = [A, B, C];
      const out = [tri(A, B, C, 'tri dim')];
      s.radii.forEach((r, i) => out.push(circle({ x: V[i].x, y: V[i].y, r }, 'alt')));
      if (s.S1 && s.r1 > 0) out.push(circle({ x: s.S1.x, y: s.S1.y, r: s.r1 }, 'hi'));
      return out.concat(V.map((p) => dot(p)));
    },

    // Mandart 内切椭圆：过三个旁切点
    B04: () => {
      const n = nagelData(A, B, C);
      const U = [n.Ua, n.Ub, n.Uc];
      const el = conicEllipse(conicThrough([U[0], U[1], U[2], mid(U[0], U[1]), mid(U[1], U[2])]));
      const out = [tri(A, B, C)];
      if (el) out.push(ellipse(el, 'hi'));
      return out.concat(U.map((p) => dot(p, 'key')));
    },

    // Poncelet 闭合：两个圆之间的三角形转一圈还闭合
    I03: () => {
      const out = [circle(circum, 'aux'), circle(incir, 'alt'), tri(A, B, C)];
      // 另一个内接外切三角形：从外接圆上另一点出发
      const P0 = { x: circum.x + circum.r * Math.cos(-2.2), y: circum.y + circum.r * Math.sin(-2.2) };
      const tang = (P) => {                       // 过 P 作内切圆的两条切线与外接圆的另一交点
        const d = sub(incir, P), L = len(d), a = Math.asin(Math.min(incir.r / L, 1));
        const base = Math.atan2(d.y, d.x);
        return [base - a, base + a].map((th) => {
          const u = { x: Math.cos(th), y: Math.sin(th) };
          const e = sub(P, circum), bq = 2 * (e.x * u.x + e.y * u.y);
          const t = -bq;                           // 另一交点（|P−O| = R）
          return add(P, mul(u, t));
        });
      };
      const [P1] = tang(P0), [, P2] = tang(P1);
      out.push(tri(P0, P1, P2, 'tri hi2'));
      return out;
    },
  };

  /* ---------- 画出来 ---------- */
  function svgFor(id) {
    const d = DRAW[id];
    if (!d) return null;
    const body = d().map((s, i) => s.replace('class="', `style="--i:${i}" class="`)).join('');
    return `<svg class="thumb" viewBox="0 0 ${W} ${H}" aria-hidden="true">${body}</svg>`;
  }

  /** 按图形实际范围调整画框，保持 200:140 的比例，免得圆被切掉 */
  function fit(svg, ratio) {
    let bb;
    try { bb = svg.getBBox(); } catch (e) { return; }
    if (!bb || !bb.width || !bb.height) return;
    const pad = Math.max(bb.width, bb.height) * 0.06;
    let x = bb.x - pad, y = bb.y - pad, w = bb.width + 2 * pad, h = bb.height + 2 * pad;
    const want = ratio || (W / H);
    if (w / h < want) { const nw = h * want; x -= (nw - w) / 2; w = nw; }
    else { const nh = w / want; y -= (nh - h) / 2; h = nh; }
    svg.setAttribute('viewBox', [x, y, w, h].map(f).join(' '));
    // 画框放大后线宽会跟着放大，按比例压回去
    const k = w / W;
    if (k > 1.02) svg.style.strokeWidth = '';
    svg.style.setProperty('--k', f(1 / k));
  }

  /** 把一张 SVG 里的线条设成「待画」状态 */
  function arm(svg) {
    svg.querySelectorAll('line, path, circle:not(.pt), ellipse').forEach((el) => {
      let L = 0;
      try { L = el.getTotalLength ? el.getTotalLength() : 0; } catch (e) { L = 0; }
      if (!L && el.tagName === 'circle') L = 2 * Math.PI * el.r.baseVal.value;
      if (!L && el.tagName === 'ellipse') L = Math.PI * (el.rx.baseVal.value + el.ry.baseVal.value) * 1.2;
      if (L) { el.style.strokeDasharray = L; el.style.strokeDashoffset = L; }
    });
  }

  /* ---------- 首屏大图：一层层画，循环 ---------- */
  const HERO_W = 440, HERO_H = 260;
  function heroScenes() {
    const a = { x: 70, y: 214 }, b = { x: 376, y: 214 }, c = { x: 250, y: 46 };
    const t = triangleData(a, b, c);
    const cc = { x: t.O.x, y: t.O.y, r: t.R }, n9 = { x: t.N.x, y: t.N.y, r: t.r9 },
          ic = { x: t.I.x, y: t.I.y, r: t.r };
    const np = ninePoints(a, b, c);
    const [e1, e2] = long(t.O, t.H, 250);
    const d = sub(ic, n9), L = len(d) || 1, F = add(n9, mul(d, n9.r / L));
    return [
      { cap: '任意一个三角形', el: [tri(a, b, c), dot(a), dot(b), dot(c)] },
      { cap: '它的外接圆', el: [circle(cc, 'aux'), dot(t.O)] },
      { cap: '外心、重心、垂心共线 —— 欧拉线', el: [line(e1, e2, 'hi'), dot(t.G), dot(t.H, 'key')] },
      { cap: '九个点落在同一个圆上 —— 九点圆', el: [circle(n9, 'alt'), ...np.map((p) => dot(p, 'key'))] },
      { cap: '它和内切圆相切 —— Feuerbach 定理', el: [circle(ic, 'hi'), dot(F, 'key')] },
    ];
  }

  function runHero(host) {
    const cap = host.parentElement.querySelector('.herocap');
    const scenes = heroScenes();
    let layer = 0, timer = null;

    function reset() {
      host.innerHTML = '';
      layer = 0;
      step();
    }
    function step() {
      if (layer >= scenes.length) {
        timer = setTimeout(reset, 3200);
        return;
      }
      const s = scenes[layer++];
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.innerHTML = s.el.map((x, i) => x.replace('class="', `style="--i:${i}" class="`)).join('');
      host.appendChild(g);
      fit(host, 440 / 260);
      arm(g);
      requestAnimationFrame(() => requestAnimationFrame(() => g.classList.add('go')));
      if (cap) { cap.textContent = s.cap; cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in'); }
      timer = setTimeout(step, 2300);
    }

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      host.innerHTML = scenes.map((s) => s.el.join('')).join('');
      host.classList.add('go');
      if (cap) cap.textContent = scenes[scenes.length - 1].cap;
      return;
    }
    reset();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearTimeout(timer); else reset();
    });
  }

  window.THUMBS = {
    has: (id) => !!DRAW[id],
    fit,
    svg: svgFor,
    arm,
    hero: runHero,
    HERO: { w: HERO_W, h: HERO_H },
  };
})();
