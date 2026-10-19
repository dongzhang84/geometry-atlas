import numpy as np,pickle,collections,itertools
d=pickle.load(open('big.pkl','rb'));keys=d['keys'];P=d['P'];NT=P.shape[0];idx={k:i for i,k in enumerate(keys)}
A_=pickle.load(open('bigall.pkl','rb'));AK=A_['keys'];PA=A_['Pall']
S=pickle.load(open('sieve.pkl','rb'));C=S['C'];s3=pickle.load(open('sieve3.pkl','rb'))
cp={98,99,100,101,103,104,105,106,107,108,109,110,112,675}
def matchin(pts,tol=1e-7):
    dd=np.max(np.linalg.norm(PA-pts[:,None,:],axis=2)/(1+np.linalg.norm(pts,axis=1))[:,None],axis=0)
    j=np.argmin(dd);return AK[j] if dd[j]<tol else None
def inter(P1,P2,P3,P4):
    M=np.array([P2-P1,P3-P4]).T;t=np.linalg.solve(M,P3-P1);return P1+t[0]*(P2-P1)
stats=collections.Counter();examples=collections.defaultdict(list)
for f in s3['un']:
    c=C[f[0]];zc=[k for k in c if k in cp]
    best=None
    for q in itertools.combinations(c,4):
        for (a,b),(e,g) in [((q[0],q[1]),(q[2],q[3])),((q[0],q[2]),(q[1],q[3])),((q[0],q[3]),(q[1],q[2]))]:
            try:X=np.array([inter(P[t,idx[a]],P[t,idx[b]],P[t,idx[e]],P[t,idx[g]]) for t in range(NT)])
            except Exception:continue
            if not np.all(np.isfinite(X)):continue
            m=matchin(X)
            if m:best=(m,(a,b),(e,g));break
        if best:break
    key=('含外接圆点' if zc else '不含')+(' / 对角线交点有名' if best else ' / 交点无名')
    stats[key]+=1
    if best and len(examples[key])<15:examples[key].append((c,best))
print(stats)
for k,v in examples.items():
    print(k);[print('   ',e) for e in v]
