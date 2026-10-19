import numpy as np,pickle,sys
sys.path.insert(0,'.')
from orbits import *
from tpts import rand_tetra
rng=np.random.default_rng(101);Vs=[rand_tetra(rng) for _ in range(6)]
lib=pickle.load(open('tetlib.pkl','rb'))
runs=[orbits(T(V)) for V in Vs]
perm=[2,0,3,1];rp=orbits(T(Vs[0][perm]))
keys=list(runs[0]);good=[];notes={}
def same_set(A,B):
    return len(A)==len(B) and all(min(np.linalg.norm(a-b) for b in B)<1e-7*(1+np.linalg.norm(a)) for a in A)
for k in keys:
    pts=[r[k][3] for r in runs]
    if any(not np.all(np.isfinite(np.array(p))) for p in pts):print('无定义',k);continue
    if not same_set(runs[0][k][3],rp[k][3]):print('不是轨道',k);continue
    # 族内点是否互不相同
    p0=np.array(pts[0])
    if min(np.linalg.norm(p0[a]-p0[b]) for a in range(len(p0)) for b in range(a))<1e-6:print('族内重合',k);continue
    dup=[g for g in good if all(same_set(runs[s][g][3],runs[s][k][3]) for s in range(6))]
    if dup:notes.setdefault(dup[0],[]).append(k);continue
    good.append(k)
print(len(keys),'族 有效',len(good),'点数',sum(len(runs[0][k][3]) for k in good))
for g,a in notes.items():print(g,'=',a)
# 有没有轨道点和中心重合（不应出现）
pickle.dump(dict(keys=good,meta={k:runs[0][k][:3] for k in good},sizes={k:len(runs[0][k][3]) for k in good},alias=notes,pts=[{k:np.array(r[k][3]) for k in good} for r in runs]),open('orbits.pkl','wb'))
