import sys,itertools,json,time;sys.path.insert(0,'.')
from tpts import *
mode=sys.argv[1]  # general / ortho
NT=16
rng=np.random.default_rng(11 if mode=='general' else 12)
data=[]
for _ in range(NT):
    V=rand_tetra(rng) if mode=='general' else rand_ortho(rng)
    P,S=points(V,mode=='ortho')
    O=P['O'];R=np.linalg.norm(V[0]-O)
    P={k:(v-O)/R for k,v in P.items()}
    data.append(P)
keys=[k for k in data[0] if all(k in d for d in data)]
# sanity: face circumcenter equidistant
d=data[0];V=[d['V%d'%i] for i in range(4)]
print('fO check',np.linalg.norm(d['fO0']-V[1])-np.linalg.norm(d['fO0']-V[2]))
X=np.array([[d[k] for k in keys] for d in data])   # T n 3
n=len(keys);print(mode,'points',n)
# drop coincident pairs
dist=np.min(np.linalg.norm(X[:,:,None]-X[:,None],axis=3),axis=0)
dup=[(keys[i],keys[j]) for i,j in itertools.combinations(range(n),2) if dist[i,j]<1e-7]
print('coincident',dup)
drop=set(j for i,j in itertools.combinations(range(n),2) if dist[i,j]<1e-7)
idx=[i for i in range(n) if i not in drop];keys=[keys[i] for i in idx];X=X[:,idx];n=len(keys)
def lab(S):return sorted(keys[i] for i in S)
# collinear
t0=time.time()
C3=[]
for t in itertools.combinations(range(n),3):
    p,q,r=X[:,t[0]],X[:,t[1]],X[:,t[2]]
    u=q-p;v=r-p;val=np.max(np.linalg.norm(np.cross(u,v),axis=1)/(np.linalg.norm(u,axis=1)*np.linalg.norm(v,axis=1)))
    if val<1e-8:C3.append(t)
def merge(tuples,k):
    sets=[set(t) for t in tuples];ch=True
    while ch:
        ch=False
        for i in range(len(sets)):
            for j in range(i+1,len(sets)):
                if len(sets[i]&sets[j])>=k-1:sets[i]|=sets.pop(j);ch=True;break
            if ch:break
    return sets
lines=merge(C3,3)
print('collinear triples',len(C3),'lines',len(lines),time.time()-t0)
# coplanar quadruples (vectorized)
quads=np.array(list(itertools.combinations(range(n),4)))
worst=np.zeros(len(quads))
for T in range(NT):
    Q=X[T][quads];a=Q[:,1]-Q[:,0];b=Q[:,2]-Q[:,0];c=Q[:,3]-Q[:,0]
    det=np.einsum('ij,ij->i',a,np.cross(b,c))
    nr=np.linalg.norm(a,axis=1)*np.linalg.norm(b,axis=1)*np.linalg.norm(c,axis=1)
    worst=np.maximum(worst,np.abs(det)/nr)
cop=quads[worst<1e-8]
lineset=[set(L) for L in lines]
cop=[tuple(q) for q in cop if not any(len(set(q)&L)>=3 for L in lineset)]
colset=set(C3)
def merge_gen(tuples,k,degenerate):
    # union tuples sharing a non-degenerate (k-1)-subset
    parent=list(range(len(tuples)));find=lambda x:x if parent[x]==x else find(parent[x])
    owner={}
    for i,t in enumerate(tuples):
        for sub in itertools.combinations(sorted(t),k-1):
            if degenerate(sub):continue
            if sub in owner:
                a,b=find(i),find(owner[sub])
                if a!=b:parent[a]=b
            else:owner[sub]=i
    groups={}
    for i,t in enumerate(tuples):groups.setdefault(find(i),set()).update(t)
    return list(groups.values())
planes=merge_gen(cop,4,lambda sub:tuple(sorted(sub)) in colset)
print('coplanar quads',len(cop),'planes',len(planes))
# cospherical 5-tuples: prefilter on 2 tetras, chunked
t0=time.time()
def rowsM(T,ids):
    Q=X[T][ids];return np.concatenate([(Q**2).sum(-1,keepdims=True),Q,np.ones(Q.shape[:-1]+(1,))],-1)
planeset=[set(p) for p in planes]
cand=[]
it=itertools.combinations(range(n),5);chunk=400000
while True:
    blk=np.array(list(itertools.islice(it,chunk)))
    if len(blk)==0:break
    ok=np.ones(len(blk),bool)
    for T in (0,1):
        M=rowsM(T,blk[ok]);v=np.abs(np.linalg.det(M))/np.prod(np.linalg.norm(M,axis=2),axis=1)
        sub=np.where(ok)[0];ok[sub[v>=1e-9]]=False
    cand.extend(map(tuple,blk[ok]))
print('prefilter cosph',len(cand),time.time()-t0)
cand=np.array(cand) if cand else np.zeros((0,5),int)
ok=np.ones(len(cand),bool)
for T in range(2,NT):
    if not ok.any():break
    M=rowsM(T,cand[ok]);v=np.abs(np.linalg.det(M))/np.prod(np.linalg.norm(M,axis=2),axis=1)
    sub=np.where(ok)[0];ok[sub[v>=1e-9]]=False
copset0=set(tuple(sorted(q)) for q in quads[worst<1e-8])
cs=[tuple(c) for c in cand[ok] if not any(tuple(sorted(sub)) in copset0 for sub in itertools.combinations(c,4))]
copset=set(tuple(sorted(q)) for q in quads[worst<1e-8])
spheres=merge_gen(cs,5,lambda sub:tuple(sorted(sub)) in copset)
print('cospherical 5-sets',len(cs),'spheres',len(spheres))
# tangency search: spheres through 4 named points tangent to insphere
iI=keys.index('I')
def sph(T,ids):
    Q=X[T][ids];A=2*(Q[:,1:]-Q[:,:1]);b=(Q[:,1:]**2).sum(-1)-(Q[:,:1]**2).sum(-1)
    c=np.linalg.solve(A,b[...,None])[...,0];r=np.linalg.norm(Q[:,0]-c,axis=1);return c,r
inr=[]
for T in range(NT):
    d=data[T];V=np.array([d['V%d'%i] for i in range(4)])
    inr.append(min(abs((d['I']-V[f[0]])@(np.cross(V[f[1]]-V[f[0]],V[f[2]]-V[f[0]])/np.linalg.norm(np.cross(V[f[1]]-V[f[0]],V[f[2]]-V[f[0]])))) for f in FACES))
nonc=quads[worst>1e-6]
okT=np.ones(len(nonc),bool)
for T in range(NT):
    c,r=sph(T,nonc[okT]);dI=np.linalg.norm(c-X[T][iI],axis=1)
    e=np.minimum(np.abs(dI-np.abs(r-inr[T])),np.abs(dI-(r+inr[T])))
    sub=np.where(okT)[0];okT[sub[e>=1e-8]]=False
tang=[lab(q) for q in nonc[okT]]
print('spheres through 4 named points tangent to insphere:',len(tang))
out=dict(mode=mode,keys=keys,dup=dup,lines=[lab(L) for L in lines],planes=[lab(p) for p in planes],
         spheres=[lab(s) for s in spheres],tangent=tang)
json.dump(out,open('res_%s.json'%mode,'w'),indent=0)
