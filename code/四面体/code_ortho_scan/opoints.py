# 垂心四面体点集：913 个原子中心 + 254 个轨道点 = 1167 个点；6 个随机垂心四面体上的坐标 P[t][i]；按顶点对称的规范形 canon()
import pickle,numpy as np,itertools,time,collections,sys
from tetlib import EDGES
_d=pickle.load(open('ortho_points.pkl','rb'))
labels=_d['labels'];kind=_d['kind'];P=_d['P']
oidx=[None if k=='c' else (l.rsplit('.',1)[0],int(l.rsplit('.',1)[1])) for l,k in zip(labels,kind)]
P=np.array(P);N=P.shape[1];NT=6
print('点数',N,flush=True)
PAIRS=[((0,1),(2,3)),((0,2),(1,3)),((0,3),(1,2))]
def lab_perm(i,s):
    if kind[i]=='c':return labels[i]
    L,j=oidx[i];k=kind[i]
    if k==4:return '%s.%d'%(L,s[j])
    if k==6:e=EDGES[j];return '%s.%d'%(L,EDGES.index(tuple(sorted((s[e[0]],s[e[1]])))))
    p=PAIRS[j];q=tuple(sorted((tuple(sorted((s[p[0][0]],s[p[0][1]]))),tuple(sorted((s[p[1][0]],s[p[1][1]]))))))
    return '%s.%d'%(L, [tuple(sorted(pp)) for pp in [tuple(sorted(x)) for x in PAIRS]].index(q))
PERMS=list(itertools.permutations(range(4)))
def canon(S):
    return min(tuple(sorted(lab_perm(i,s) for i in S)) for s in PERMS)
scale=np.array([np.linalg.norm(P[t]-P[t].mean(0),axis=1).max() for t in range(NT)])
def rank_ok(S,dim,tol=1e-9):
    for t in range(NT):
        X=P[t][list(S)];X=X-X.mean(0);s=np.linalg.svd(X,compute_uv=False)
        if s[dim]>tol*max(s[0],1e-300):return False
    return True
a={'Vs':_d['Vs']};names=_d['names']
