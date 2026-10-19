import numpy as np,pickle
from evaldb import evaluate
d=pickle.load(open('big.pkl','rb'));tris=d['tris']
Xs=[evaluate(*t) for t in tris]
keys=sorted(set.intersection(*[set(X) for X in Xs]))
Pall=np.array([[X[k] for k in keys] for X in Xs])
# excentral & other derived triangles
def derived(A,B,C):
    a=np.linalg.norm(B-C);b=np.linalg.norm(C-A);c=np.linalg.norm(A-B);s=(a+b+c)/2
    Ia=(-a*A+b*B+c*C)/(-a+b+c);Ib=(a*A-b*B+c*C)/(a-b+c);Ic=(a*A+b*B-c*C)/(a+b-c)
    along=lambda P_,Q_,d:P_+(Q_-P_)*d/np.linalg.norm(Q_-P_)
    M=np.array([[A[0],B[0],C[0]],[A[1],B[1],C[1]],[1,1,1]])
    O=np.linalg.solve(np.array([2*(B-A),2*(C-A)]),[B@B-A@A,C@C-A@A])
    def tang(V,W):nV=V-O;nW=W-O;return np.linalg.solve(np.array([nV,nW]),[nV@V,nW@W])
    return {'外心三角形':(Ia,Ib,Ic),'切点三角形':(along(B,C,s-b),along(C,A,s-c),along(A,B,s-a)),'切线三角形':(tang(B,C),tang(C,A),tang(A,B))}
D={}
for name in ['外心三角形','切点三角形','切线三角形']:
    Ys=[evaluate(*derived(*t)[name]) for t in tris]
    ks=sorted(set.intersection(*[set(Y) for Y in Ys]))
    D[name]=(ks,np.array([[Y[k] for k in ks] for Y in Ys]))
pickle.dump(dict(keys=keys,Pall=Pall,D=D),open('bigall.pkl','wb'))
print(len(keys),{k:len(v[0]) for k,v in D.items()})
