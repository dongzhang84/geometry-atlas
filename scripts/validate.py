#!/usr/bin/env python3
"""检查 data/atlas.js 的数据是否自洽，以及页面有没有引用外部资源。

用法：python3 scripts/validate.py
不依赖任何第三方库。有问题就打印并以非零状态退出。
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ATLAS = ROOT / "data" / "atlas.js"
REL_TYPES = {"generalizes", "dual", "converse"}

# 允许出现在页面里的协议之外的一切 http(s) 引用都视为外部依赖
ALLOWED_URL = re.compile(r"https?://(www\.)?w3\.org/")


def load_atlas():
    """data/atlas.js 是 `window.ATLAS = {...};`，剥掉外壳按 JSON 读。

    逐字符扫描，只在字符串之外给裸键名补引号——正则会把
    「HG : GO = 2 : 1」这种正文也当成键名。
    """
    src = ATLAS.read_text(encoding="utf-8")
    start = src.index("{", src.index("window.ATLAS"))

    out, k, depth, n = [], start, 0, len(src)
    while k < n:
        c = src[k]
        if c == '"':                                   # 字符串整段原样搬走
            out.append(c)
            k += 1
            while k < n:
                out.append(src[k])
                if src[k] == "\\":
                    out.append(src[k + 1])
                    k += 2
                    continue
                if src[k] == '"':
                    k += 1
                    break
                k += 1
            continue
        if src.startswith("//", k):                    # 行注释
            k = src.find("\n", k)
            k = n if k < 0 else k
            continue
        if src.startswith("/*", k):                    # 块注释
            k = src.find("*/", k) + 2
            continue
        m = re.match(r"([A-Za-z_][A-Za-z0-9_]*)(\s*):", src[k:])
        if m:                                          # 裸键名
            out.append('"%s"%s:' % (m.group(1), m.group(2)))
            k += m.end()
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            out.append(c)
            k += 1
            if depth == 0:
                break
            continue
        out.append(c)
        k += 1

    body = re.sub(r",(\s*[}\]])", r"\1", "".join(out))   # 尾逗号
    return json.loads(body)


def main():
    bad = []
    A = load_atlas()
    ths = A["theorems"]
    fams = {f["id"] for f in A["families"]}
    ids = [t["id"] for t in ths]

    # 1 编号唯一
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        bad.append(f"编号重复：{sorted(dup)}")

    # 2 家族存在、必填字段齐全
    for t in ths:
        if t.get("family") not in fams:
            bad.append(f"{t['id']} 的 family「{t.get('family')}」不在 families 里")
        for k in ("name", "statement", "source"):
            if not t.get(k):
                bad.append(f"{t['id']} 缺字段 {k}")

    # 3 关系两端存在、类型合法、没有自环
    idset = set(ids)
    seen = set()
    for r in A["relations"]:
        f, to, ty = r.get("from"), r.get("to"), r.get("type")
        if f not in idset:
            bad.append(f"关系 from 不存在：{f}")
        if to not in idset:
            bad.append(f"关系 to 不存在：{to}")
        if ty not in REL_TYPES:
            bad.append(f"关系类型不合法：{ty}（只能是 {sorted(REL_TYPES)}）")
        if f == to:
            bad.append(f"自环：{f}")
        if (f, to, ty) in seen:
            bad.append(f"关系重复：{f} -> {to} ({ty})")
        seen.add((f, to, ty))

    # 3b 依赖边：每条定理都要有 deps，指向的 id 必须存在，不能自指
    tool_ids = {t["id"] for t in A.get("tools", [])}
    node_ids = idset | tool_ids
    for t in ths:
        if "deps" not in t:
            bad.append(f"{t['id']} 缺字段 deps")
            continue
        for d in t["deps"]:
            if d not in node_ids:
                bad.append(f"{t['id']} 依赖了不存在的 {d}")
            if d == t["id"]:
                bad.append(f"{t['id']} 依赖自己")
        if len(set(t["deps"])) != len(t["deps"]):
            bad.append(f"{t['id']} 的 deps 有重复")

    # 3c 依赖不能成环，也不能写传递能推出来的边（A→B→C 时不再写 A→C）
    dep = {t["id"]: list(t.get("deps", [])) for t in ths}
    dstate = {}

    def dwalk(n, path):
        if dstate.get(n) == 2:
            return
        if dstate.get(n) == 1:
            bad.append("依赖成环：" + " -> ".join(path + [n]))
            return
        dstate[n] = 1
        for m in dep.get(n, []):
            dwalk(m, path + [n])
        dstate[n] = 2

    for n in list(dep):
        dwalk(n, [])

    if not any("依赖成环" in b for b in bad):
        def reach(n, acc):
            for m in dep.get(n, []):
                if m not in acc:
                    acc.add(m); reach(m, acc)
            return acc
        for t in ths:
            ds = t.get("deps", [])
            for d in ds:
                indirect = set()
                for o in ds:
                    if o != d:
                        reach(o, indirect)
                if d in indirect:
                    bad.append(f"{t['id']} 的 {d} 是多余的：顺着别的依赖已经能走到")

    # 4 generalizes 不能成环
    g = {}
    for r in A["relations"]:
        if r.get("type") == "generalizes":
            g.setdefault(r["from"], []).append(r["to"])
    state = {}

    def walk(n, path):
        if state.get(n) == 2:
            return
        if state.get(n) == 1:
            bad.append("generalizes 成环：" + " -> ".join(path + [n]))
            return
        state[n] = 1
        for m in g.get(n, []):
            walk(m, path + [n])
        state[n] = 2

    for n in list(g):
        walk(n, [])

    # 5 demo 指向的文件和锚点都要存在
    for t in ths:
        d = t.get("demo")
        if not d:
            continue
        path, _, anchor = d.partition("#")
        f = ROOT / path
        if not f.exists():
            bad.append(f"{t['id']} 的 demo 文件不存在：{path}")
        elif anchor:
            js = (ROOT / "js" / (pathlib.Path(path).stem + ".js"))
            if js.exists():
                src = js.read_text(encoding="utf-8")
                # 锚点可能以字符串出现，也可能是 DRAW 里的方法名（feuerbach(g) {...}）
                if f"'{anchor}'" not in src and not re.search(r"\b%s\s*\(" % re.escape(anchor), src):
                    bad.append(f"{t['id']} 的 demo 锚点在 {js.name} 里找不到：#{anchor}")

    # 6 页面不得引用外部资源
    for f in list(ROOT.glob("*.html")) + list(ROOT.glob("family/*.html")) + \
             list(ROOT.glob("js/*.js")) + list(ROOT.glob("data/*.js")):
        for m in re.finditer(r"https?://[^\s\"'<>)]+", f.read_text(encoding="utf-8")):
            if not ALLOWED_URL.match(m.group(0)):
                bad.append(f"{f.relative_to(ROOT)} 引用了外部地址：{m.group(0)}")
        if "fetch(" in f.read_text(encoding="utf-8"):
            bad.append(f"{f.relative_to(ROOT)} 里有 fetch()，数据应当用 <script src> 加载")

    n_demo = sum(1 for t in ths if t.get("demo"))
    n_edge = sum(len(t.get("deps", [])) for t in ths)
    roots = [t["id"] for t in ths if not t.get("deps")]
    print(f"定理 {len(ths)} 条 · 家族 {len(fams)} 个 · 基础工具 {len(A.get('tools', []))} 个 · "
          f"依赖边 {n_edge} 条 · 关系 {len(A['relations'])} 条 · 动态图 {n_demo} 个")
    if roots:
        print("没有父节点的：" + "、".join(roots))
    if bad:
        print("\n发现 %d 个问题：" % len(bad))
        for b in bad:
            print("  -", b)
        return 1
    print("全部检查通过。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
