import numpy as np,pickle,itertools,math,collections
d=pickle.load(open('big.pkl','rb'));keys=d['keys'];P=d['P'];tris=d['tris'];NT=len(tris);idx={k:i for i,k in enumerate(keys)}
A_=pickle.load(open('bigall.pkl','rb'));AK=A_['keys'];PA=A_['Pall'];AI={k:i for i,k in enumerate(AK)}
C=pickle.load(open('sieve.pkl','rb'))['C'];R=pickle.load(open('recheck2.pkl','rb'))
exec('def circles'+open('identw.py').read().split('def circles')[1].split('CN=[circles')[0])
CN=[circles(t) for t in range(NT)];names=[k for k in CN[0] if CN[0][k] is not None and np.all(np.array([CN[t][k][1] for t in range(NT)])>0)]
def close(u,v):return np.all(np.abs(u-v)<1e-7*(1+np.abs(v)))
def match(pts):
    dd=np.max(np.linalg.norm(PA-pts[:,None,:],axis=2)/(1+np.linalg.norm(pts,axis=1))[:,None],axis=0)
    j=np.argmin(dd);return AK[j] if dd[j]<1e-7 else None
def circfit(i):
    out=[]
    for t in range(NT):
        p1,p2,p3=[P[t,idx[k]] for k in C[i][:3]];M=np.array([2*(p2-p1),2*(p3-p1)]);c=np.linalg.solve(M,[p2@p2-p1@p1,p3@p3-p1@p1]);out.append((c,(p1-c)@(p1-c)))
    return np.array([o[0] for o in out]),np.array([o[1] for o in out])
res={}
for i in R['nost']:
    c0,r2=circfit(i);info=[]
    m=match(c0)
    if m:info.append('圆心是 X%d'%m)
    # coaxal with two named circles: equation x^2+y^2-2c.x+|c|^2-r^2 ; check linear dependence of (1,-2c,|c|^2-r2) with two named
    for n1,n2 in itertools.combinations(names,2):
        ok=True
        for t in range(NT):
            c1,s1=CN[t][n1];c2,s2=CN[t][n2]
            v=lambda c,r:np.array([1,-2*c[0],-2*c[1],c@c-r])
            M=np.array([v(c0[t],r2[t]),v(c1,s1),v(c2,s2)])
            sv=np.linalg.svd(M,compute_uv=False)
            if sv[-1]>1e-9*sv[0]:ok=False;break
        if ok:info.append('与%s、%s共轴'%(n1,n2))
    # orthogonal to named circles
    for n in names:
        if all(abs(((c0[t]-CN[t][n][0])**2).sum()-r2[t]-CN[t][n][1])<1e-7*(r2[t]+CN[t][n][1]) for t in range(NT)):info.append('与%s正交'%n)
    if info:res[i]=info
print('181 个里有新线索的:',len(res))
cnt=collections.Counter(x.split('是')[0] if x.startswith('圆心') else x for v in res.values() for x in v)
print(cnt.most_common(20))
for i,v in list(res.items())[:20]:print(C[i],v)
pickle.dump(res,open('task2.pkl','wb'))
