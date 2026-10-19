import numpy as np,sys,itertools
sys.path.insert(0,'../probe3');from centers import centers
def circ3(P,Q,R):
    M=np.array([2*(Q-P),2*(R-P)]);c=np.linalg.solve(M,[Q@Q-P@P,R@R-P@P]);return c,(P-c)@(P-c)
circles=[(2,6,37,100),(2,6,42,101),(2,32,39,110),(3,4,69,99),(3,9,40,101),(6,11,37,55),(6,39,76,99),(7,8,21,99),(8,55,65,100),(9,55,57,101),(21,35,36,110),(21,55,56,110),(31,38,75,99)]
rng=np.random.default_rng(2);tris=[]
while len(tris)<8:
    A,B,C=[rng.uniform(-3,3,2) for _ in range(3)];u=B-A;v=C-A
    if abs(u[0]*v[1]-u[1]*v[0])<5:continue
    tris.append((A,B,C))
Xs=[centers(*t) for t in tris];keys=sorted(Xs[0])
for Cn in circles:
    pairs=[];orth=[]
    for i,j in itertools.combinations_with_replacement(keys,2):
        ok=True;ok2=True
        for X in Xs:
            c,r2=circ3(X[Cn[0]],X[Cn[1]],X[Cn[2]])
            p,q=X[i]-c,X[j]-c
            sc=abs(r2)+np.linalg.norm(p)*np.linalg.norm(q)
            if abs(p@q-r2)/sc>1e-8:ok=False
            # inverse pair: collinear with c and p.q=r2
            if abs(p[0]*q[1]-p[1]*q[0])/(np.linalg.norm(p)*np.linalg.norm(q)+1e-300)>1e-8:ok2=False
            if not ok:break
        if ok:
            if i in Cn and j in Cn:continue
            (pairs if ok2 else orth).append((i,j))
    print('{'+','.join('X%d'%k for k in Cn)+'}');print('   反演对:',pairs);print('   共轭对(以它们为直径的圆与之正交):',orth)
