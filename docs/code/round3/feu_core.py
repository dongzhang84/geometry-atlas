import numpy as np, itertools
def setup(A,B,C,P):
    def cond(U,V):return [U[0]*V[0],U[0]*V[1]+U[1]*V[0],U[1]*V[1]]
    M=np.array([cond(B-C,A-P),cond(C-A,B-P)]);s=np.linalg.svd(M)[2][-1]
    S=np.array([[s[0],s[1]],[s[1],s[2]]])
    def row(X):x,y=X;return [x*x,x*y,y*y,x,y,1]
    Ma,Mb,Mc=(B+C)/2,(C+A)/2,(A+B)/2;Ka,Kb,Kc=(A+P)/2,(B+P)/2,(C+P)/2
    def inter(P1,P2,P3,P4):
        Mx=np.array([P2-P1,P3-P4]).T;t=np.linalg.solve(Mx,P3-P1);return P1+t[0]*(P2-P1)
    Da,Db,Dc=inter(A,P,B,C),inter(B,P,C,A),inter(C,P,A,B)
    nine=[Ma,Mb,Mc,Ka,Kb,Kc,Da,Db,Dc]
    g=np.linalg.svd(np.array([row(X) for X in nine]))[2][-1]
    Q=np.array([[g[0],g[1]/2],[g[1]/2,g[2]]])
    lam=(Q.ravel()@S.ravel())/(S.ravel()@S.ravel())
    print('Gamma quad part ∝ S, resid',np.linalg.norm(Q-lam*S)/np.linalg.norm(Q),' nine-point resid',max(abs(np.array(row(X))@g) for X in nine))
    # Gamma as (x-N)S(x-N)=rho
    N=np.linalg.solve(2*lam*S,-np.array(g[3:5]));rhoN=(N@(lam*S)@N-g[5])/lam
    sides=[(B,C),(C,A),(A,B)]
    us=[(V-U)/np.linalg.norm(V-U) for U,V in sides]
    q=[u@S@u for u in us]
    print('side types uSu',q,' det S',np.linalg.det(S))
    sgn=np.sign(q[0])
    circles=[]
    if all(np.sign(x)==sgn for x in q):
        w=[np.sqrt(abs(x)) for x in q]
        for sig in [(1,1,1),(-1,1,1),(1,-1,1),(1,1,-1)]:
            # signed distance cross(u, c-U) = sig_i w_i k  -> linear in (c,k)
            Mx=[];rh=[]
            for (U,V),u,wi,si in zip(sides,us,w,sig):
                Mx.append([-u[1],u[0],-si*wi]);rh.append(-u[1]*U[0]+u[0]*U[1])
            c0,c1,k=np.linalg.solve(np.array(Mx),np.array(rh));c=np.array([c0,c1])
            rho=np.linalg.det(S)*k*k*sgn  # rho = detS * d^2/(uSu) with d=w k
            circles.append((c,rho))
    return dict(S=S,N=N,rhoN=rhoN,nine=nine,circles=circles,D=(Da,Db,Dc),M=(Ma,Mb,Mc),K=(Ka,Kb,Kc))
def tangent_check(S,c1,r1,c2,r2):
    # radical line: (x-c1)S(x-c1)-r1 - [(x-c2)S(x-c2)-r2] = 0 -> 2x S(c2-c1) + c1Sc1-c2Sc2 -r1+r2 =0
    n=2*S@(c2-c1);h=-(c1@S@c1-c2@S@c2-r1+r2)
    # line n.x = h ; point p on line, direction u
    u=np.array([-n[1],n[0]]);u/=np.linalg.norm(u);p=n*h/(n@n)
    w=p-c1;a=u@S@u;b=u@S@w;cc=w@S@w-r1
    return (b*b-a*cc)/(abs(b*b)+abs(a*cc)+1e-30)
