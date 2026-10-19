import numpy as np, itertools, json, random
cr=lambda u,v:u[0]*v[1]-u[1]*v[0]
def circ(A,B,C):
    M=np.array([2*(B-A),2*(C-A)]);return np.linalg.solve(M,[B@B-A@A,C@C-A@A])
def inter(P,Q,R,S):M=np.array([Q-P,R-S]).T;t=np.linalg.solve(M,R-P);return P+t[0]*(Q-P)
row=lambda p:[p[0]**2,p[0]*p[1],p[1]**2,p[0],p[1],1]
def grow(p,d):x,y=p;return [2*x*d[0],y*d[0]+x*d[1],2*y*d[1],d[0],d[1],0]
def tomat(co):a,b,c,d,e,f=co;return np.array([[a,b/2,d/2],[b/2,c,e/2],[d/2,e/2,f]])
def conic5(pts):return np.linalg.svd(np.array([row(p) for p in pts]))[2][-1]
def center(M):v=np.linalg.solve(M,[0,0,1]);return v[:2]/v[2]
def config(A,B,C,P):
    T=np.array([A,B,C])
    Mb=np.linalg.inv(np.array([[A[0],B[0],C[0]],[A[1],B[1],C[1]],[1,1,1]]))
    bar=lambda w:(w[0]*A+w[1]*B+w[2]*C)/np.sum(w)
    tob=lambda X:Mb@np.array([X[0],X[1],1])
    G=(A+B+C)/3;O=circ(A,B,C);H=A+B+C-2*O;N=(O+H)/2;R=np.linalg.norm(A-O)
    a,b,c=np.linalg.norm(B-C),np.linalg.norm(C-A),np.linalg.norm(A-B)
    I=bar([a,b,c]);s=(a+b+c)/2;r=abs(cr(B-A,C-A))/2/s
    Ma,Mb_,Mc=(B+C)/2,(C+A)/2,(A+B)/2;Ka,Kb,Kc=(A+P)/2,(B+P)/2,(C+P)/2
    Da,Db,Dc=inter(A,P,B,C),inter(B,P,C,A),inter(C,P,A,B)
    p=tob(P);Piso=bar(1/p)
    Q=(A+B+C-P)/2;aP=A+B+C-2*P;G4=(A+B+C+P)/4
    # rectangular conic through A,B,C,P -> Po
    rh=np.linalg.svd(np.array([row(X) for X in (A,B,C,P)]+[[1,0,1,0,0,0]]))[2][-1];Po=center(tomat(rh))
    # inconic with perspector P (tangent at Da,Db,Dc)
    kp=np.linalg.svd(np.array([row(Da),row(Db),row(Dc),grow(Da,C-B),grow(Db,A-C)]))[2][-1];KP=tomat(kp)
    XP=center(KP);SpP=(3*G-XP)/2
    Va,Vb,Vc=B+C-Da,C+A-Db,A+B-Dc   # isotomic touch points
    # circumconic with perspector P: p yz + q zx + r xy = 0
    Qb=np.array([[0,p[2],p[1]],[p[2],0,p[0]],[p[1],p[0],0]])/2;CPm=Mb.T@Qb@Mb;CP=center(CPm)
    # ruler S making P orthocenter: (B-C)^T S (A-P)=0, (C-A)^T S (B-P)=0
    def srow(u,v):return [u[0]*v[0],u[0]*v[1]+u[1]*v[0],u[1]*v[1]]
    sv=np.linalg.svd(np.array([srow(B-C,A-P),srow(C-A,B-P)]))[2][-1];S=np.array([[sv[0],sv[1]],[sv[1],sv[2]]])
    if np.linalg.det(S)<=0:return None
    if S[0,0]<0:S=-S
    qn=lambda v:np.sqrt(v@S@v)
    aq,bq,cq=qn(B-C),qn(C-A),qn(A-B);sq=(aq+bq+cq)/2
    IQ=bar([aq,bq,cq]);GeQ=bar([1/(sq-aq),1/(sq-bq),1/(sq-cq)]);NaQ=bar([sq-aq,sq-bq,sq-cq]);SpQ=(3*G-IQ)/2
    TQa=B+(sq-bq)/aq*(C-B);TQb=C+(sq-cq)/bq*(A-C);TQc=A+(sq-aq)/cq*(B-A)
    # Q-incircle conic: tangent at TQa,TQb,TQc
    iq=np.linalg.svd(np.array([row(TQa),row(TQb),row(TQc),grow(TQa,C-B),grow(TQb,A-C)]))[2][-1]
    pts=dict(A=A,B=B,C=C,P=P,G=G,Ma=Ma,Mb=Mb_,Mc=Mc,Ka=Ka,Kb=Kb,Kc=Kc,Da=Da,Db=Db,Dc=Dc,G4=G4,Q=Q,aP=aP,Piso=Piso,Po=Po,
             O=O,H=H,N=N,I=I,XP=XP,SpP=SpP,Va=Va,Vb=Vb,Vc=Vc,CP=CP,IQ=IQ,GeQ=GeQ,NaQ=NaQ,SpQ=SpQ,TQa=TQa,TQb=TQb,TQc=TQc)
    Gam=tomat(conic5([Ma,Mb_,Mc,Ka,Kb]));Om=tomat(conic5([A,B,C,2*Ma-P,2*Mb_-P]))
    circM=tomat(conic5([A,B,C,2*O-A,2*O-B]));npc=tomat(conic5([Ma,Mb_,Mc,(A+H)/2,(B+H)/2]))
    th=np.linspace(0,6,5);inc=tomat(conic5([I+r*np.array([np.cos(t),np.sin(t)]) for t in th]))
    curves=dict(Gamma=Gam,Omega=Om,circum=circM,npc=npc,incircle=inc,KP=KP,CPc=CPm,IQc=tomat(iq))
    return pts,curves
