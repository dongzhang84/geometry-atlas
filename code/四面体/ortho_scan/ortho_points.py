# 第三步：定下垂心四面体扫描用的点集（6 个随机垂心四面体上的坐标）
import numpy as np,pickle,sys,collections
sys.path.insert(0,'.')
exec(open('ortho_new.py').read().split('res=[new_points')[0])
res=[new_points(V) for V in Vs]
from orbits import orbits
D=pickle.load(open('ortho_dedup.pkl','rb'));N=pickle.load(open('ortho_new.pkl','rb'))
KEYS=D['KEYS'];P=D['P'];num={k:i+1 for i,k in enumerate(KEYS)}
lin=('comp(','acomp(','refO(','refI(','mid(','ref(')
rep={b:min(g) for g in D['grp'].values() for b in g}
atoms=[b for b in D['ok'] if not KEYS[b].startswith(lin)]
seen=set();keep=[]
for b in atoms:
    r=rep[b]
    if r in seen:continue
    # 和某个线性操作点重合的原子点仍保留（取原子名）
    seen.add(r);keep.append(b)
labels=['T%d'%(b+1) for b in keep];names=[KEYS[b] for b in keep];kind=['c']*len(keep)
X=[[P[a][b] for b in keep] for a in range(NT)]
for i,k in enumerate(N['newc']):
    labels.append('H%d'%(i+1));names.append(k);kind.append('c')
    for a in range(NT):X[a].append(res[a][1][k][1])
oruns=[orbits(r[0]) for r in res];lib_o=pickle.load(open('orbits.pkl','rb'));lnum={k:i+1 for i,k in enumerate(lib_o['keys'])}
fams=[('L%d'%lnum[k],k,oruns[0][k][0],lambda a,k=k:oruns[a][k][3]) for k in D['orb_good']]
fams+=[('HL%d'%(i+1),k,N['meta_o'][k],lambda a,k=k:res[a][2][k][1]) for i,k in enumerate(N['newo'])]
for lab,k,nm,get in fams:
    for a in range(NT):
        for j,p in enumerate(get(a)):X[a].append(np.array(p,float))
    for j in range(len(get(0))):labels.append('%s.%d'%(lab,j));names.append(k);kind.append(len(get(0)))
X=np.array(X);print('中心',kind.count('c'),'轨道点',len(kind)-kind.count('c'),'合计',len(kind))
pickle.dump(dict(Vs=Vs,P=X,labels=labels,names=names,kind=kind),open('ortho_points.pkl','wb'))
