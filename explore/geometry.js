/* Geometry Atlas · 平面几何计算工具（专题页共用）
 * 点用 {x, y} 表示。所有函数都是纯函数，挂在 window.GA 上。 */
(function () {
  const sub = (p, q) => ({ x: p.x - q.x, y: p.y - q.y });
  const add = (p, q) => ({ x: p.x + q.x, y: p.y + q.y });
  const mul = (p, c) => ({ x: p.x * c, y: p.y * c });
  const mid = (p, q) => mul(add(p, q), 0.5);
  const len = (p) => Math.hypot(p.x, p.y);

  /** 外接圆：返回 {x, y, r} */
  function circumcircle(A, B, C) {
    const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
    const a2 = A.x * A.x + A.y * A.y, b2 = B.x * B.x + B.y * B.y, c2 = C.x * C.x + C.y * C.y;
    const o = {
      x: (a2 * (B.y - C.y) + b2 * (C.y - A.y) + c2 * (A.y - B.y)) / d,
      y: (a2 * (C.x - B.x) + b2 * (A.x - C.x) + c2 * (B.x - A.x)) / d,
    };
    return { x: o.x, y: o.y, r: len(sub(A, o)) };
  }

  /** 垂心：H = A + B + C − 2O */
  function orthocenter(A, B, C) {
    const o = circumcircle(A, B, C);
    return sub(add(add(A, B), C), mul(o, 2));
  }

  /** 点 P 到直线 UV 的垂足 */
  function foot(P, U, V) {
    const d = sub(V, U);
    const c = ((P.x - U.x) * d.x + (P.y - U.y) * d.y) / (d.x * d.x + d.y * d.y);
    return add(U, mul(d, c));
  }

  /** 九点圆上的九个点：三边中点、三个垂足、顶点到垂心连线的中点 */
  function ninePoints(X, Y, Z) {
    const h = orthocenter(X, Y, Z);
    return [mid(X, Y), mid(Y, Z), mid(Z, X),
            foot(X, Y, Z), foot(Y, Z, X), foot(Z, X, Y),
            mid(X, h), mid(Y, h), mid(Z, h)];
  }

  /** 三角形的常用中心与圆 */
  function triangleData(A, B, C) {
    const oc = circumcircle(A, B, C);
    const O = { x: oc.x, y: oc.y };
    const H = orthocenter(A, B, C);
    const G = mul(add(add(A, B), C), 1 / 3);
    const N = mid(O, H);
    const a = len(sub(B, C)), b = len(sub(C, A)), c = len(sub(A, B));
    const s = (a + b + c) / 2;
    const area = Math.sqrt(Math.max(s * (s - a) * (s - b) * (s - c), 1e-12));
    const I = { x: (a * A.x + b * B.x + c * C.x) / (2 * s), y: (a * A.y + b * B.y + c * C.y) / (2 * s) };
    const excircles = [[-a, b, c, s - a], [a, -b, c, s - b], [a, b, -c, s - c]].map(([p, q, w, d]) => ({
      x: (p * A.x + q * B.x + w * C.x) / (p + q + w),
      y: (p * A.y + q * B.y + w * C.y) / (p + q + w),
      r: area / d,
    }));
    return { A, B, C, O, R: oc.r, H, G, N, r9: oc.r / 2, I, r: area / s, excircles };
  }

  /* ---------- 二次曲线 ax² + bxy + cy² + dx + ey + f = 0 ---------- */

  /** 过 P、Q 两点的直线，系数 [a, b, c]（已单位化） */
  function lineCoeffs(P, Q) {
    const a = Q.y - P.y, b = P.x - Q.x, n = Math.hypot(a, b);
    return [a / n, b / n, -(a * P.x + b * P.y) / n];
  }
  /** 两条直线之积，得到一条退化二次曲线 */
  function lineProduct(l, m) {
    return [l[0] * m[0], l[0] * m[1] + l[1] * m[0], l[1] * m[1],
            l[0] * m[2] + l[2] * m[0], l[1] * m[2] + l[2] * m[1], l[2] * m[2]];
  }
  const evalConic = (c, p) => c[0] * p.x * p.x + c[1] * p.x * p.y + c[2] * p.y * p.y + c[3] * p.x + c[4] * p.y + c[5];
  /** 二次曲线中心；抛物线时返回 null */
  function conicCenter(c) {
    const det = 4 * c[0] * c[2] - c[1] * c[1];
    if (Math.abs(det) < 1e-12) return null;
    return { x: (c[1] * c[4] - 2 * c[2] * c[3]) / det, y: (c[1] * c[3] - 2 * c[0] * c[4]) / det };
  }
  /** 渐近线斜率（双曲线），返回 [m1, m2] 或 [] */
  function asymptoteSlopes(c) {
    const disc = c[1] * c[1] - 4 * c[0] * c[2];
    if (disc < 0 || Math.abs(c[2]) < 1e-12) return [];
    const r = Math.sqrt(disc);
    return [(-c[1] + r) / (2 * c[2]), (-c[1] - r) / (2 * c[2])];
  }

  /** 用 marching squares 在画布上描出 F(x, y) = 0；F 接收屏幕坐标 */
  function traceImplicit(ctx, F, width, height, step) {
    ctx.beginPath();
    for (let x = 0; x < width; x += step) {
      for (let y = 0; y < height; y += step) {
        const v = [F(x, y), F(x + step, y), F(x + step, y + step), F(x, y + step)];
        const c = [[x, y], [x + step, y], [x + step, y + step], [x, y + step]];
        const e = [];
        for (let i = 0; i < 4; i++) {
          const j = (i + 1) % 4;
          if ((v[i] > 0) !== (v[j] > 0)) {
            const u = v[i] / (v[i] - v[j]);
            e.push([c[i][0] + u * (c[j][0] - c[i][0]), c[i][1] + u * (c[j][1] - c[i][1])]);
          }
        }
        if (e.length >= 2) { ctx.moveTo(e[0][0], e[0][1]); ctx.lineTo(e[1][0], e[1][1]); }
        if (e.length === 4) { ctx.moveTo(e[2][0], e[2][1]); ctx.lineTo(e[3][0], e[3][1]); }
      }
    }
    ctx.stroke();
  }

  window.GA = { sub, add, mul, mid, len, circumcircle, orthocenter, foot, ninePoints, triangleData,
    lineCoeffs, lineProduct, evalConic, conicCenter, asymptoteSlopes, traceImplicit };
})();
