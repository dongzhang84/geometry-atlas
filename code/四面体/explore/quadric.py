import sys,itertools;sys.path.insert(0,'.')
from tpts import *
def qrow(p):x,y,z=p;return [x*x,y*y,z*z,x*y,y*z,z*x,x,y,z,1]
def fit(pts):
    M=np.array([qrow(p) for p in pts]);u,s,vt=np.linalg.svd(M);return vt[-1],s
def classify(q):
    a,b,c,d,e,f,g,h,i,j=q
    A=np.array([[a,d/2,f/2],[d/2,b,e/2],[f/2,e/2,c]])
    Q=np.array([[a,d/2,f/2,g/2],[d/2,b,e/2,h/2],[f/2,e/2,c,i/2],[g/2,h/2,i/2,j]])
    ev=np.linalg.eigvalsh(A);
    if np.min(np.abs(ev))<1e-9*np.max(np.abs(ev)):return '抛物型（退化）',ev
    cen=np.linalg.solve(A,-np.array([g,h,i])/2);k=np.array([*cen,1])@Q@np.array([*cen,1])
    ev2=ev/(-k)   # normalized: sum ev2_i x^2 = 1
    pos=(ev2>0).sum()
    name={3:'椭球面',2:'单叶双曲面',1:'双叶双曲面',0:'空（虚椭球）'}[pos]
    if pos==3 and np.ptp(ev2)/np.max(ev2)<1e-6:name='球面'
    return name,ev2
def inter_line_plane(P,Q,A,B,C):
    n=np.cross(B-A,C-A);t=((A-P)@n)/((Q-P)@n);return P+t*(Q-P)
def run(V5,label):
    pts=list(V5);mids=[(pts[i]+pts[j])/2 for i,j in itertools.combinations(range(5),2)]
    q,s=fit(mids)
    res=s[-1]/s[0]
    diag=[]
    for i,j in itertools.combinations(range(5),2):
        k=[t for t in range(5) if t not in(i,j)]
        diag.append(inter_line_plane(pts[i],pts[j],*[pts[t] for t in k]))
    on=[abs(np.array(qrow(p))@q)/np.linalg.norm(qrow(p)) for p in diag]
    name,ev=classify(q)
    print(f'{label}: 10个中点的拟合残差 {res:.1e} ; 曲面={name} ; 10个"对角点"在上面? max={max(on):.1e}')
    return q
rng=np.random.default_rng(2)
for k in range(3):
    V=rand_tetra(rng);
    P=V.mean(0)+rng.normal(size=3)*0.1   # inside
    run(np.vstack([V,P]),'P在四面体内')
    P=V.mean(0)+(V[0]-V.mean(0))*(-1.8)+rng.normal(size=3)*0.1   # beyond face 0
    run(np.vstack([V,P]),'P在一个面外侧')
    P=(V[0]+V[1])/2*1.0+((V[0]+V[1])/2-(V[2]+V[3])/2)*1.5  # beyond an edge
    run(np.vstack([V,P]),'P在一条棱外侧')
V=rand_ortho(rng);P_,S=points(V,True)
run(np.vstack([V,P_['H']]),'垂心四面体, P=垂心H')
V=rand_tetra(rng);P_,S=points(V)
run(np.vstack([V,P_['M']]),'一般四面体, P=Monge点')
