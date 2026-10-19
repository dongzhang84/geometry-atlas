import json,re,numpy as np,pickle
from evaldb import evaluate
E={int(k):v for k,v in json.load(open('ents.json')).items()}
tris=[(np.array([0.3,3.1]),np.array([-1.7,0.0]),np.array([4.1,0.2])),(np.array([1.3,2.6]),np.array([-2.2,-0.4]),np.array([3.5,0.1])),(np.array([-0.4,2.2]),np.array([-2.9,-0.7]),np.array([2.6,-0.3]))]
Xs=[evaluate(*t) for t in tris]
keys=set(Xs[0])&set(Xs[1])&set(Xs[2])
lines={}
for k,v in E.items():
    txt=' '.join(v)
    m=re.search(r'lies on these lines:(.*?)(?:X\(\d+\) =|X\(\d+\) is|$)',txt)
    if not m:continue
    prs=re.findall(r'\{\s*(\d+)\s*,\s*(\d+)\s*\}',m.group(1)) or re.findall(r'(\d+)\s*,\s*(\d+)',m.group(1))
    lines[k]=[(int(i),int(j)) for i,j in prs]
def col(P,Q,R):u=Q-P;v=R-P;return abs(u[0]*v[1]-u[1]*v[0])/(np.linalg.norm(u)*np.linalg.norm(v)+1e-300)
status={}
for k in keys:
    ok=bad=0
    for i,j in lines.get(k,[]):
        if i in keys and j in keys and i!=k and j!=k:
            if all(col(X[k],X[i],X[j])<1e-7 for X in Xs):ok+=1
            else:bad+=1
    status[k]=(ok,bad)
good=[k for k,(o,b) in status.items() if o>=2 and b<=o//5]
susp=[k for k,(o,b) in status.items() if b>o//5]
print('keys',len(keys),'verified',len(good),'suspicious',len(susp),'unverifiable',len(keys)-len(good)-len(susp))
print('suspicious sample',sorted(susp)[:40])
pickle.dump(dict(good=sorted(good),susp=sorted(susp),status=status),open('valid.pkl','wb'))
import sys;sys.path.insert(0,'../../probe3');from centers import centers
trusted=set(centers(*tris[0]).keys())&keys
changed=True
while changed:
    changed=False
    for k in keys-trusted:
        ok=bad=0
        for i,j in lines.get(k,[]):
            if i in trusted and j in trusted and i!=k and j!=k:
                if all(col(X[k],X[i],X[j])<1e-7 for X in Xs):ok+=1
                else:bad+=1
        if ok>=2 and bad==0:trusted.add(k);changed=True
print('trusted (bootstrapped)',len(trusted))
pickle.dump(dict(trusted=sorted(trusted)),open('trusted.pkl','wb'))
