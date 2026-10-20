import pickle,collections,itertools,numpy as np,time
exec(open('oscan.py').read().split('# ---------------- 共线')[0])
d=pickle.load(open('oscan_planes.pkl','rb'));PL=d['planes'];Lall=[frozenset(s) for s in d['lines']]
def concyc(S,t,tol=1e-9):
    X=P[t][list(S)];c=X.mean(0);u,s,vt=np.linalg.svd(X-c);B=(X-c)@vt[:2].T
    M=np.column_stack([(B**2).sum(1),B,np.ones(len(B))]);M=M/np.linalg.norm(M,axis=0)
    sv=np.linalg.svd(M,compute_uv=False);return sv[-1]<tol*sv[0] and s[2]<1e-9*s[0]
def has3col(S):
    return any(len(l&S)>=3 for l in Lall)
t0=time.time();cands=set()
for S in PL:
    S=sorted(S)
    if len(S)<4:continue
    X=P[0][S];c=X.mean(0);_,_,vt=np.linalg.svd(X-c);B=(X-c)@vt[:2].T
    n=len(S)
    for a,b in itertools.combinations(range(n),2):
        u=B[a]-B;v=B[b]-B
        ang=np.mod(np.arctan2(u[:,0]*v[:,1]-u[:,1]*v[:,0],(u*v).sum(1)),np.pi)
        idx=[k for k in range(n) if k not in(a,b)];av=ang[idx]
        o=np.argsort(av);av=av[o];ii=np.array(idx)[o]
        i0=0
        for k in range(1,len(av)+1):
            if k==len(av) or av[k]-av[k-1]>1e-9:
                if k-i0>=2:cands.add(frozenset([S[a],S[b],*[S[x] for x in ii[i0:k]]]))
                i0=k
print('候选',len(cands),'%.0fs'%(time.time()-t0))
good=[C for C in cands if not any(len(l&C)>=3 for l in Lall) and all(concyc(C,t) for t in range(NT))]
# 合并共享三点的
merged=[]
for C in sorted(good,key=len,reverse=True):
    for m in merged:
        if len(m&C)>=3:m|=C;break
    else:merged.append(set(C))
merged=[frozenset(m) for m in merged if all(concyc(m,t) for t in range(NT))]
print('共圆（无三点共线）',len(merged))
can=collections.defaultdict(list)
for m in merged:can[canon(m)].append(m)
print('按对称合并',len(can),collections.Counter(len(c) for c in can))
pickle.dump(dict(circles=merged,can=dict(can)),open('ocircles.pkl','wb'))
