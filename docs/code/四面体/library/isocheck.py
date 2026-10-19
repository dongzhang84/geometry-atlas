from tpts import *
rng=np.random.default_rng(3);V=rand_tetra(rng)
S=np.array([area(*V[list(f)]) for f in FACES])
def bary(P):return np.linalg.solve(np.vstack([V.T,np.ones(4)]),np.append(P,1))
def frombary(x):x=np.array(x,float);return x@V/x.sum()
P=V.mean(0)+rng.normal(size=3)*0.2
x=bary(P);Ps=frombary(S**2/x)
# geometric: for edge ij, faces containing it: k,l (complement). bisector plane: points with d_k/S... use unit normals
def unitn(f,inside):
    A,B,C=V[list(FACES[f])];n=np.cross(B-A,C-A);n/=np.linalg.norm(n)
    if (inside-A)@n<0:n=-n
    return n,A
G=V.mean(0);errs=[]
for i,j in itertools.combinations(range(4),2):
    k,l=[t for t in range(4) if t not in(i,j)]
    nk,Ak=unitn(k,G);nl,Al=unitn(l,G)
    dk=lambda X:(X-Ak)@nk;dl=lambda X:(X-Al)@nl
    errs.append(dk(P)*dk(Ps)/(dl(P)*dl(Ps))-1)  # want d_k d_k* = d_l d_l*  -> reflected ratio
print('isogonal check max |ratio-1| =',np.max(np.abs(errs)))
