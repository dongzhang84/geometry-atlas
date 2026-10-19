import numpy as np,pickle,collections,itertools
d=pickle.load(open('big.pkl','rb'));keys=d['keys'];P=d['P'];NT=P.shape[0];idx={k:i for i,k in enumerate(keys)}
A_=pickle.load(open('bigall.pkl','rb'));AK=A_['keys'];PA=A_['Pall'];AI={k:i for i,k in enumerate(AK)}
S=pickle.load(open('sieve.pkl','rb'));C=S['C'];om=pickle.load(open('omega.pkl','rb'));R=pickle.load(open('reduce2.pkl','rb'))
cls={}
for o in R['out']:
    for pq,w in o['cls'].items():cls[(o['X'],tuple(sorted(pq)))]=w
def matchin(pts):
    dd=np.max(np.linalg.norm(PA-pts[:,None,:],axis=2)/(1+np.linalg.norm(pts,axis=1))[:,None],axis=0)
    j=np.argmin(dd);return AK[j] if dd[j]<1e-7 else None
def inter(P1,P2,P3,P4):
    M=np.array([P2-P1,P3-P4]).T;t=np.linalg.solve(M,P3-P1);return P1+t[0]*(P2-P1)
isopen=lambda w:w=='待查'
status={};dep=collections.defaultdict(set)
for ci in om['covered']:
    c=C[ci];best=None
    for q in itertools.combinations(c,4):
        for pa,pb in [((q[0],q[1]),(q[2],q[3])),((q[0],q[2]),(q[1],q[3])),((q[0],q[3]),(q[1],q[2]))]:
            try:X=np.array([inter(P[t,idx[pa[0]]],P[t,idx[pa[1]]],P[t,idx[pb[0]]],P[t,idx[pb[1]]]) for t in range(NT)])
            except Exception:continue
            if not np.all(np.isfinite(X)):continue
            m=matchin(X)
            if not m:continue
            w1=cls.get((m,tuple(sorted(pa))));w2=cls.get((m,tuple(sorted(pb))))
            if w1 is None or w2 is None:continue
            nopen=isopen(w1)+isopen(w2)
            cand=(nopen,m,pa,pb,w1,w2)
            if best is None or cand[0]<best[0]:best=cand
    status[ci]=best
    if best and best[0]>0:
        for pr,w in ((best[2],best[4]),(best[3],best[5])):
            if isopen(w):dep[(best[1],tuple(sorted(pr)))].add(ci)
cnt=collections.Counter(b[0] if b else 'none' for b in status.values())
print('structured circles by number of open pairs needed:',cnt)
ranked=sorted(dep.items(),key=lambda kv:(-len(kv[1]),max(kv[0][1])))
print('open pair relations actually needed:',len(ranked))
for (X,pq),cs in ranked[:30]:print('ω圆心X%d  X%d↔X%d  支撑 %d 个圆'%(X,pq[0],pq[1],len(cs)),[C[i] for i in list(cs)[:3]])
pickle.dump(dict(status=status,dep=dict(dep)),open('reduce3.pkl','wb'))
