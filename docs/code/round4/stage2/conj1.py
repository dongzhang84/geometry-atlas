import numpy as np
rng=np.random.default_rng(0)
def run(trials=5):
  for _ in range(trials):
    A,B,C=[rng.uniform(-3,3,2) for _ in range(3)]
    a2,b2,c2=(B-C)@(B-C),(C-A)@(C-A),(A-B)@(A-B)
    M=np.array([[A[0],B[0],C[0]],[A[1],B[1],C[1]],[1,1,1]])
    cart=lambda w:(M@(np.array(w)/sum(w)))[:2]
    bary=lambda X:np.linalg.solve(M,[X[0],X[1],1])
    G=np.ones(3)/3;K=np.array([a2,b2,c2]);K=K/K.sum()
    P=rng.dirichlet([1,1,1])  # random P bary
    # line G + t(P-G); circumcircle: a2 yz+b2 zx+c2 xy=0 with x+y+z=1
    d=P-G
    f=lambda t:(lambda w:a2*w[1]*w[2]+b2*w[2]*w[0]+c2*w[0]*w[1])(G+t*d)
    # quadratic coefficients
    f0=f(0);f1=f(1);fm=f(-1);qa=(f1+fm)/2-f0;qb=(f1-fm)/2
    ts=np.roots([qa,qb,f0]);U=G+ts[0]*d;V=G+ts[1]*d
    for prod_name,Z in (('bary',U*V),('tril',U*V/np.array([a2**0.5,b2**0.5,c2**0.5]))):
        Zc=cart(Z);on=abs((lambda w:a2*w[1]*w[2]+b2*w[2]*w[0]+c2*w[0]*w[1])(Z/Z.sum()))
        pts=[cart(G),cart(K),cart(P),Zc]
        Mx=np.array([[p@p,p[0],p[1],1] for p in pts]);Mx=Mx/np.linalg.norm(Mx,axis=0)
        print(prod_name,'Z on circumcircle resid',on,' concyc(G,K,P,Z)',abs(np.linalg.det(Mx)))
run()
