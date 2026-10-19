import numpy as np
def metric(A,B,C,P):
    def cond(U,V):return [U[0]*V[0],U[0]*V[1]+U[1]*V[0],U[1]*V[1]]
    M=np.array([cond(B-C,A-P),cond(C-A,B-P)]);s=np.linalg.svd(M)[2][-1]
    S=np.array([[s[0],s[1]],[s[1],s[2]]])
    q=[(V-U)@S@(V-U) for U,V in ((B,C),(C,A),(A,B))]
    if len(set(np.sign(q)))>1:return None
    if q[0]<0:S=-S
    return S/np.sqrt(abs(np.linalg.det(S)))
def points(A,B,C,S):
    ip=lambda u,v:u@S@v
    a2,b2,c2=ip(B-C,B-C),ip(C-A,C-A),ip(A-B,A-B);a,b,c=np.sqrt([a2,b2,c2]);s=(a+b+c)/2
    bar=lambda w:(w[0]*A+w[1]*B+w[2]*C)/sum(w)
    # circumcenter: S-equidistant
    M=np.array([2*S@(B-A),2*S@(C-A)]);O=np.linalg.solve(M,[ip(B,B)-ip(A,A),ip(C,C)-ip(A,A)])
    H=A+B+C-2*O;G=(A+B+C)/3;N=(O+H)/2;L=2*O-H
    I=bar([a,b,c]);Ia=bar([-a,b,c]);Ib=bar([a,-b,c]);Ic=bar([a,b,-c])
    K=bar([a2,b2,c2]);Ge=bar([1/(s-a),1/(s-b),1/(s-c)]);Na=bar([s-a,s-b,s-c]);Sp=bar([b+c,c+a,a+b])
    def foot(X,U,V):d=V-U;return U+d*ip(X-U,d)/ip(d,d)
    along=lambda X,Y,d,l:X+(Y-X)*d/l
    Ta,Tb,Tc=along(B,C,s-b,a),along(C,A,s-c,b),along(A,B,s-a,c)
    Ua,Ub,Uc=along(B,C,s-c,a),along(C,A,s-a,b),along(A,B,s-b,c)
    # Feuerbach point: tangency of S-NPC and S-incircle on line N I: F = N + (I-N)*(R/2)/|I-N|
    R2=ip(A-O,A-O);d2=ip(I-N,I-N)
    F=N+(I-N)*np.sqrt(R2/4/d2) if R2/d2>0 else None
    P=dict(I=I,G=G,O=O,H=H,N=N,K=K,Ge=Ge,Na=Na,Sp=Sp,L=L,A=A,B=B,C=C,Ia=Ia,Ib=Ib,Ic=Ic,
      Ma=(B+C)/2,Mb=(C+A)/2,Mc=(A+B)/2,Ha=foot(A,B,C),Hb=foot(B,C,A),Hc=foot(C,A,B),
      Ea=(A+H)/2,Eb=(B+H)/2,Ec=(C+H)/2,Ta=Ta,Tb=Tb,Tc=Tc,Ua=Ua,Ub=Ub,Uc=Uc,Aa=2*O-A,Ab=2*O-B,Ac=2*O-C)
    if F is not None:P['F']=F
    extra=dict(a=a,b=b,c=c,s=s,R2=R2,d2=d2,r=None)
    return P,extra
