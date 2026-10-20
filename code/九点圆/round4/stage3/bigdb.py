# evaluate trusted centers on several well-conditioned triangles
import numpy as np,pickle
from evaldb import evaluate
T=pickle.load(open('trusted.pkl','rb'))['trusted']
rng=np.random.default_rng(2026)
tris=[]
while len(tris)<8:
    A=rng.uniform([-1.5,2.0],[1.5,3.5]);B=rng.uniform([-3.5,-0.6],[-2.0,0.4]);C=rng.uniform([2.0,-0.6],[3.5,0.4])
    s=sorted([np.linalg.norm(B-C),np.linalg.norm(C-A),np.linalg.norm(A-B)])
    if min(s[1]-s[0],s[2]-s[1])/s[2]<0.08:continue
    ok=True
    for X,Y,Z in ((A,B,C),(B,C,A),(C,A,B)):
        u=Y-X;v=Z-X;cs=u@v/np.linalg.norm(u)/np.linalg.norm(v)
        if cs>0.9 or cs<-0.2:ok=False   # avoid very sharp / obtuse>~101deg
    if ok:tris.append((A,B,C))
Xs=[evaluate(*t) for t in tris]
keys=[k for k in T if all(k in X for X in Xs)]
P=np.array([[X[k] for k in keys] for X in Xs])   # (8,n,2)
pickle.dump(dict(keys=keys,P=P,tris=tris),open('big.pkl','wb'))
print('points',len(keys),'max |coord|',np.abs(P).max())
