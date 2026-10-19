import numpy as np,pickle,itertools,collections
exec(open('sieve.py').read().split('# ---------- maps')[0])
S=pickle.load(open('sieve.pkl','rb'));expl=S['expl']
exec('def named'+open('sieve.py').read().split('def named')[1].split('NM=[named')[0])
NM=[named(t) for t in range(NT)]
invs={nm:(np.array([NM[t][nm][0] for t in range(NT)]),np.array([NM[t][nm][1] for t in range(NT)])) for nm in NM[0] if nm!='外接圆(反演取负)'}
def dia(i,j):
    c0=(P[:,idx[i]]+P[:,idx[j]])/2;r2=((P[:,idx[i]]-c0)**2).sum(1);return c0,r2
for i,j in [(2,4),(3,6),(1,3),(3,4),(1,4),(2,3),(1,9),(1,40),(2,20)]:invs['以X%dX%d为直径'%(i,j)]=dia(i,j)
csets=[frozenset(c) for c in C]
where=collections.defaultdict(list)
for ci,c in enumerate(csets):
    for q in itertools.combinations(sorted(c),3):where[q].append(ci)
lines=json_lines=None
import json
L={int(k):v for k,v in json.load(open('etc_lines.json')).items()}
def col_all(pts):
    u=pts[:,1]-pts[:,0]
    for m in range(2,pts.shape[1]):
        v=pts[:,m]-pts[:,0]
        if np.max(np.abs(u[:,0]*v[:,1]-u[:,1]*v[:,0])/(np.linalg.norm(u,axis=1)*np.linalg.norm(v,axis=1)))>1e-8:return False
    return True
res={}
links=collections.defaultdict(set)
for ci,c in enumerate(C):
    for nm,(c0,k) in invs.items():
        imgs={};
        for key in c:
            Y=P[:,idx[key]];d=Y-c0;dd=(d*d).sum(1)
            if np.max(dd)<1e-14:imgs[key]='center';continue
            imgs[key]=match(c0+(k/dd)[:,None]*d)
        if any(v is None for v in imgs.values()):continue
        if 'center' in imgs.values():
            others=[v for v in imgs.values() if v!='center']
            if len(others)>=3 and col_all(np.stack([P[:,idx[v]] for v in others],1)):
                res.setdefault(ci,('反演成直线',nm,others))
        else:
            im=sorted(imgs.values())
            for cj in where.get(tuple(im[:3]),[]):
                if set(im)<=csets[cj] and cj!=ci:links[ci].add((cj,nm))
print('circles mapped to a line by an inversion:',len(res))
print('circles linked to another circle by inversion:',len(links))
pickle.dump(dict(res=res,links=dict(links)),open('sieve2.pkl','wb'))
# combine all explanations with family closure
alllinks=collections.defaultdict(set)
for a,s in S['links'].items():
    for b,_ in s:alllinks[a].add(b);alllinks[b].add(a)
for a,s in links.items():
    for b,_ in s:alllinks[a].add(b);alllinks[b].add(a)
seen=set();fams=[]
for i in range(len(C)):
    if i in seen:continue
    st=[i];f=[]
    while st:
        x=st.pop()
        if x in seen:continue
        seen.add(x);f.append(x);st+=list(alllinks[x])
    fams.append(f)
named_circle=set()
for ci,c in enumerate(C):
    pts=np.stack([P[:,idx[k]] for k in c],1)
    cf=[circfit(pts[t]) for t in range(NT)]
    for nm in NM[0]:
        if all(np.linalg.norm(cf[t][0]-NM[t][nm][0])<1e-7 and abs(cf[t][1]-NM[t][nm][1])<1e-7*abs(NM[t][nm][1]) for t in range(NT)):named_circle.add(ci)
ok=lambda i:(i in named_circle) or (expl[i] is not None) or (i in res)
explained_fams=[f for f in fams if any(ok(i) for i in f)]
un=[f for f in fams if not any(ok(i) for i in f)]
print('named circles',len(named_circle),'families',len(fams),'explained families',len(explained_fams),'unexplained families',len(un),'unexplained circles',sum(len(f) for f in un))
pickle.dump(dict(fams=fams,un=un,named=named_circle),open('sieve_all.pkl','wb'))
for f in un[:30]:print([C[i] for i in f])
