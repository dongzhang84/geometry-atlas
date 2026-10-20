import numpy as np,pickle,itertools
d=pickle.load(open('big.pkl','rb'));keys=d['keys'];P=d['P'];n=len(keys)
G=pickle.load(open('groups0.pkl','rb'))
def concyc_all(q):
    Q=P[:,list(q)]  # (8,4,2)
    M=np.concatenate([(Q**2).sum(-1,keepdims=True),Q,np.ones(Q.shape[:2]+(1,))],-1)
    nr=np.prod(np.linalg.norm(M,axis=2),axis=1)
    return np.max(np.abs(np.linalg.det(M))/nr)
def colin_all(q):
    Q=P[:,list(q)];u=Q[:,1]-Q[:,0];v=Q[:,2]-Q[:,0]
    return np.max(np.abs(u[:,0]*v[:,1]-u[:,1]*v[:,0])/(np.linalg.norm(u,axis=1)*np.linalg.norm(v,axis=1)))
quads=set();seen=set()
for g in G:
    g=sorted(g)
    for q in itertools.combinations(g,4):
        if q in seen:continue
        seen.add(q)
        if any(colin_all(t)<1e-9 for t in itertools.combinations(q,3)):continue
        if concyc_all(q)<1e-10:quads.add(q)
print('verified quads',len(quads))
# merge to circles: union quads sharing 3 points
circles=[]
for q in sorted(quads):
    S=set(q);merged=False
    for C in circles:
        if len(C&S)>=3:C|=S;merged=True;break
    if not merged:circles.append(S)
ch=True
while ch:
    ch=False
    for a in range(len(circles)):
        for b in range(a+1,len(circles)):
            if len(circles[a]&circles[b])>=3:circles[a]|=circles.pop(b);ch=True;break
        if ch:break
circ=[sorted(keys[i] for i in C) for C in circles]
circ.sort(key=lambda c:(-len(c),c))
pickle.dump(dict(circles=circ,quads=[tuple(keys[i] for i in q) for q in quads]),open('bigcircles.pkl','wb'))
import collections
print('circles',len(circ),collections.Counter(len(c) for c in circ).most_common())
for c in circ[:12]:print(len(c),c[:30])
