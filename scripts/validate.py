#!/usr/bin/env python3
"""检查 data/theorems.json 的结构和一致性。只用标准库。

用法：python3 scripts/validate.py [路径]
全部通过时退出码为 0，否则逐条列出问题并以 1 退出。
"""
import json
import re
import sys
from pathlib import Path

DEFAULT = Path(__file__).resolve().parent.parent / "data" / "theorems.json"

REQUIRED = ["id", "layer", "category", "subcategory", "name", "label",
            "statement", "source", "books", "conclusion", "status"]
STATUSES = {"extracted", "toc_only", "placeholder"}
BOOKS = {"吉川", "严", "矢野"}
LAYERS = {"射影", "仿射", "欧氏"}
CONCLUSIONS = {"共点", "共线", "共圆", "共面", "轨迹", "包络", "射影对应", "对合", "调和",
               "交比", "比例", "等长", "等角", "平行", "垂直", "相切", "面积", "不等式",
               "分类", "其他"}


def check(data):
    errors = []
    err = lambda tid, msg: errors.append(f"{tid}: {msg}")
    items = data.get("theorems", [])

    if data.get("count") != len(items):
        err("count", f"count 为 {data.get('count')}，实际有 {len(items)} 条")

    for n, t in enumerate(items, 1):
        tid = t.get("id", f"#{n}")
        if tid != f"T{n:03d}":
            err(tid, f"id 不连续，第 {n} 条应为 T{n:03d}")

        status = t.get("status")
        for k in REQUIRED:
            v = t.get(k)
            # 占位条目没有内容，statement 允许为空
            if k == "statement" and status == "placeholder":
                continue
            if v is None or v == "" or v == []:
                err(tid, f"缺少或为空：{k}")

        if status not in STATUSES:
            err(tid, f"status 取值无效：{status!r}")
        books = t.get("books") or []
        bad = [b for b in books if b not in BOOKS]
        if bad:
            err(tid, f"books 含未知书名：{bad}")
        if t.get("layer") not in LAYERS:
            err(tid, f"layer 取值无效：{t.get('layer')!r}")
        if t.get("conclusion") not in CONCLUSIONS:
            err(tid, f"conclusion 取值无效：{t.get('conclusion')!r}")

        # status 与来源的对应关系（规则见 README）
        if status == "extracted" and not ({"吉川", "严"} & set(books)):
            err(tid, "extracted 条目必须来自吉川或严")
        if status in ("toc_only", "placeholder") and books != ["矢野"]:
            err(tid, f"{status} 条目的 books 应只有矢野")
        if status == "placeholder" and (t.get("statement") or not t.get("note")):
            err(tid, "placeholder 条目 statement 应为空，并在 note 里说明")

        cat, sub = t.get("category", ""), t.get("subcategory", "")
        cm = re.match(r"^(\d+)\.", cat)
        sm = re.match(r"^(\d+)\.\d+\s", sub)
        if not cm or not sm or cm.group(1) != sm.group(1):
            err(tid, f"subcategory「{sub}」的编号与 category「{cat}」不一致")

    ids = [t.get("id") for t in items]
    dup = sorted({i for i in ids if ids.count(i) > 1})
    if dup:
        err("id", f"重复：{dup}")
    return errors


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT
    data = json.loads(path.read_text(encoding="utf-8"))
    errors = check(data)
    if errors:
        print(f"{path}: {len(errors)} 个问题")
        for e in errors:
            print("  " + e)
        sys.exit(1)
    n = len(data["theorems"])
    counts = {}
    for t in data["theorems"]:
        counts[t["status"]] = counts.get(t["status"], 0) + 1
    print(f"{path}: 通过，{n} 条（" + "，".join(f"{k} {v}" for k, v in sorted(counts.items())) + "）")


if __name__ == "__main__":
    main()
