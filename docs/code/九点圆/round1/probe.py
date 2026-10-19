import numpy as np, itertools, random, math
def cr(u,v):return u[0]*v[1]-u[1]*v[0]
def circum(A,B,C):
    ax,ay=A;bx,by=B;cx,cy=C;d=2*(ax*(by-cy)+bx*(cy-ay)+cx*(ay-by))
    ux=((ax*ax+ay*ay)*(by-cy)+(bx*bx+by*by)*(cy-ay)+(cx*cx+cy*cy)*(ay-by))/d
    uy=((ax*ax+ay*ay)*(cx-bx)+(bx*bx+by*by)*(ax-cx)+(cx*cx+cy*cy)*(bx-ax))/d
    return np.array([ux,uy])
def foot(P,U,V):d=V-U;return U+d*np.dot(P-U,d)/np.dot(d,d)
def inter(P,Q,R,S):
    M=np.array([Q-P,R-S]).T;t=np.linalg.solve(M,R-P);return P+t[0]*(Q-P)
def pts(A,B,C):
    a=np.linalg.norm(B-C);b=np.linalg.norm(C-A);c=np.linalg.norm(A-B);s=(a+b+c)/2
    O=circum(A,B,C);H=A+B+C-2*O;G=(A+B+C)/3;N=(O+H)/2;R=np.linalg.norm(A-O)
    I=(a*A+b*B+c*C)/(a+b+c);r=math.sqrt(s*(s-a)*(s-b)*(s-c))/s
    Ia=(-a*A+b*B+c*C)/(-a+b+c);Ib=(a*A-b*B+c*C)/(a-b+c);Ic=(a*A+b*B-c*C)/(a+b-c)
    Ta=foot(I,B,C);Tb=foot(I,C,A);Tc=foot(I,A,B)
    Ea_=foot(Ia,B,C);Eb_=foot(Ib,C,A);Ec_=foot(Ic,A,B)
    P=dict(A=A,B=B,C=C,O=O,G=G,H=H,N=N,I=I,Ia=Ia,Ib=Ib,Ic=Ic,
      Ma=(B+C)/2,Mb=(C+A)/2,Mc=(A+B)/2,Ha=foot(A,B,C),Hb=foot(B,C,A),Hc=foot(C,A,B),
      Ea=(A+H)/2,Eb=(B+H)/2,Ec=(C+H)/2,Ta=Ta,Tb=Tb,Tc=Tc,Ua=Ea_,Ub=Eb_,Uc=Ec_,
      Ge=inter(A,Ta,B,Tb),Na=inter(A,Ea_,B,Eb_),K=(a*a*A+b*b*B+c*c*C)/(a*a+b*b+c*c),
      Sp=((b+c)*A+(c+a)*B+(a+b)*C)/(2*(a+b+c)),L=2*O-H,
      F=N+(I-N)/np.linalg.norm(I-N)*R/2,
      Aa=2*O-A,Ab=2*O-B,Ac=2*O-C)
    return P
names=None;data=[]
random.seed(1)
for _ in range(25):
    while True:
        A,B,C=[np.array([random.uniform(-3,3),random.uniform(-3,3)]) for _ in range(3)]
        ang=[ ]
        ok=True
        for X,Y,Z in [(A,B,C),(B,C,A),(C,A,B)]:
            u=Y-X;v=Z-X;cs=np.dot(u,v)/np.linalg.norm(u)/np.linalg.norm(v)
            if abs(cs)>0.93: ok=False
        if ok and abs(cr(B-A,C-A))>2: break
    P=pts(A,B,C);names=list(P);data.append(P)
n=len(names);print("points",n,names)
def scale(P):return max(np.linalg.norm(P[k]) for k in ('A','B','C'))
def col(p,q,r):return abs(cr(q-p,r-p))/(np.linalg.norm(q-p)*np.linalg.norm(r-p)+1e-12)
def cyc(p,q,r,s):
    M=np.array([[x[0]**2+x[1]**2,x[0],x[1],1] for x in (p,q,r,s)]);
    nrm=np.prod([np.linalg.norm(row) for row in M]);return abs(np.linalg.det(M))/nrm
def distinct(ks):
    return all(min(np.linalg.norm(P[x]-P[y]) for P in data)>1e-6 for x,y in itertools.combinations(ks,2))
C3=[t for t in itertools.combinations(names,3) if distinct(t) and all(col(*[P[k] for k in t])<1e-7 for P in data)]
C4=[t for t in itertools.combinations(names,4) if distinct(t) and all(cyc(*[P[k] for k in t])<1e-9 for P in data)]
# merge into maximal sets
def merge(triples,k):
    sets=[]
    for t in triples:
        t=set(t);placed=False
        for S in sets:
            if len(S&t)>=k-1:
                # verify union condition: all k-subsets hold? approximate: accept
                S|=t;placed=True;break
        if not placed:sets.append(t)
    changed=True
    while changed:
        changed=False
        for i in range(len(sets)):
            for j in range(i+1,len(sets)):
                if len(sets[i]&sets[j])>=k-1:sets[i]|=sets[j];sets.pop(j);changed=True;break
            if changed:break
    return sets
lines=merge(C3,3);circles=merge(C4,4)
import json
json.dump({"lines":[sorted(s) for s in lines],"circles":[sorted(s) for s in circles]},open("res.json","w"),ensure_ascii=False)
print("collinear triples",len(C3),"lines",len(lines));print("concyclic quads",len(C4),"circles",len(circles))
for s in sorted(lines,key=len,reverse=True):print("L",sorted(s))
print()
for s in sorted(circles,key=len,reverse=True):print("C",sorted(s))
