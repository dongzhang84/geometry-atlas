import re,json,sys
md=open('../../第四轮.md',encoding='utf-8').read()
b=md.split('## 附录 B')[1].split('## 附录 C')[0]
pairs=[]
for line in b.splitlines():
    m=re.match(r'\| (\d+) \| X(\d+) ↔ X(\d+) \|',line)
    if m: pairs.append((int(m[1]),int(m[2]),int(m[3])))
print(len(pairs))
json.dump(pairs,open('pairs321.json','w'))
P={}
for i,a,b_ in pairs: P.setdefault(a,{})[b_]=i; P.setdefault(b_,{})[a]=i
hits={}
for f in ['part1.txt','part2.txt']:
    txt=open(f,encoding='utf-8',errors='ignore').read()
    # split into entries
    parts=re.split(r'\n(?=X\(\d+\) = [^\n]*\n)',txt)
    cur=None
    for seg in parts:
        m=re.match(r'X\((\d+)\) = ',seg)
        n=int(m[1]) if m else None
        for line in seg.split('\n'):
            if 'nvers' not in line: continue
            nums=[int(x) for x in re.findall(r'X\((\d+)\)',line)]
            cand=set(nums)|({n} if n else set())
            for a in cand:
                for b_ in P.get(a,{}):
                    if b_ in cand and a<b_:
                        hits.setdefault(P[a][b_],[]).append((f,n,line.strip()[:300]))
print(len(hits))
for k in sorted(hits):
    for h in hits[k][:3]: print(k,h)
