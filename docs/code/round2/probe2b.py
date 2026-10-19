import numpy as np, itertools, random, math
def cr(u,v):return u[0]*v[1]-u[1]*v[0]
def circum(A,B,C):
    ax,ay=A;bx,by=B;cx,cy=C;d=2*(ax*(by-cy)+bx*(cy-ay)+cx*(ay-by))
    return np.array([((ax*ax+ay*ay)*(by-cy)+(bx*bx+by*by)*(cy-ay)+(cx*cx+cy*cy)*(ay-by))/d,((ax*ax+ay*ay)*(cx-bx)+(bx*bx+by*by)*(ax-cx)+(cx*cx+cy*cy)*(bx-ax))/d])
def foot(P,U,V):d=V-U;return U+d*np.dot(P-U,d)/np.dot(d,d)
def inter(P,Q,R,S):M=np.array([Q-P,R-S]).T;t=np.linalg.solve(M,R-P);return P+t[0]*(Q-P)
def row(p):x,y=p;return [x*x,x*y,y*y,x,y,1]
def conic(points,extra=None):
    M=np.array([row(p) for p in points]+([extra] if extra else []));_,_,vt=np.linalg.svd(M);c=vt[-1];return c/np.linalg.norm(c)
def ev(c,p):return np.dot(c,row(p))
def center(c):a,b,cc,d,e,f=c;return np.linalg.solve([[2*a,b],[b,2*cc]],[-d,-e])
def bary(P,A,B,C):
    M=np.array([[A[0],B[0],C[0]],[A[1],B[1],C[1]],[1,1,1]]);return np.linalg.solve(M,[P[0],P[1],1])
def frombary(w,A,B,C):w=w/np.sum(w);return w[0]*A+w[1]*B+w[2]*C
def fourth_on_circle(cen,R,co,known):
    th=np.linspace(0,2*np.pi,4001);f=[ev(co,cen+R*np.array([math.cos(t),math.sin(t)])) for t in th];roots=[]
    for i in range(len(th)-1):
        if f[i]==0 or f[i]*f[i+1]<0:
            lo,hi=th[i],th[i+1]
            for _ in range(60):
                m=(lo+hi)/2;fm=ev(co,cen+R*np.array([math.cos(m),math.sin(m)]))
                if fm*ev(co,cen+R*np.array([math.cos(lo),math.sin(lo)]))<=0:hi=m
                else:lo=m
            roots.append(cen+R*np.array([math.cos(lo),math.sin(lo)]))
    cand=[r for r in roots if min(np.linalg.norm(r-k) for k in known)>1e-4]
    return cand[0] if len(cand)==1 else None
def config(A,B,C,P):
    a=np.linalg.norm(B-C);b=np.linalg.norm(C-A);c=np.linalg.norm(A-B)
    O=circum(A,B,C);R=np.linalg.norm(A-O);H=A+B+C-2*O;G=(A+B+C)/3;N=(O+H)/2
    I=(a*A+b*B+c*C)/(a+b+c)
    Ma,Mb,Mc=(B+C)/2,(C+A)/2,(A+B)/2;Ka,Kb,Kc=(A+P)/2,(B+P)/2,(C+P)/2
    Da,Db,Dc=inter(A,P,B,C),inter(B,P,C,A),inter(C,P,A,B)
    Gam=conic([Ma,Mb,Mc,Ka,Kb])
    u=bary(P,A,B,C)
    Pstar=frombary(np.array([a*a/u[0],b*b/u[1],c*c/u[2]]),A,B,C)
    Piso=frombary(1/u,A,B,C)
    rh=conic([A,B,C,P],extra=[1,0,1,0,0,0]);Po=center(rh)
    Om=conic([A,B,C,2*Ka-P+P*0+ (2*Kb-P)*0 if False else A, B])  # placeholder
    Om=conic([A,B,C,2*Ma-P,2*Mb-P])  # image of Gam under homothety(P,2): Ma->2Ma-P
    X4=fourth_on_circle(O,R,Om,[A,B,C])
    Y4=fourth_on_circle(N,R/2,Gam,[Ma,Mb,Mc])
    Fa,Fb,Fc=foot(P,B,C),foot(P,C,A),foot(P,A,B)
    pts=dict(A=A,B=B,C=C,P=P,O=O,H=H,G=G,N=N,I=I,Ma=Ma,Mb=Mb,Mc=Mc,Ka=Ka,Kb=Kb,Kc=Kc,Da=Da,Db=Db,Dc=Dc,
      G4=(A+B+C+P)/4,Q=(A+B+C-P)/2,aP=A+B+C-2*P,Pstar=Pstar,Piso=Piso,Po=Po,X4=X4,Y4=Y4,Fa=Fa,Fb=Fb,Fc=Fc,
      Ha=foot(A,B,C),Hb=foot(B,C,A),Hc=foot(C,A,B),Pr=2*O-P, PH=(P+H)/2, PO=(P+O)/2)
    curves=dict(Gamma=Gam,Omega=Om,circum=conic([A,B,C,2*O-A,2*O-B]),npc=conic([Ma,Mb,Mc,foot(A,B,C),foot(B,C,A)]),
      pedal=conic([Fa,Fb,Fc,Fa+0,Fa]) if False else None)
    # pedal circle through Fa,Fb,Fc
    pc=circum(Fa,Fb,Fc);pr=np.linalg.norm(Fa-pc);curves['pedalcircle']=conic([Fa,Fb,Fc,pc+pr*np.array([0.6,0.8]),pc+pr*np.array([-1,0])])
    curves.pop('pedal')
    return pts,curves

