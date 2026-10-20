import sys;sys.path.insert(0,'.')
from p2b import *
random.seed(4);data=[]
while len(data)<30:
    A,B,C=[np.array([random.uniform(-3,3),random.uniform(-3,3)]) for _ in range(3)]
    if abs(cr(B-A,C-A))<4:continue
    w=np.array([random.uniform(0.15,1) for _ in range(3)]);P=(w[0]*A+w[1]*B+w[2]*C)/w.sum()
    out=config(A,B,C,P)
    if out is None:continue
    data.append(out)
names=list(data[0][0]);n=len(names)
X=np.array([[d[0][k] for k in names] for d in data])
coin=[(names[i],names[j]) for i,j in itertools.combinations(range(n),2) if np.max(np.linalg.norm(X[:,i]-X[:,j],axis=1))<1e-7]
print('coincident',coin)
# collinear
def colv(t):
    p,q,r=X[:,t[0]],X[:,t[1]],X[:,t[2]];u=q-p;v=r-p
    return np.max(np.abs(u[:,0]*v[:,1]-u[:,1]*v[:,0])/(np.linalg.norm(u,axis=1)*np.linalg.norm(v,axis=1)+1e-15))
C3=[t for t in itertools.combinations(range(n),3) if colv(t)<1e-8]
def merge(ts,k):
    sets=[set(t) for t in ts];ch=True
    while ch:
        ch=False
        for i in range(len(sets)):
            for j in range(i+1,len(sets)):
                if len(sets[i]&sets[j])>=k-1:sets[i]|=sets.pop(j);ch=True;break
            if ch:break
    return sets
lines=[sorted(L,key=lambda i:i) for L in merge(C3,3)]
print('LINES',len(lines))
for L in sorted(lines,key=len,reverse=True):print(' ',' '.join(names[i] for i in L))
# points on curves
print('ON CURVES')
for cn in data[0][1]:
    on=[]
    for i,k in enumerate(names):
        ok=True
        for d in data:
            M=d[1][cn];v=np.array([*d[0][k],1]);val=abs(v@M@v)/(np.linalg.norm(M)*(v@v))
            if val>1e-8:ok=False;break
        if ok:on.append(k)
    print(' ',cn,' '.join(on))
# tangency between curves
def tangent(M1,M2):
    # det(M1 + t M2) cubic coefficients via sampling
    ts=np.array([-1,0,1,2.]);vals=[np.linalg.det(M1/np.linalg.norm(M1)+t*M2/np.linalg.norm(M2)) for t in ts]
    co=np.polyfit(ts,vals,3);a,b,c,d=co
    disc=18*a*b*c*d-4*b**3*d+b*b*c*c-4*a*c**3-27*a*a*d*d
    return abs(disc)/np.sum(np.abs(co))**4
print('TANGENCY')
cn=list(data[0][1])
for x,y in itertools.combinations(cn,2):
    v=max(tangent(d[1][x],d[1][y]) for d in data)
    if v<1e-9:print('  相切:',x,y,'%.1e'%v)
