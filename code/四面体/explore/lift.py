import sys,itertools;sys.path.insert(0,'.')
from tpts import *
from quadric import qrow,fit,classify
def sym(v):a,b,c,d,e,f=v;return np.array([[a,d,f],[d,b,e],[f,e,c]])
def ortho_forms(V):
    rows=[]
    for i,j,k,l in [(0,1,2,3),(0,2,1,3),(0,3,1,2)]:
        u=V[i]-V[j];w=V[k]-V[l]
        rows.append([u[0]*w[0],u[1]*w[1],u[2]*w[2],u[0]*w[1]+u[1]*w[0],u[1]*w[2]+u[2]*w[1],u[0]*w[2]+u[2]*w[0]])
    _,_,vt=np.linalg.svd(np.array(rows));return vt[3:]   # basis of 3-dim solution space
def HQ(V,Q):
    Qi=np.linalg.inv(Q);L=[]
    for i,f in enumerate(FACES):
        A,B,C=V[list(f)];N=np.cross(B-A,C-A);L.append((V[i],Qi@N))
    # intersect lines 0,1 least squares, check all
    Amat=[];b=[]
    for P,d in L:
        d=d/np.linalg.norm(d);M=np.eye(3)-np.outer(d,d);Amat.append(M);b.append(M@P)
    x=np.linalg.lstsq(np.vstack(Amat),np.concatenate(b),rcond=None)[0]
    err=max(np.linalg.norm((np.eye(3)-np.outer(d/np.linalg.norm(d),d/np.linalg.norm(d)))@(x-P)) for P,d in L)
    return x,err
def inter_lines2(P,Q,R,S):  # coplanar lines intersection (least squares)
    A=np.array([Q-P,R-S]).T;t=np.linalg.lstsq(A,R-P,rcond=None)[0];return P+t[0]*(Q-P)
def cevfoot(Vi,H,A,B,C):
    n=np.cross(B-A,C-A);t=((A-Vi)@n)/((H-Vi)@n);return Vi+t*(H-Vi)
rng=np.random.default_rng(8)
V=rand_tetra(rng);basis=ortho_forms(V)
for trial in range(6):
    c=rng.normal(size=3);Q=sym(c@basis)
    sig=np.sign(np.linalg.eigvalsh(Q));H,err=HQ(V,Q)
    pts=[(V[i]+V[j])/2 for i,j in itertools.combinations(range(4),2)]
    for i,f in enumerate(FACES):
        A,B,C=V[list(f)];D=cevfoot(V[i],H,A,B,C)
        pts+=[(A+D)/2,(B+D)/2,(C+D)/2,inter_lines2(A,B,C,D),inter_lines2(A,C,B,D),inter_lines2(A,D,B,C)]
    q,s=fit(pts);res=max(abs(np.array(qrow(p))@q)/np.linalg.norm(qrow(p)) for p in pts)
    name,_=classify(q)
    print(f'二次型符号 {tuple(sig.astype(int))}  四条Q-高共点误差 {err:.1e}  30个点在同一二次曲面上: 残差 {res:.1e}  曲面类型 {name}')
