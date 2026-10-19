import sys,itertools,json,time;sys.path.insert(0,'.')
from tpts import *
mode=sys.argv[1];NT=12
rng=np.random.default_rng(21 if mode=='general' else 22)
data=[]
for _ in range(NT):
    V=rand_tetra(rng) if mode=='general' else rand_ortho(rng)
    P,S=points(V,mode=='ortho');O=P['O'];R=np.linalg.norm(V[0]-O)
    data.append({k:(v-O)/R for k,v in P.items()})
keys=[k for k in data[0] if all(k in d for d in data)]
X=np.array([[d[k] for k in keys] for d in data])
n=len(keys)
dist=np.min(np.linalg.norm(X[:,:,None]-X[:,None],axis=3),axis=0)
drop=set(j for i,j in itertools.combinations(range(n),2) if dist[i,j]<1e-7)
idx=[i for i in range(n) if i not in drop];keys=[keys[i] for i in idx];X=X[:,idx];n=len(keys)
quads=np.array(list(itertools.combinations(range(n),4)))
# non-coplanar in all tetras
vol=np.full(len(quads),np.inf)
for T in range(NT):
    Q=X[T][quads];a=Q[:,1]-Q[:,0];b=Q[:,2]-Q[:,0];c=Q[:,3]-Q[:,0]
    v=np.abs(np.einsum('ij,ij->i',a,np.cross(b,c)))/(np.linalg.norm(a,axis=1)*np.linalg.norm(b,axis=1)*np.linalg.norm(c,axis=1))
    vol=np.minimum(vol,v)
quads=quads[vol>1e-4]
onall=None
for T in range(NT):
    Q=X[T][quads];A=2*(Q[:,1:]-Q[:,:1]);b=(Q[:,1:]**2).sum(-1)-(Q[:,:1]**2).sum(-1)
    c=np.linalg.solve(A,b[...,None])[...,0];r=np.linalg.norm(Q[:,0]-c,axis=1)
    on=np.zeros((len(quads),n),bool)
    for s in range(0,len(quads),50000):
        d=np.linalg.norm(X[T][None,:,:]-c[s:s+50000,None,:],axis=2)
        on[s:s+50000]=np.abs(d-r[s:s+50000,None])<1e-8*np.maximum(1,r[s:s+50000,None])
    onall=on if onall is None else onall&on
cnt=onall.sum(1)
sets=set(tuple(np.where(row)[0]) for row in onall[cnt>=5])
sets=[set(s) for s in sets];sets=[s for s in sets if not any(s<t for t in sets)]
out=[sorted(keys[i] for i in s) for s in sets]
out.sort(key=len,reverse=True)
json.dump(out,open('sph_%s.json'%mode,'w'))
print(mode,len(out),'spheres')
for s in out:print(len(s),' '.join(s))
# filter: drop "circle + 1 point"
kidx={k:i for i,k in enumerate(keys)}
def maxcop(S):
    ids=[kidx[k] for k in S];best=3
    for tri in itertools.combinations(ids,3):
        cnt=3
        for j in ids:
            if j in tri:continue
            ok=True
            for T in range(NT):
                a,b,c=X[T][list(tri)];d=X[T][j]
                nrm=np.cross(b-a,c-a);nrm/=np.linalg.norm(nrm)
                if abs((d-a)@nrm)>1e-8:ok=False;break
            cnt+=ok
        best=max(best,cnt)
    return best
good=[s for s in out if maxcop(s)<=len(s)-2]
json.dump(good,open('sph_%s_good.json'%mode,'w'))
print('NONTRIVIAL',len(good))
for s in good:print(len(s),' '.join(s))