import json
random.seed(3);data=[]
while len(data)<30:
    A,B,C,P=[np.array([random.uniform(-3,3),random.uniform(-3,3)]) for _ in range(4)]
    if abs(cr(B-A,C-A))<3:continue
    if not all(abs(cr(Y-X,P-X))>0.8 for X,Y in [(A,B),(B,C),(C,A)]):continue
    try:pts,cur=config(A,B,C,P)
    except Exception:continue
    if any(v is None for v in pts.values()):continue
    data.append((pts,cur))
names=list(data[0][0])
# coincident points
coin=[(x,y) for x,y in itertools.combinations(names,2) if max(np.linalg.norm(d[0][x]-d[0][y]) for d in data)<1e-6]
print('coincident',coin)
drop={y for x,y in coin};names=[n for n in names if n not in drop]
def col(p,q,r):return abs(cr(q-p,r-p))/(np.linalg.norm(q-p)*np.linalg.norm(r-p)+1e-12)
def cyc(p,q,r,s):
    M=np.array([[x[0]**2+x[1]**2,x[0],x[1],1] for x in (p,q,r,s)]);return abs(np.linalg.det(M))/np.prod([np.linalg.norm(rw) for rw in M])
def distinct(ks):return all(min(np.linalg.norm(d[0][x]-d[0][y]) for d in data)>1e-5 for x,y in itertools.combinations(ks,2))
C3=[t for t in itertools.combinations(names,3) if distinct(t) and all(col(*[d[0][k] for k in t])<1e-7 for d in data)]
C3s=set(C3)
C4=[t for t in itertools.combinations(names,4) if distinct(t) and all(cyc(*[d[0][k] for k in t])<1e-8 for d in data)
    and not any(tuple(sorted(sub,key=names.index)) in C3s for sub in itertools.combinations(t,3))]
def merge_gen(ts,k,deg):
    parent=list(range(len(ts)))
    def find(x):
        while parent[x]!=x:x=parent[x]
        return x
    owner={}
    for i,t in enumerate(ts):
        for sub in itertools.combinations(t,k-1):
            if deg(sub):continue
            if sub in owner:
                a,b=find(i),find(owner[sub])
                if a!=b:parent[a]=b
            else:owner[sub]=i
    g={}
    for i,t in enumerate(ts):g.setdefault(find(i),set()).update(t)
    return list(g.values())
lines=merge_gen(C3,3,lambda s:False)
circles=merge_gen(C4,4,lambda s:s in C3s)
ON={}
for cn in data[0][1]:
    ON[cn]=[k for k in names if all(abs(ev(d[1][cn],d[0][k]))/np.linalg.norm(row(d[0][k]))<1e-7 for d in data)]
srt=lambda S:sorted(S,key=names.index)
out=dict(names=names,coincident=coin,lines=[srt(L) for L in sorted(lines,key=len,reverse=True)],
         circles=[srt(C) for C in sorted(circles,key=len,reverse=True)],on=ON)
json.dump(out,open('res2.json','w'),ensure_ascii=False,indent=0)
print('points',len(names),'lines',len(lines),'circles',len(circles))
for L in out['lines']:print('L',' '.join(L))
for C in out['circles']:print('C',' '.join(C))
for k,v in ON.items():print('ON',k,' '.join(v))
