import sys,itertools,json;sys.path.insert(0,'.')
from centers import *
res=json.load(open('res3.json'))
tris=[(np.array([-2.,1.2]),np.array([2.2,1.4]),np.array([-0.7,-1.6])),(np.array([-1.3,0.2]),np.array([2.9,-0.4]),np.array([0.4,2.5])),(np.array([0.,0.]),np.array([4.,0.3]),np.array([1.1,2.2]))]
def ops(A,B,C,X):
    a=np.linalg.norm(B-C);b=np.linalg.norm(C-A);c=np.linalg.norm(A-B)
    M=np.array([A,B,C]).T; 
    def tobary(P):
        w=np.linalg.solve(np.vstack([M,np.ones(3)]),np.append(P,1));return w
    def frombary(w):return (w[0]*A+w[1]*B+w[2]*C)/w.sum()
    G=X[2];O=X[3];R=np.linalg.norm(A-O)
    out={}
    for k,P in X.items():
        w=tobary(P)
        out[('补点',k)]=(3*G-P)/2
        out[('反补点',k)]=3*G-2*P
        out[('等角共轭',k)]=frombary(np.array([a*a,b*b,c*c])/w)
        out[('等截共轭',k)]=frombary(1/w)
        d=P-O
        if d@d>1e-12: out[('外接圆反演',k)]=O+d*R*R/(d@d)
        out[('关于O对称',k)]=2*O-P
    return out
rel=None
for t in tris:
    X=centers(*t);o=ops(*t,X);cur=set()
    for (op,k),Q in o.items():
        for j,P in X.items():
            if j!=k and np.linalg.norm(P-Q)<1e-8*max(1,np.linalg.norm(P)):cur.add((op,k,j))
    rel=cur if rel is None else rel&cur
rel=sorted(rel,key=lambda r:(r[0],r[1]))
pivot={'补点':2,'反补点':2,'外接圆反演':3,'关于O对称':3}
from collections import defaultdict
byop=defaultdict(list)
for op,k,j in rel:byop[op].append((k,j))
for op,v in byop.items():print(op,' '.join('X%d→X%d'%p for p in v))
# midpoint relations
mids=set()
for t in tris:
    X=centers(*t);cur=set()
    ks=sorted(X)
    for i,j in itertools.combinations(ks,2):
        m=(X[i]+X[j])/2
        for k in ks:
            if k not in(i,j) and np.linalg.norm(m-X[k])<1e-8:cur.add((k,i,j))
    mids=cur if not mids else mids&cur
print('中点关系',' '.join('X%d=mid(X%d,X%d)'%m for m in sorted(mids)))
# classify each line: generate triples explained
def explained_triples():
    E=set()
    for op,k,j in rel:
        if op in pivot:E.add(frozenset((pivot[op],k,j)))
    for m,i,j in mids:E.add(frozenset((m,i,j)))
    E.add(frozenset((1,5,11)));E.add(frozenset((1,5,12)));E.add(frozenset((1,5,11,12)))  # X12 harmonic by def; X11 on NI
    E.add(frozenset((1,3,36)));E.add(frozenset((1,3,35)))
    return E
E=explained_triples()
print()
for L in res['lines']:
    ids=[int(x[1:]) for x in L];S=set(ids)
    ex=[e for e in E if len(e)==3 and e<=S]
    tag='全部由变换/定义解释' if len(ids)==3 and ex else ('部分' if ex else '无')
    print(len(ids),' '.join(L),'|',tag,'|',' '.join('{'+','.join('X%d'%x for x in sorted(e))+'}' for e in ex))
print()
inv=[(k,j) for op,k,j in rel if op=='外接圆反演' and k<j]
print('反演对',inv)
for Cc in res['circles']:
    ids=set(int(x[1:]) for x in Cc)
    pairs=[p for p in inv if set(p)<=ids]
    print(' '.join(Cc),'|','两对反演点' if len(pairs)>=2 else ('一对反演点' if pairs else ''),pairs)
