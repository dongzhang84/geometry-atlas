import numpy as np,sys,math
sys.path.insert(0,'../probe3');from centers import centers
def circ3(P,Q,R):
    M=np.array([2*(Q-P),2*(R-P)]);c=np.linalg.solve(M,[Q@Q-P@P,R@R-P@P]);return c,(P-c)@(P-c)
circles=[(2,6,37,100),(2,6,42,101),(2,32,39,110),(3,4,69,99),(3,9,40,101),(6,11,37,55),(6,39,76,99),(7,8,21,99),(8,55,65,100),(9,55,57,101),(21,35,36,110),(21,55,56,110),(31,38,75,99),
 (1,2,23,36),(1,15,16,36),(2,15,16,23,110),(3,5,13,14)]
rng=np.random.default_rng(1);tris=[]
while len(tris)<8:
    A=rng.uniform(-3,3,2);B=rng.uniform(-3,3,2);C=rng.uniform(-3,3,2)
    u=B-A;v=C-A
    if abs(u[0]*v[1]-u[1]*v[0])<5:continue
    # acute-ish not needed
    tris.append((A,B,C))
def central(A,B,C,X):
    a=np.linalg.norm(B-C);b=np.linalg.norm(C-A);c=np.linalg.norm(A-B);s=(a+b+c)/2;area=abs((B-A)[0]*(C-A)[1]-(B-A)[1]*(C-A)[0])/2
    O=X[3];R2=(A-O)@(A-O);r=area/s;H=X[4];N=X[5];I=X[1];G=X[2];K=X[6];L=X[20]
    d=lambda P,Q:(P-Q)@(P-Q)
    Ia=(-a*A+b*B+c*C)/(-a+b+c);Ib=(a*A-b*B+c*C)/(a-b+c);Ic=(a*A+b*B-c*C)/(a+b-c)
    Sp=X[10]
    cos=lambda x,y,z:(y*y+z*z-x*x)/(2*y*z)
    polar2=-4*R2*cos(a,b,c)*cos(b,c,a)*cos(c,a,b)
    Na=X[8]
    C_={'外接圆':(O,R2),'九点圆':(N,R2/4),'内切圆':(I,r*r),'Brocard圆':((O+K)/2,d(O,K)/4),'垂心-重心圆(GH直径)':((G+H)/2,d(G,H)/4),
        'Spieker圆':(Sp,r*r/4),'Bevan圆':(2*O-I,4*R2),'Conway圆':(I,r*r+s*s),'polar圆(H)':(H,polar2),'de Longchamps圆':(L,-4*polar2) ,
        'Fuhrmann圆(HNa直径)':((H+Na)/2,d(H,Na)/4),'OI直径圆':((O+I)/2,d(O,I)/4),'OH直径圆':((O+H)/2,d(O,H)/4),'IG直径圆':((I+G)/2,d(I,G)/4),
        'A旁切圆':(Ia,(area/(s-a))**2),'1st Lemoine圆':((O+K)/2,None),'Moses圆':(None,None)}
    return {k:v for k,v in C_.items() if v[0] is not None and v[1] is not None}
res={}
for Cn in circles:
    flags=None
    for A,B,C in tris:
        X=centers(A,B,C);c,r2=circ3(X[Cn[0]],X[Cn[1]],X[Cn[2]])
        cc=central(A,B,C,X)
        f={k:abs((c-v[0])@(c-v[0])-r2-v[1])/(abs(r2)+abs(v[1])+(c-v[0])@(c-v[0])) <1e-8 for k,v in cc.items()}
        flags=f if flags is None else {k:flags[k] and f[k] for k in f}
    print('{'+','.join('X%d'%k for k in Cn)+'}','正交于:',[k for k,v in flags.items() if v])
