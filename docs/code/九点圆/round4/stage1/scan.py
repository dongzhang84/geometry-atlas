import sys,itertools,random,json;sys.path.insert(0,'.')
from centers import *
random.seed(7);tris=[]
while len(tris)<25:
    A,B,C=[np.array([random.uniform(-3,3),random.uniform(-3,3)]) for _ in range(3)]
    sides=sorted([np.linalg.norm(B-C),np.linalg.norm(C-A),np.linalg.norm(A-B)])
    ok=abs(cr(B-A,C-A))>2 and min(sides[1]-sides[0],sides[2]-sides[1])/sides[2]>0.05
    for X_,Y,Z in [(A,B,C),(B,C,A),(C,A,B)]:
        u=Y-X_;v=Z-X_
        if abs(u@v)/np.linalg.norm(u)/np.linalg.norm(v)>0.93:ok=False
    if ok:tris.append((A,B,C))
data=[centers(*t) for t in tris];keys=sorted(data[0]);n=len(keys)
P=np.array([[d[k] for k in keys] for d in data])  # T x n x 2
def colv(i,j,k):
    p,q,r=P[:,i],P[:,j],P[:,k];u=q-p;v=r-p
    return np.max(np.abs(u[:,0]*v[:,1]-u[:,1]*v[:,0])/(np.linalg.norm(u,axis=1)*np.linalg.norm(v,axis=1)))
dist=lambda i,j:np.min(np.linalg.norm(P[:,i]-P[:,j],axis=1))
C3=[t for t in itertools.combinations(range(n),3) if colv(*t)<1e-8 and min(dist(t[0],t[1]),dist(t[0],t[2]),dist(t[1],t[2]))>1e-6]
# maximal lines: group by pairs
lines=[]
for t in C3:
    S=set(t)
    for L in lines:
        if len(L&S)>=2:L|=S;break
    else:lines.append(S)
ch=True
while ch:
    ch=False
    for i in range(len(lines)):
        for j in range(i+1,len(lines)):
            if len(lines[i]&lines[j])>=2:lines[i]|=lines.pop(j);ch=True;break
        if ch:break
# verify
lines=[sorted(L) for L in lines if all(colv(*t)<1e-8 for t in itertools.combinations(sorted(L),3))]
# concyclic (non-collinear)
idx=np.array(list(itertools.combinations(range(n),4)))
worst=np.zeros(len(idx))
for T in range(P.shape[0]):
    Q=P[T][idx]  # m x4x2
    M=np.concatenate([(Q**2).sum(-1,keepdims=True),Q,np.ones(Q.shape[:2]+(1,))],-1)
    nr=np.prod(np.linalg.norm(M,axis=2),axis=1)
    worst=np.maximum(worst,np.abs(np.linalg.det(M))/nr)
cand=idx[worst<1e-9]
lineset=[set(L) for L in lines]
cyc=[tuple(q) for q in cand if not any(len(set(q)&L)>=3 for L in lineset)]
circles=[]
for q in cyc:
    S=set(q)
    for Cc in circles:
        if len(Cc&S)>=3:Cc|=S;break
    else:circles.append(S)
# curves
curv={}
for k in range(n):
    on=[]
    for nm,f in [('外接圆',lambda d,X:np.linalg.norm(X-d[3])-np.linalg.norm(d['A']-d[3])),
                 ('九点圆',lambda d,X:np.linalg.norm(X-d[5])-np.linalg.norm(d['A']-d[3])/2),
                 ('内切圆',lambda d,X:np.linalg.norm(X-d[1])-d['r'])]:
        pass
    curv[k]=on
res=[]
for T,(A,B,C) in enumerate(tris):
    a=np.linalg.norm(B-C);b=np.linalg.norm(C-A);c=np.linalg.norm(A-B);s=(a+b+c)/2
    res.append(dict(R=np.linalg.norm(A-data[T][3]),r=abs(cr(B-A,C-A))/2/s))
oncurve={'外接圆':[],'九点圆':[],'内切圆':[]}
for i,k in enumerate(keys):
    e1=max(abs(np.linalg.norm(P[T,i]-data[T][3])-res[T]['R'])/res[T]['R'] for T in range(len(tris)))
    e2=max(abs(np.linalg.norm(P[T,i]-data[T][5])-res[T]['R']/2)/res[T]['R'] for T in range(len(tris)))
    e3=max(abs(np.linalg.norm(P[T,i]-data[T][1])-res[T]['r'])/res[T]['R'] for T in range(len(tris)))
    for nm,e in zip(oncurve,(e1,e2,e3)):
        if e<1e-9:oncurve[nm].append(k)
lab=lambda S:['X%d'%keys[i] for i in sorted(S)]
out=dict(n=n,keys=keys,triples=len(C3),lines=[lab(L) for L in sorted(lines,key=len,reverse=True)],
         circles=[lab(C_) for C_ in circles],oncurve={k:['X%d'%x for x in v] for k,v in oncurve.items()})
json.dump(out,open('res3.json','w'),ensure_ascii=False,indent=0)
print('centers',n,'collinear triples',len(C3),'lines',len(lines),'concyclic quads',len(cyc),'circles',len(circles))
for L in out['lines']:print(len(L),' '.join(L))
print('circles');[print(' '.join(c)) for c in out['circles']]
print(out['oncurve'])
