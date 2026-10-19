import numpy as np,pickle,collections,itertools,math
d=pickle.load(open('big.pkl','rb'));tris=d['tris'];NT=len(tris)
A_=pickle.load(open('bigall.pkl','rb'));AK=A_['keys'];PA=A_['Pall'];AI={k:i for i,k in enumerate(AK)}
cl=pickle.load(open('closure2.pkl','rb'));reg=cl['reg'];dec=cl['dec']
C=pickle.load(open('sieve.pkl','rb'))['C'];rel=pickle.load(open('etc_rel.pkl','rb'))
SA=pickle.load(open('sieve_all.pkl','rb'));named=SA['named'];S2=pickle.load(open('sieve2.pkl','rb'));s3=pickle.load(open('sieve3.pkl','rb'))
kc=set(pickle.load(open('kc.pkl','rb')))
Pt=lambda k:PA[:,AI[k]]
def close(u,v):return np.all(np.abs(u-v)<1e-7*(1+np.abs(v)))
exec('def circles'+open('identw.py').read().split('def circles')[1].split('CN=[circles')[0])
CN=[circles(t) for t in range(NT)];names=[k for k in CN[0] if CN[0][k] is not None]
cc=lambda nm:(np.array([CN[t][nm][0] for t in range(NT)]),np.array([CN[t][nm][1] for t in range(NT)]))
basic=[1,2,3,4,5,6,8,10,20,40,7,9,11,13,14,15,16,32,39,55,56,65,69,76,99,100,101,110]
def col(a,b,c):
    U=Pt(b)-Pt(a);V=Pt(c)-Pt(a)
    return np.max(np.abs(U[:,0]*V[:,1]-U[:,1]*V[:,0])/(np.linalg.norm(U,axis=1)*np.linalg.norm(V,axis=1)+1e-300))<1e-8
memo={}
def known(w,pr):
    if (w,pr) in memo:return memo[(w,pr)]
    X,k=reg[w];p,q=pr;why=None
    for nm in names:
        c0,r2=cc(nm);pw=((Pt(X)-c0)**2).sum(1)-r2
        if close(k,pw):
            onp=close(((Pt(p)-c0)**2).sum(1),r2);onq=close(((Pt(q)-c0)**2).sum(1),r2)
            if onp and onq:why='弦';break
            for u,v in ((p,q),(q,p)):
                if close(Pt(u),c0):
                    dX=Pt(X)-c0;invX=c0+(r2/(dX**2).sum(1))[:,None]*dX
                    if close(Pt(v),invX):why='定义'
            if why:break
        if close(Pt(X),c0) and close(k,r2):
            if frozenset(pr) in rel['invl']:why='ETC反演';break
    pass
    if not why:
        for (pq,uv) in rel['harm']:
            if pq==frozenset(pr):
                u,v=tuple(uv)
                if u not in AI or v not in AI:continue
                if close(((Pt(u)-Pt(X))**2).sum(1),k) and close(((Pt(v)-Pt(X))**2).sum(1),k):why='ETC调和';break
    pass
    memo[(w,pr)]=why;return why
K=set()
for ci,L in dec.items():
    for w,a,b in L:
        for pr in (a,b):
            if known(w,pr):K.add((w,pr))
conf=pickle.load(open('etc_confirmed.pkl','rb'))
for ci,L in dec.items():
    for w,a,b in L:
        for pr in (a,b):
            if tuple(sorted(pr)) in conf and reg[w][0] in (2,55,56):K.add((w,pr))
E=set(named)|kc|set(S2['res'])|set(s3['toline'])
# translation adjacency
adj=collections.defaultdict(set)
for a,s in s3['links'].items():
    for b in s:adj[a].add(b);adj[b].add(a)
changed=True
while changed:
    changed=False
    for ci,L in dec.items():
        for w,a,b in L:
            ka,kb=(w,a) in K,(w,b) in K
            if ci in E:
                if ka and not kb:K.add((w,b));changed=True
                if kb and not ka:K.add((w,a));changed=True
            elif ka and kb:E.add(ci);changed=True
    for a in list(E):
        for b in adj[a]:
            if b not in E:E.add(b);changed=True
struct=[i for i in range(len(C)) if i not in E and dec.get(i)]
nost=[i for i in range(len(C)) if i not in E and not dec.get(i)]
# circles explained by inverse pairs wrt named reference circles (sieve 2) but relations not known -> structured
print('真正已解释',len(E),'有结构(待查关系)',len(struct),'无结构',len(nost))
need=collections.defaultdict(set)
for ci in struct:
    best=min(dec[ci],key=lambda x:((x[0],x[1]) not in K)+((x[0],x[2]) not in K))
    for pr in (best[1],best[2]):
        if (best[0],pr) not in K:need[(best[0],pr)].add(ci)
print('待查关系',len(need))
pickle.dump(dict(K=K,E=E,struct=struct,nost=nost,need=dict(need)),open('recheck.pkl','wb'))
S=pickle.load(open('sieve.pkl','rb'));expl=S['expl']
import re
E2=set(E);struct2=set(struct);nost2=set(nost);rel_d=[]
for i in list(nost2):
    ex=expl[i]
    if ex is None:continue
    nm=ex[1];prs=ex[2]
    m=re.match(r'以X(\d+) X(\d+)为直径',nm)
    def kn(p,q):
        if frozenset((p,q)) in rel['invl']:return True
        if m and (frozenset((p,q)),frozenset((int(m.group(1)),int(m.group(2))))) in rel['harm']:return True
        return False
    used=set();cnt_known=0;cnt=0
    for p,q in prs:
        if p in used or q in used:continue
        used|={p,q};cnt+=1;cnt_known+=kn(p,q)
        if not kn(p,q):rel_d.append((nm,(p,q),i))
    nost2.discard(i)
    if cnt>=2 and cnt_known>=2:E2.add(i)
    else:struct2.add(i)
print('严格口径：已解释',len(E2),'有结构',len(struct2),'无结构',len(nost2))
allrel=set((r[0],r[1]) for r in rel_d)|set(need.keys())
print('待查关系总数（含直径圆族）',len(allrel))
pickle.dump(dict(E=E2,struct=struct2,nost=nost2,need=dict(need),rel_d=rel_d),open('recheck2.pkl','wb'))
