# 轨道点：每个顶点/面一个（4 个）、每条棱一个（6 个）、每对对棱一个（3 个）的点族
import numpy as np, itertools
from tetlib import *
PAIRS=[((0,1),(2,3)),((0,2),(1,3)),((0,3),(1,2))]
def tri_more(A,B,C):
    a=np.linalg.norm(B-C);b=np.linalg.norm(C-A);c=np.linalg.norm(A-B);d=tri(A,B,C)
    K=(a*a*A+b*b*B+c*c*C)/(a*a+b*b+c*c)
    s=(a+b+c)/2;Ge=(A/(s-a)+B/(s-b)+C/(s-c))/(1/(s-a)+1/(s-b)+1/(s-c))
    Na=((s-a)*A+(s-b)*B+(s-c)*C)/s
    return dict(N=(d['O']+d['H'])/2,K=K,Ge=Ge,Na=Na,Sp=((b+c)*A+(c+a)*B+(a+b)*C)/(2*(a+b+c)))
def line_plane(P,Q,A,B,C):
    n=np.cross(B-A,C-A);t=((A-P)@n)/((Q-P)@n);return P+t*(Q-P)
def proj_line(X,A,B):u=B-A;return A+((X-A)@u)/(u@u)*u
def plane_edge(i,j,P,k,l,V):   # 过棱 ij 和点 P 的平面与对棱 kl 的交点
    n=np.cross(V[j]-V[i],P-V[i]);u=V[l]-V[k];t=((V[i]-V[k])@n)/(u@n);return V[k]+t*u
def common_perp(A,B,C,D):     # 直线 AB、CD 公垂线在 AB、CD 上的垂足
    u=B-A;v=D-C;w=A-C;a=u@u;b=u@v;c=v@v;d=u@w;e=v@w;den=a*c-b*b
    s=(b*e-c*d)/den;t=(a*e-b*d)/den;return A+s*u,C+t*v
def sphere_second(Vi,P,O,R):  # 直线 Vi P 与外接球的第二个交点
    u=P-Vi;t=-2*(Vi-O)@u/(u@u);return Vi+t*u
