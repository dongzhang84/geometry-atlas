import numpy as np,pickle,collections,itertools
d=pickle.load(open('big.pkl','rb'));keys=d['keys'];P=d['P'];NT=P.shape[0];idx={k:i for i,k in enumerate(keys)}
A_=pickle.load(open('bigall.pkl','rb'));AK=A_['keys'];PA=A_['Pall'];AI={k:i for i,k in enumerate(AK)}
S=pickle.load(open('sieve.pkl','rb'));C=S['C']
s3=pickle.load(open('sieve3.pkl','rb'));R2=pickle.load(open('reduce2.pkl','rb'))
def matchin(pts):
    dd=np.max(np.linalg.norm(PA-pts[:,None,:],axis=2)/(1+np.linalg.norm(pts,axis=1))[:,None],axis=0)
    j=np.argmin(dd);return AK[j] if dd[j]<1e-7 else None
def inter(P1,P2,P3,P4):
    M=np.array([P2-P1,P3-P4]).T;t=np.linalg.solve(M,P3-P1);return P1+t[0]*(P2-P1)
# omega key: (X, rounded k signature) -> use registry by closeness
reg=[]
def okey(X,k):
    for i,(X2,k2) in enumerate(reg):
        if X2==X and np.all(np.abs(k-k2)<1e-7*(1+np.abs(k2))):return i
    reg.append((X,k));return len(reg)-1
dec=collections.defaultdict(list)   # circle -> list of (w,pairA,pairB)
for ci,c in enumerate(C):
    for q in itertools.combinations(c,4):
        for pa,pb in [((q[0],q[1]),(q[2],q[3])),((q[0],q[2]),(q[1],q[3])),((q[0],q[3]),(q[1],q[2]))]:
            try:X=np.array([inter(P[t,idx[pa[0]]],P[t,idx[pa[1]]],P[t,idx[pb[0]]],P[t,idx[pb[1]]]) for t in range(NT)])
            except Exception:continue
            if not np.all(np.isfinite(X)):continue
            m=matchin(X)
            if not m:continue
            k=((P[:,idx[pa[0]]]-PA[:,AI[m]])*(P[:,idx[pa[1]]]-PA[:,AI[m]])).sum(1)
            w=okey(m,k);dec[ci].append((w,tuple(sorted(pa)),tuple(sorted(pb))))
# initial knowledge
K=set()
for o in R2['out']:
    X=o['X']
    for pq,why in o['cls'].items():
        if why!='待查':
            # find omega id
            k=((PA[:,AI[pq[0]]]-PA[:,AI[X]])*(PA[:,AI[pq[1]]]-PA[:,AI[X]])).sum(1);K.add((okey(X,k),tuple(sorted(pq))))
unset=set(i for f in s3['un'] for i in f)
E=set(i for i in range(len(C)) if i not in unset)
E0=set(E)
changed=True;rounds=0
while changed:
    changed=False;rounds+=1
    for ci,L in dec.items():
        for w,a,b in L:
            ka,kb=(w,a) in K,(w,b) in K
            if ci in E:
                if ka and not kb:K.add((w,b));changed=True
                if kb and not ka:K.add((w,a));changed=True
            elif ka and kb:E.add(ci);changed=True
print('rounds',rounds,'explained circles',len(E0),'->',len(E),'of',len(C))
# remaining open relations needed by unexplained structured circles
need=collections.defaultdict(set);nostruct=[]
for ci in range(len(C)):
    if ci in E:continue
    L=dec.get(ci,[])
    if not L:nostruct.append(ci);continue
    best=min(L,key=lambda x:((x[0],x[1]) not in K)+((x[0],x[2]) not in K))
    for pr in (best[1],best[2]):
        if (best[0],pr) not in K:need[(best[0],pr)].add(ci)
print('unexplained with structure',len(C)-len(E)-len(nostruct),'no structure',len(nostruct),'open relations',len(need))
pickle.dump(dict(reg=reg,dec=dict(dec),K=K,E=E,need=dict(need),nostruct=nostruct),open('closure.pkl','wb'))
