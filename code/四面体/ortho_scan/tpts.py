import numpy as np, itertools
FACES=[(1,2,3),(0,2,3),(0,1,3),(0,1,2)]   # face i opposite vertex i
def circ3(P):  # circumsphere center of 4 pts
    A=2*(P[1:]-P[0]);b=(P[1:]**2).sum(1)-(P[0]**2).sum();return np.linalg.solve(A,b)
def tri_centers(A,B,C):
    a=np.linalg.norm(B-C);b=np.linalg.norm(C-A);c=np.linalg.norm(A-B)
    n=np.cross(B-A,C-A)
    # circumcenter in plane
    ab=B-A;ac=C-A
    O=A+(np.cross(n,ab)*(ac@ac)-np.cross(n,ac)*(ab@ab))/(2*(n@n))
    O=A+ (np.cross(np.cross(ab,ac),ab)*(ac@ac)+np.cross(ac,np.cross(ab,ac))*(ab@ab))/(2*(n@n))
    Gc=(A+B+C)/3;H=A+B+C-2*O;I=(a*A+b*B+c*C)/(a+b+c)
    return Gc,O,H,I
def proj_plane(X,A,B,C):
    n=np.cross(B-A,C-A);n=n/np.linalg.norm(n);return X-((X-A)@n)*n
def area(A,B,C):return np.linalg.norm(np.cross(B-A,C-A))/2
def points(V,orthocentric=False):
    P={}
    for i in range(4):P['V%d'%i]=V[i]
    G=V.mean(0);O=circ3(V);M=2*G-O
    S=np.array([area(*V[list(f)]) for f in FACES])
    I=(S[:,None]*V).sum(0)/S.sum()
    P['G']=G;P['O']=O;P['M']=M;P['I']=I
    for i in range(4):
        w=S.copy();w[i]=-w[i]
        if abs(w.sum())>1e-9*S.sum():P['Ex%d'%i]=(w[:,None]*V).sum(0)/w.sum()
    for i,f in enumerate(FACES):
        A,B,C=V[list(f)];Gc,Oc,Hc,Ic=tri_centers(A,B,C)
        P['fG%d'%i]=Gc;P['fO%d'%i]=Oc;P['fH%d'%i]=Hc;P['fI%d'%i]=Ic
        P['alt%d'%i]=proj_plane(V[i],A,B,C)
        P['T%d'%i]=proj_plane(I,A,B,C)
        if 'Ex%d'%i in P:P['U%d'%i]=proj_plane(P['Ex%d'%i],A,B,C)
        P['pM%d'%i]=proj_plane(M,A,B,C);P['pG%d'%i]=proj_plane(G,A,B,C)
        P['q%d'%i]=M+(V[i]-M)/3
    for i,j in itertools.combinations(range(4),2):P['m%d%d'%(i,j)]=(V[i]+V[j])/2
    fc=np.array([P['fG%d'%i] for i in range(4)]);P['Ssurf']=(S[:,None]*fc).sum(0)/S.sum()
    L=[];Mm=[]
    for i,j in itertools.combinations(range(4),2):L.append(np.linalg.norm(V[i]-V[j]));Mm.append((V[i]+V[j])/2)
    L=np.array(L);P['Sedge']=(L[:,None]*np.array(Mm)).sum(0)/L.sum()
    if orthocentric:
        # orthocenter: intersection of altitudes (least squares of two altitudes)
        d0=P['alt0']-V[0];d1=P['alt1']-V[1]
        A_=np.array([d0,-d1]).T;t=np.linalg.lstsq(A_,V[1]-V[0],rcond=None)[0];P['H']=V[0]+t[0]*d0
    return P,S
def rand_tetra(rng):
    while True:
        V=rng.normal(size=(4,3))
        e=[np.linalg.norm(V[i]-V[j]) for i,j in itertools.combinations(range(4),2)]
        vol=abs(np.linalg.det(V[1:]-V[0]))/6
        if vol/max(e)**3>0.03:return V
def rand_ortho(rng):
    # orthocentric: H at origin, v_i.v_j = k (const) for i!=j; parametrize v0,v1,v2 then v3
    while True:
        k=-1.0
        # pick lengths^2 d_i>... use Gram with offdiag k, need PSD rank 3: d_i such that sum 1/(d_i-k)... 
        # vectors: choose v0,v1,v2 random with pairwise dot = k by Gram
        d=rng.uniform(1.5,4,3);Gm=np.full((3,3),k);np.fill_diagonal(Gm,d)
        w,U=np.linalg.eigh(Gm)
        if w.min()<=0.05:continue
        B=U@np.diag(np.sqrt(w))   # rows v_i, B B^T = Gm
        # v3 with v3.v_i = k
        v3=np.linalg.solve(B,np.full(3,k))
        V=np.vstack([B,v3])
        e=[np.linalg.norm(V[i]-V[j]) for i,j in itertools.combinations(range(4),2)]
        vol=abs(np.linalg.det(V[1:]-V[0]))/6
        if vol/max(e)**3>0.03:return V

def rand_ortho2(rng,k):
    # 垂心四面体，形状更分散：H 在原点，v_i·v_j = k（k<0 时 H 在内部，k>0 时 H 在外部）
    while True:
        d=np.exp(rng.uniform(np.log(0.3),np.log(8),3))+max(k,0)
        Gm=np.full((3,3),float(k));np.fill_diagonal(Gm,d)
        w,U=np.linalg.eigh(Gm)
        if w.min()<=0.05:continue
        B=(U@np.diag(np.sqrt(w)))@np.linalg.qr(rng.normal(size=(3,3)))[0]
        v3=np.linalg.solve(B,np.full(3,k));V=np.vstack([B,v3])
        e=[np.linalg.norm(V[i]-V[j]) for i,j in itertools.combinations(range(4),2)]
        vol=abs(np.linalg.det(V[1:]-V[0]))/6
        if vol/max(e)**3>0.012 and max(e)/min(e)<6:return V
