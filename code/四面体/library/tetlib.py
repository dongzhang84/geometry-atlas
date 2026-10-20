# 四面体中心库（仿 ETC）：所有点都是"中心"——与顶点编号无关
import numpy as np, itertools
from scipy.optimize import minimize
FACES=[(1,2,3),(0,2,3),(0,1,3),(0,1,2)]
EDGES=list(itertools.combinations(range(4),2))
def circ(P):
    A=2*(P[1:]-P[0]);b=(P[1:]**2).sum(1)-(P[0]**2).sum();return np.linalg.solve(A,b)
def tri(A,B,C):
    a=np.linalg.norm(B-C);b=np.linalg.norm(C-A);c=np.linalg.norm(A-B)
    ab=B-A;ac=C-A;n=np.cross(ab,ac)
    O=A+(np.cross(n,ab)*(ac@ac)+np.cross(ac,n)*(ab@ab))/(2*(n@n))
    G=(A+B+C)/3;H=A+B+C-2*O;I=(a*A+b*B+c*C)/(a+b+c)
    S=np.linalg.norm(n)/2;R=a*b*c/(4*S);r=2*S/(a+b+c)
    return dict(G=G,O=O,H=H,I=I,S=S,R=R,r=r,p=a+b+c,q=a*a+b*b+c*c)
def proj(X,A,B,C):
    n=np.cross(B-A,C-A);n=n/np.linalg.norm(n);return X-((X-A)@n)*n
def plane3(pl):  # intersect 3 planes given as (n,d) n.x=d
    N=np.array([p[0] for p in pl]);d=np.array([p[1] for p in pl]);return np.linalg.solve(N,d)
