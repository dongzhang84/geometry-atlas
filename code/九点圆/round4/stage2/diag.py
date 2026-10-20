import numpy as np,sys,itertools
sys.path.insert(0,'../probe3');from centers import centers
circles=[(2,6,37,100),(2,6,42,101),(2,32,39,110),(3,4,69,99),(3,9,40,101),(6,11,37,55),(6,39,76,99),(7,8,21,99),(8,55,65,100),(9,55,57,101),(21,35,36,110),(21,55,56,110),(31,38,75,99)]
rng=np.random.default_rng(4);tris=[]
while len(tris)<8:
    A,B,C=[rng.uniform(-3,3,2) for _ in range(3)];u=B-A;v=C-A
    if abs(u[0]*v[1]-u[1]*v[0])<5:continue
    tris.append((A,B,C))
Xs=[centers(*t) for t in tris];keys=sorted(Xs[0])
def inter(P,Q,R,S):M=np.array([Q-P,R-S]).T;t=np.linalg.solve(M,R-P);return P+t[0]*(Q-P)
def col(P,Q,R):u=Q-P;v=R-P;return abs(u[0]*v[1]-u[1]*v[0])/(np.linalg.norm(u)*np.linalg.norm(v)+1e-300)
for Cn in circles:
    print('{'+','.join('X%d'%k for k in Cn)+'}')
    for (p,q),(r,s) in [((Cn[0],Cn[1]),(Cn[2],Cn[3])),((Cn[0],Cn[2]),(Cn[1],Cn[3])),((Cn[0],Cn[3]),(Cn[1],Cn[2]))]:
        on1=[k for k in keys if k not in (p,q) and all(col(X[p],X[q],X[k])<1e-8 for X in Xs)]
        on2=[k for k in keys if k not in (r,s) and all(col(X[r],X[s],X[k])<1e-8 for X in Xs)]
        Ms=[inter(X[p],X[q],X[r],X[s]) for X in Xs]
        M=[k for k in keys if all(np.linalg.norm(m-X[k])<1e-7*(1+np.linalg.norm(m)) for m,X in zip(Ms,Xs))]
        print(f'   X{p}X{q} 线上: {on1} | X{r}X{s} 线上: {on2} | 交点= {M}')
