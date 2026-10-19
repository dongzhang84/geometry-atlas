import numpy as np,pickle,itertools
from evaldb import evaluate
tris=[(np.array([0.3,3.1]),np.array([-1.7,0.0]),np.array([4.1,0.2])),(np.array([1.3,2.6]),np.array([-2.2,-0.4]),np.array([3.5,0.1])),(np.array([-0.4,2.2]),np.array([-2.9,-0.7]),np.array([2.6,-0.3]))]
Xs=[evaluate(*t) for t in tris]
T=pickle.load(open('trusted.pkl','rb'))['trusted']
K=np.array(T);P=np.array([[X[k] for k in T] for X in Xs])  # (3,n,2)
pickle.dump((T,P),open('trustedP.pkl','wb'))
circles=[(2,6,37,100),(2,6,42,101),(2,32,39,110),(3,4,69,99),(3,9,40,101),(6,11,37,55),(6,39,76,99),(7,8,21,99),(8,55,65,100),(9,55,57,101),(21,35,36,110),(21,55,56,110),(31,38,75,99)]
def circ3(P1,P2,P3):
    M=np.array([2*(P2-P1),2*(P3-P1)]);c=np.linalg.solve(M,[P2@P2-P1@P1,P3@P3-P1@P1]);return c,(P1-c)@(P1-c)
def inter(P1,P2,P3,P4):M=np.array([P2-P1,P3-P4]).T;t=np.linalg.solve(M,P3-P1);return P1+t[0]*(P2-P1)
def find(pt_list):
    d=np.max([np.linalg.norm(P[t]-pt_list[t],axis=1)/(1+np.linalg.norm(pt_list[t])) for t in range(3)],axis=0)
    return [int(K[i]) for i in np.where(d<1e-7)[0]]
for Cn in circles:
    print('{'+','.join('X%d'%k for k in Cn)+'}')
    idx={k:T.index(k) for k in Cn}
    cs=[circ3(*[P[t][idx[k]] for k in Cn[:3]]) for t in range(3)]
    print('   圆心 =',find([c for c,_ in cs]))
    for (p,q),(r,s) in [((Cn[0],Cn[1]),(Cn[2],Cn[3])),((Cn[0],Cn[2]),(Cn[1],Cn[3])),((Cn[0],Cn[3]),(Cn[1],Cn[2]))]:
        M=[inter(P[t][idx[p]],P[t][idx[q]],P[t][idx[r]],P[t][idx[s]]) for t in range(3)]
        print(f'   X{p}X{q} ∩ X{r}X{s} =',find(M))
    # conjugate pairs (diameter circles orthogonal) among trusted: (Xi-c).(Xj-c)=r2
    hits=[]
    for t in range(3):
        c,r2=cs[t];Q=P[t]-c
        G=Q@Q.T-r2;sc=np.abs(r2)+np.linalg.norm(Q,axis=1)[:,None]*np.linalg.norm(Q,axis=1)[None,:]
        hits.append(np.abs(G)/sc<1e-8)
    H=hits[0]&hits[1]&hits[2];ii,jj=np.where(np.triu(H))
    prs=[(int(K[i]),int(K[j])) for i,j in zip(ii,jj) if not (K[i] in Cn and K[j] in Cn)]
    print('   以下两点为直径的圆与之正交:',prs[:25],'... 共',len(prs))
