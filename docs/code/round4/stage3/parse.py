import re,json
ents={}
for fn in ('part1.txt','part2.txt'):
    L=open(fn,encoding='utf-8',errors='ignore').read().split('\n')
    cur=None
    for i,line in enumerate(L):
        m=re.match(r'^X\((\d+)\) = (.*)$',line)
        if m:
            nxt=[x for x in L[i+1:i+4] if x.strip()]
            if nxt and (nxt[0].startswith('Trilinears') or nxt[0].startswith('Barycentrics')):
                cur=int(m.group(1));ents[cur]=[]
        if cur is not None:ents[cur].append(line)
json.dump(ents,open('ents.json','w'))
print(len(ents),min(ents),max(ents),[k for k in range(1,3001) if k not in ents][:20])
