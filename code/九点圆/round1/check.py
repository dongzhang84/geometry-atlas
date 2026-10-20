from mpmath import mp, mpf, sqrt, matrix, det
import random
mp.dps=50
def P(x,y):return (mpf(x),mpf(y))
def sub(p,q):return (p[0]-q[0],p[1]-q[1])
def dot(p,q):return p[0]*q[0]+p[1]*q[1]
def nrm(p):return sqrt(dot(p,p))
def lin(*t):
    x=sum(c*p[0] for c,p in t);y=sum(c*p[1] for c,p in t);return (x,y)
def foot(Q,U,V):d=sub(V,U);k=dot(sub(Q,U),d)/dot(d,d);return (U[0]+k*d[0],U[1]+k*d[1])
def circum(A,B,C):
    ax,ay=A;bx,by=B;cx,cy=C;d=2*(ax*(by-cy)+bx*(cy-ay)+cx*(ay-by))
    return (((ax*ax+ay*ay)*(by-cy)+(bx*bx+by*by)*(cy-ay)+(cx*cx+cy*cy)*(ay-by))/d,((ax*ax+ay*ay)*(cx-bx)+(bx*bx+by*by)*(ax-cx)+(cx*cx+cy*cy)*(bx-ax))/d)
random.seed(7)
for trial in range(6):
    A,B,C=[P(random.uniform(-3,3),random.uniform(-3,3)) for _ in range(3)]
    a=nrm(sub(B,C));b=nrm(sub(C,A));c=nrm(sub(A,B))
    O=circum(A,B,C);H=lin((1,A),(1,B),(1,C),(-2,O));N=lin((mpf(1)/2,O),(mpf(1)/2,H));R=nrm(sub(A,O))
    I=lin((a/(a+b+c),A),(b/(a+b+c),B),(c/(a+b+c),C))
    Ia=lin((-a/(-a+b+c),A),(b/(-a+b+c),B),(c/(-a+b+c),C));Ib=lin((a/(a-b+c),A),(-b/(a-b+c),B),(c/(a-b+c),C));Ic=lin((a/(a+b-c),A),(b/(a+b-c),B),(-c/(a+b-c),C))
    Ua=foot(Ia,B,C);Ub=foot(Ib,C,A);Uc=foot(Ic,A,B)
    d=sub(I,N);F=(N[0]+d[0]/nrm(d)*R/2,N[1]+d[1]/nrm(d)*R/2)
    M=matrix([[p[0]**2+p[1]**2,p[0],p[1],1] for p in (F,Ua,Ub,Uc)])
    print(trial, mp.nstr(det(M),5))