class T:
    def __init__(s,V):
        s.V=np.array(V,float);V=s.V
        s.Bm=np.vstack([V.T,np.ones(4)])
        s.f=[tri(*V[list(f)]) for f in FACES]
        s.S=np.array([t['S'] for t in s.f])
        s.vol=abs(np.linalg.det(V[1:]-V[0]))/6
        s.G=V.mean(0);s.O=circ(V);s.R=np.linalg.norm(V[0]-s.O)
        s.I=s.S@V/s.S.sum();s.r=3*s.vol/s.S.sum()
    def bary(s,P):return np.linalg.solve(s.Bm,np.append(P,1))
    def pt(s,w):
        w=np.array(w,float);
        if abs(w.sum())<1e-10*np.abs(w).sum():return None
        return w@s.V/w.sum()
    # ---------- 每个顶点 / 对面 的量（下标 i：顶点 i，对面 i）----------
    def quantities(s):
        V=s.V;Q={}
        d=lambda i,j:np.linalg.norm(V[i]-V[j])
        Q['S']=('面积 S_i',s.S)
        Q['p']=('面周长',np.array([t['p'] for t in s.f]))
        Q['Rf']=('面外接圆半径',np.array([t['R'] for t in s.f]))
        Q['rf']=('面内切圆半径',np.array([t['r'] for t in s.f]))
        Q['qf']=('面三边平方和',np.array([t['q'] for t in s.f]))
        Q['ev']=('顶点处三棱平方和',np.array([sum(d(i,j)**2 for j in range(4) if j!=i) for i in range(4)]))
        Q['lv']=('顶点处三棱长之和',np.array([sum(d(i,j) for j in range(4) if j!=i) for i in range(4)]))
        Q['pv']=('顶点处三棱长之积',np.array([np.prod([d(i,j) for j in range(4) if j!=i]) for i in range(4)]))
        # 立体角、面角和
        Om=[];sg=[]
        for i in range(4):
            a,b,c=[V[j]-V[i] for j in range(4) if j!=i]
            la,lb,lc=map(np.linalg.norm,(a,b,c))
            num=abs(np.dot(a,np.cross(b,c)));den=la*lb*lc+(a@b)*lc+(a@c)*lb+(b@c)*la
            Om.append(2*np.arctan2(num,den))
            ang=lambda u,v:np.arccos(u@v/np.linalg.norm(u)/np.linalg.norm(v))
            sg.append(ang(a,b)+ang(b,c)+ang(a,c))
        Q['Om']=('顶点立体角',np.array(Om));Q['sg']=('顶点处三个面角之和',np.array(sg))
        Q['def']=('顶点曲率亏量 2π−面角和',2*np.pi-np.array(sg))
        # 二面角（棱 ij 处，夹在面 k、面 l 之间）
        n=[];G=s.G
        for f in FACES:
            A,B,C=V[list(f)];m=np.cross(B-A,C-A);m/=np.linalg.norm(m)
            if (G-A)@m<0:m=-m
            n.append(m)
        th={}
        for i,j in EDGES:
            k,l=[t for t in range(4) if t not in(i,j)];th[(i,j)]=np.pi-np.arccos(np.clip(n[k]@n[l],-1,1))
        Q['dv']=('过顶点的三个二面角之和',np.array([sum(th[e] for e in EDGES if i in e) for i in range(4)]))
        Q['df']=('面上三条棱的二面角之和',np.array([sum(th[e] for e in EDGES if i not in e) for i in range(4)]))
        Q['gv']=('顶点到重心距离平方',np.array([np.sum((V[i]-s.G)**2) for i in range(4)]))
        Q['iv']=('顶点到内心距离',np.array([np.linalg.norm(V[i]-s.I) for i in range(4)]))
        Q['fo']=('面外心到外心距离',np.array([np.linalg.norm(t['O']-s.O) for t in s.f]))
        return Q
    def fermat(s):
        f=lambda x:np.linalg.norm(s.V-x,axis=1).sum()
        g=lambda x:-((s.V-x)/np.linalg.norm(s.V-x,axis=1)[:,None]).sum(0)
        r=minimize(f,s.G,jac=g,method='BFGS',options=dict(gtol=1e-13,maxiter=2000));return r.x
    # ---------- 衍生四面体（顶点 i 对应原顶点 i）----------
    def derived(s):
        V=s.V;D={}
        D['面外心四面体']=np.array([t['O'] for t in s.f])
        D['面内心四面体']=np.array([t['I'] for t in s.f])
        D['面垂心四面体']=np.array([t['H'] for t in s.f])
        D['高足四面体']=np.array([proj(V[i],*V[list(f)]) for i,f in enumerate(FACES)])
        D['内切球切点四面体']=np.array([proj(s.I,*V[list(f)]) for f in FACES])
        ex=[]
        for i in range(4):
            w=s.S.copy();w[i]*=-1;ex.append(w@V/w.sum())
        D['旁心四面体']=np.array(ex)
        D['旁切球切点四面体']=np.array([proj(ex[i],*V[list(f)]) for i,f in enumerate(FACES)])
        tp=[(V[j]-s.O,(V[j]-s.O)@V[j]) for j in range(4)]
        D['切线四面体']=np.array([plane3([tp[j] for j in range(4) if j!=i]) for i in range(4)])
        for nm,P in (('重心',s.G),('内心',s.I)):
            cc=[];
            for i in range(4):
                u=P-V[i];t=-2*(V[i]-s.O)@u/(u@u);cc.append(V[i]+t*u)
            D['%s的外接球塞瓦四面体'%nm]=np.array(cc)
        K=s.pt(s.S**2)
        for nm,P in (('重心',s.G),('类似重心',K),('外心',s.O)):
            D['%s的垂足四面体'%nm]=np.array([proj(P,*V[list(f)]) for f in FACES])
        return D
def cen_basic(t):
    """对一个四面体对象返回 {key:(名称, 定义, 点)}"""
    V=t.V;C={}
    def add(k,nm,df,P):
        if P is not None and np.all(np.isfinite(P)):C[k]=(nm,df,P)
    G,O=t.G,t.O;M=2*G-O
    add('G','重心','四个顶点的平均；重心坐标 1:1:1:1',G)
    add('O','外心','外接球球心',O)
    add('M','Monge 点','过每条棱中点、垂直于对棱的 6 个平面的公共点；2G−O',M)
    add('N12','十二点球心','(4G−O)/3；中点四面体的外心',(4*G-O)/3)
    add('I','内心','内切球球心；S0:S1:S2:S3',t.I)
    add('K','类似重心（Lemoine 点）','S0²:S1²:S2²:S3²；到四个面距离平方和最小',t.pt(t.S**2))
    add('F','Fermat–Torricelli 点','到四个顶点距离之和最小',t.fermat())
    fc=np.array([f['G'] for f in t.f]);add('Ssurf','表面重心','四个面作均匀薄片的重心',t.S@fc/t.S.sum())
    L=np.array([np.linalg.norm(V[i]-V[j]) for i,j in EDGES]);Mm=np.array([(V[i]+V[j])/2 for i,j in EDGES])
    add('Sedge','棱框重心','六条棱作均匀细棒的重心',L@Mm/L.sum())
    add('Hiso','外心的等角共轭','S_i²/x_i，x 为外心的重心坐标',t.pt(t.S**2/t.bary(O)))
    return C