def orbits(t):
    V=t.V;G,O,I,R=t.G,t.O,t.I,t.R;M=2*G-O;N12=(4*G-O)/3;K=t.pt(t.S**2)
    F=t.fermat();Hiso=t.pt(t.S**2/t.bary(O))
    X={}   # key -> (名称, 定义, 三角形对应, [点...])
    def add(k,nm,df,an,pts):X[k]=(nm,df,an,[np.array(p,float) for p in pts])
    fa=[V[list(f)] for f in FACES];tm=[tri_more(*f) for f in fa]
    # ---- 每个面一个 ----
    add('V','顶点','四个顶点','顶点 A、B、C',V)
    for c,nm,an in (('G','面重心','边中点'),('O','面外心','边中点（O 在边上的投影）'),('H','面垂心','—'),('I','面内心','—')):
        add('f'+c,nm,'面 i 作为三角形的%s'%nm[1:],an,[x[c] for x in t.f])
    for c,nm in (('N','面九点圆心'),('K','面类似重心'),('Ge','面 Gergonne 点'),('Na','面 Nagel 点'),('Sp','面 Spieker 点')):
        add('f'+c,nm,'面 i 作为三角形的%s'%nm[1:],'—',[x[c] for x in tm])
    for P,pn,an in ((V,'顶点','高的垂足 Ha'),(G,'重心 G','G 在边上的投影'),(M,'Monge 点 M','垂心在边上的投影'),(K,'类似重心 K','—'),(F,'Fermat 点 F','—'),(N12,'十二点球心','九点圆心在边上的投影'),(Hiso,'外心的等角共轭','—')):
        if pn=='顶点':add('alt','高的垂足','顶点 Vi 在面 i 上的投影',an,[proj(V[i],*fa[i]) for i in range(4)])
        else:add('p'+pn.split()[-1] if ' ' in pn else 'p'+pn,'%s在面上的投影'%pn,'%s在面 i 上的投影'%pn,an,[proj(P,*f) for f in fa])
    add('T','内切球切点','内切球与面 i 的切点（I 在面 i 上的投影）','内切圆切点',[proj(I,*f) for f in fa])
    ex=[]
    for i in range(4):
        w=t.S.copy();w[i]*=-1;ex.append(w@V/w.sum())
    add('Ex','旁心','旁切球球心（面 i 的面积取负号）','旁心',ex)
    add('U','旁切球切点','第 i 个旁切球与面 i 的切点','旁切圆切点',[proj(ex[i],*fa[i]) for i in range(4)])
    for P,pn,an in ((G,'重心','中线足 = 边中点'),(I,'内心','角平分线足'),(K,'类似重心','类似中线足'),(O,'外心','—'),(M,'Monge 点','—'),(F,'Fermat 点','—')):
        add('cev'+pn,'%s的塞瓦足'%pn,'直线 Vi–%s 与面 i 的交点'%pn,an,[line_plane(V[i],P,*fa[i]) for i in range(4)])
    # ---- 每个顶点一个 ----
    add('q','Monge 三等分点','M 到 Vi 连线上靠近 M 的三等分点','Euler 点（AH 中点）',[M+(V[i]-M)/3 for i in range(4)])
    for P,pn in ((G,'重心'),(O,'外心'),(M,'Monge 点'),(I,'内心'),(K,'类似重心')):
        add('mid'+pn,'顶点与%s的中点'%pn,'Vi 与%s连线的中点'%pn,'Euler 点等' if pn=='Monge 点' else '—',[(V[i]+P)/2 for i in range(4)])
    add('anti','外接球对径点','Vi 关于外心的对称点','外接圆上的对径点',[2*O-V[i] for i in range(4)])
    for P,pn in ((G,'重心'),(I,'内心'),(K,'类似重心'),(M,'Monge 点')):
        add('cc'+pn,'%s的外接球塞瓦点'%pn,'直线 Vi–%s 与外接球的第二个交点'%pn,'circumcevian 三角形顶点',[sphere_second(V[i],P,O,R) for i in range(4)])
    tp=[(V[j]-O,(V[j]-O)@V[j]) for j in range(4)]
    add('tan','切线四面体顶点','外接球在其余三个顶点处的切平面的交点','切线三角形顶点',[plane3([tp[j] for j in range(4) if j!=i]) for i in range(4)])
    add('acG','反补四面体顶点','Vi 关于对面重心的对称点 4G−3Vi','反补三角形顶点',[4*G-3*V[i] for i in range(4)])
    add('vrefG','顶点关于对面的对称点','Vi 关于面 i 的镜像','顶点关于对边的对称点',[2*proj(V[i],*fa[i])-V[i] for i in range(4)])
    # ---- 每条棱一个 ----
    E=EDGES;opp=lambda i,j:tuple(x for x in range(4) if x not in(i,j))
    add('m','棱中点','棱 ij 的中点','边中点',[(V[i]+V[j])/2 for i,j in E])
    for P,pn in ((G,'重心'),(I,'内心'),(M,'Monge 点'),(K,'类似重心')):
        add('e'+pn,'%s在棱上的投影'%pn,'%s在棱 ij 所在直线上的投影'%pn,'—',[proj_line(P,V[i],V[j]) for i,j in E])
    for P,pn,an in ((I,'内心','角平分线足'),(K,'类似重心','类似中线足'),(O,'外心','—'),(M,'Monge 点','—'),(F,'Fermat 点','—')):
        pts=[]
        for i,j in E:
            k,l=opp(i,j);pts.append(plane_edge(k,l,P,i,j,V))
        add('pe'+pn,'%s的塞瓦平面足'%pn,'过对棱和 %s 的平面与棱 ij 的交点'%pn,an,pts)
    cpf=[]
    for i,j in E:
        k,l=opp(i,j);a,_=common_perp(V[i],V[j],V[k],V[l]);cpf.append(a)
    add('cp','公垂线足','棱 ij 与对棱的公垂线在棱 ij 上的垂足','—',cpf)
    add('alte','面上的高足','面内顶点到对边的垂足（每条棱两个，按棱取：顶点 k、l 在棱 ij 上的垂足的中点）','—',[(proj_line(V[k],V[i],V[j])+proj_line(V[l],V[i],V[j]))/2 for (i,j) in E for k,l in [opp(i,j)]])
    # ---- 每对对棱一个 ----
    gar=[]
    for (i,j),(k,l) in PAIRS:
        w=t.S.copy();w[i]*=-1;w[j]*=-1;gar.append(w@V/w.sum())
    add('gar','「屋顶」旁切球心','把两个面的面积同时取负号（对棱 ij 与 kl）','—',gar)
    add('cpm','公垂线中点','两条对棱的公垂线段的中点','—',[sum(common_perp(V[i],V[j],V[k],V[l]))/2 for (i,j),(k,l) in PAIRS])
    return X
