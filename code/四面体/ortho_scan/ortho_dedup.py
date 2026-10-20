# 第一步：在 6 个随机垂心四面体上跑现有的中心库和轨道点，找重合
import numpy as np,pickle,sys,collections
sys.path.insert(0,'.')
from build import build
from orbits import orbits
from tetlib import T
from tpts import rand_ortho2
lib=pickle.load(open('tetlib.pkl','rb'));orb=pickle.load(open('orbits.pkl','rb'))
KEYS=lib['keys'];num={k:i+1 for i,k in enumerate(KEYS)}
rng=np.random.default_rng(202);NT=6
def pick(k,want):
    while True:
        V=rand_ortho2(rng,k);t=T(V);x=t.bary(t.O)
        if want=='in' and x.min()>0.05:return V
        if want=='out' and x.min()<-0.05:return V
Vs=[pick(-1,'in'),pick(1,'out'),pick(-1,'out'),pick(1,'out'),pick(-1,'in'),pick(-1,'out')]
for V in Vs:
    for i,j,k,l in [(0,1,2,3),(0,2,1,3),(0,3,1,2)]:assert abs((V[i]-V[j])@(V[k]-V[l]))<1e-10
P=np.full((NT,len(KEYS),3),np.nan);ts=[]
for a,V in enumerate(Vs):
    L,t=build(V);ts.append(t);d={x[0]:x[3] for x in L}
    for b,k in enumerate(KEYS):
        if d.get(k) is not None:P[a,b]=d[k]
scale=np.array([np.linalg.norm(t.V-t.G,axis=1).max() for t in ts])
# 无定义或跑到无穷远
bad=[b for b in range(len(KEYS)) if np.isnan(P[:,b]).any() or (np.linalg.norm(P[:,b]-np.array([t.G for t in ts]),axis=1)/scale).max()>1e6]
print('无定义/无穷远',len(bad),[('T%d'%(b+1),KEYS[b]) for b in bad][:40])
ok=[b for b in range(len(KEYS)) if b not in set(bad)]
# 和顶点重合
vert=[b for b in ok if any(all(np.linalg.norm(P[a,b]-ts[a].V[v])<1e-7*scale[a] for a in range(NT)) for v in range(4))]
# 重合分组
X=np.concatenate([P[a][ok]/scale[a] for a in range(NT)],axis=1)
from scipy.spatial import cKDTree
tr=cKDTree(X);pairs=tr.query_pairs(1e-6)
par={b:b for b in ok}
def f(x):
    while par[x]!=x:par[x]=par[par[x]];x=par[x]
    return x
for i,j in pairs:
    bi,bj=ok[i],ok[j];ri,rj=f(bi),f(bj)
    if ri!=rj:par[max(ri,rj)]=min(ri,rj)
grp=collections.defaultdict(list)
for b in ok:grp[f(b)].append(b)
multi=[g for g in grp.values() if len(g)>1]
print('有效',len(ok),'不同的点',len(grp),'重合组',len(multi),'被并掉',sum(len(g)-1 for g in multi))
print('与顶点重合',[(('T%d'%(b+1)),KEYS[b]) for b in vert])
# 原子中心（去掉线性操作）的情况
lin=('comp(','acomp(','refO(','refI(','mid(','ref(')
atoms=[b for b in ok if not KEYS[b].startswith(lin)]
ga={f(b) for b in atoms};print('原子中心',len(atoms),'→ 不同的点',len(ga))
H=np.array([2*t.G-t.O for t in ts])
# 轨道点
runs=[orbits(t) for t in ts]
OK=orb['keys'];fam={}
def same_set(A,B,s):return len(A)==len(B) and all(min(np.linalg.norm(x-y) for y in B)<1e-7*s for x in A)
fbad=[];fdup=collections.defaultdict(list);finner=[]
good=[]
for k in OK:
    pts=[np.array(r[k][3]) for r in runs]
    if any(not np.all(np.isfinite(p)) for p in pts) or max(np.abs(p).max()/s for p,s in zip(pts,scale))>1e6:fbad.append(k);continue
    if min(np.linalg.norm(pts[0][x]-pts[0][y]) for x in range(len(pts[0])) for y in range(x))<1e-7*scale[0]:finner.append(k);continue
    d=[g for g in good if all(same_set(runs[a][g][3],runs[a][k][3],scale[a]) for a in range(NT))]
    if d:fdup[d[0]].append(k);continue
    good.append(k)
lnum={k:i+1 for i,k in enumerate(OK)}
print('轨道族',len(OK),'无定义',fbad,'族内重合',finner)
print('族与族重合',{('L%d'%lnum[g],orb['meta'][g][0]):[('L%d'%lnum[x],orb['meta'][x][0]) for x in v] for g,v in fdup.items()})
print('剩余轨道族',len(good),'点数',sum(orb['sizes'][k] for k in good))
# 轨道点与中心重合
cen=np.concatenate([P[a][ok]/scale[a] for a in range(NT)],axis=1);tr2=cKDTree(cen)
hit=[]
for k in good:
    for j in range(orb['sizes'][k]):
        x=np.concatenate([runs[a][k][3][j]/scale[a] for a in range(NT)]);dd,ii=tr2.query(x)
        if dd<1e-6:hit.append((k,j,KEYS[ok[ii]]))
print('轨道点与中心重合',hit[:20],len(hit))
pickle.dump(dict(Vs=Vs,P=P,KEYS=KEYS,ok=ok,bad=bad,grp=dict(grp),vert=vert,orb_good=good,fdup=dict(fdup),fbad=fbad,finner=finner,hit=hit,scale=scale),open('ortho_dedup.pkl','wb'))
