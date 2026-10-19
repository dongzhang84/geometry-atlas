import numpy as np,pickle,collections,itertools,math
d=pickle.load(open('big.pkl','rb'));keys=d['keys'];P=d['P'];NT=P.shape[0];idx={k:i for i,k in enumerate(keys)};tris=d['tris']
A_=pickle.load(open('bigall.pkl','rb'));AK=A_['keys'];PA=A_['Pall'];AI={k:i for i,k in enumerate(AK)}
S=pickle.load(open('sieve.pkl','rb'));C=S['C'];s3=pickle.load(open('sieve3.pkl','rb'))
def matchin(pts,tol=1e-7):
    dd=np.max(np.linalg.norm(PA-pts[:,None,:],axis=2)/(1+np.linalg.norm(pts,axis=1))[:,None],axis=0)
    j=np.argmin(dd);return AK[j] if dd[j]<tol else None
def inter(P1,P2,P3,P4):
    M=np.array([P2-P1,P3-P4]).T;t=np.linalg.solve(M,P3-P1);return P1+t[0]*(P2-P1)
omegas=collections.defaultdict(lambda:{'pairs':set(),'circles':set()})
def kvec(X,a,b):return np.array([(P[t,idx[a]]-PA[t,AI[X]])@(P[t,idx[b]]-PA[t,AI[X]]) for t in range(NT)])
reg=[]  # list of (X,k)
def regkey(X,k):
    for i,(X2,k2) in enumerate(reg):
        if X2==X and np.all(np.abs(k-k2)<1e-7*(1+np.abs(k2))):return i
    reg.append((X,k));return len(reg)-1
covered=set()
for f in s3['un']:
    for ci in f:
        c=C[ci]
        for q in itertools.combinations(c,4):
            for (a,b),(e,g) in [((q[0],q[1]),(q[2],q[3])),((q[0],q[2]),(q[1],q[3])),((q[0],q[3]),(q[1],q[2]))]:
                try:X=np.array([inter(P[t,idx[a]],P[t,idx[b]],P[t,idx[e]],P[t,idx[g]]) for t in range(NT)])
                except Exception:continue
                if not np.all(np.isfinite(X)):continue
                m=matchin(X)
                if not m:continue
                k=kvec(m,a,b);r=regkey(m,k)
                omegas[r]['pairs']|={tuple(sorted((a,b))),tuple(sorted((e,g)))};omegas[r]['circles'].add(ci);covered.add(ci)
print('unexplained circles covered by a named-center inversion circle:',len(covered),'distinct ω:',len(omegas))
# identify radius: k relative to power wrt circumcircle, or |Y-X|^2 for named Y, or 0
O=P[:,idx[3]];R2=np.array([((tris[t][0]-O[t])**2).sum() for t in range(NT)])
def describe(X,k):
    Xp=PA[:,AI[X]]
    pw=((Xp-O)**2).sum(1)-R2
    if np.all(np.abs(k-pw)<1e-7*(1+np.abs(pw))):return '与外接圆正交'
    if np.all(np.abs(k+pw)<1e-7*(1+np.abs(pw))):return '幂取负(平分外接圆)'
    d2=((PA-Xp[:,None,:])**2).sum(2)  # (NT,n)
    hit=np.where(np.all(np.abs(d2-k[:,None])<1e-7*(1+np.abs(k[:,None])),0))[0]
    if len(hit):return '过 X%d'%AK[hit[0]]
    hitn=np.where(np.all(np.abs(d2+k[:,None])<1e-7*(1+np.abs(k[:,None])),0))[0]
    if len(hitn):return '负幂，半径=到X%d的距离'%AK[hitn[0]]
    return '半径未识别'
rows=[]
for r,v in omegas.items():
    X,k=reg[r];rows.append((len(v['circles']),X,describe(X,k),sorted(v['pairs'])))
rows.sort(key=lambda x:-x[0])
cnt=collections.Counter(x[2].split(' ')[0] if x[2].startswith('过') else x[2] for x in rows)
print(cnt)
for row in rows[:30]:print(row[0],'圆心X%d'%row[1],row[2],row[3][:8])
pickle.dump(dict(rows=rows,covered=covered),open('omega.pkl','wb'))
