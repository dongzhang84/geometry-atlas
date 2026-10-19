import numpy as np, itertools, pickle, sys
from tetlib import *
EXPS=[-2,-1,1,2,3]
def build(V):
    t=T(V);L=[]   # list of (key,name,def,P)
    seen=set()
    def add(k,nm,df,P):
        if k in seen:return
        seen.add(k)
        L.append((k,nm,df,None if P is None or not np.all(np.isfinite(P)) else np.array(P,float)))
    for k,(nm,df,P) in cen_basic(t).items():add(k,nm,df,P)
    Q=t.quantities()
    for qk,(qn,qv) in Q.items():
        for e in EXPS:
            if qk=='S' and e in(1,2):continue
            add('w[%s^%d]'%(qk,e),'权重 (%s)^%d'%(qn,e),'重心坐标 ∝ (%s)^%d'%(qn,e),t.pt(qv**e))
    for e in (4,-3):add('w[S^%d]'%e,'权重 (面积)^%d'%e,'重心坐标 ∝ S_i^%d'%e,t.pt(t.S**e))
    for qk,(qn,qv) in Q.items():
        if qk=='S':continue
        add('w[S*%s]'%qk,'权重 面积×%s'%qn,'重心坐标 ∝ S_i·(%s)'%qn,t.pt(t.S*qv))
        add('w[S/%s]'%qk,'权重 面积÷%s'%qn,'重心坐标 ∝ S_i/(%s)'%qn,t.pt(t.S/qv))
    D=t.derived()
    for dn,DV in D.items():
        try:
            u=T(DV)
            if u.vol<1e-9*t.vol:continue
        except Exception:continue
        for ck,cn in (('G','重心'),('O','外心'),('M','Monge 点'),('I','内心'),('K','类似重心')):
            P={'G':u.G,'O':u.O,'M':2*u.G-u.O,'I':u.I,'K':u.pt(u.S**2)}[ck]
            add('%s(%s)'%(ck,dn),'%s的%s'%(dn,cn),'先作%s，再取它的%s'%(dn,cn),P)
    base=[x for x in L if x[3] is not None]
    G,O,I,R,r=t.G,t.O,t.I,t.R,t.r
    def inv(P,C,rr):d=P-C;n=d@d;return None if n<1e-14 else C+rr*rr*d/n
    for k,nm,df,P in base:
        x=t.bary(P)
        if np.all(np.abs(x)>1e-12):
            add('iso(%s)'%k,'%s的等角共轭'%nm,'重心坐标 S_i²/x_i',t.pt(t.S**2/x))
            add('isot(%s)'%k,'%s的等截共轭'%nm,'重心坐标 1/x_i',t.pt(1/x))
        add('comp(%s)'%k,'%s的补点'%nm,'(4G−P)/3：以 G 为中心比例 −1/3',(4*G-P)/3)
        add('acomp(%s)'%k,'%s的反补点'%nm,'4G−3P：以 G 为中心比例 −3',4*G-3*P)
        add('invO(%s)'%k,'%s关于外接球的反演点'%nm,'',inv(P,O,R))
        add('invI(%s)'%k,'%s关于内切球的反演点'%nm,'',inv(P,I,r))
        add('refO(%s)'%k,'%s关于外心的对称点'%nm,'2O−P',2*O-P)
        add('refI(%s)'%k,'%s关于内心的对称点'%nm,'2I−P',2*I-P)
    core=['G','O','M','N12','I','K','F','Ssurf','Sedge','Hiso','iso(I)','acomp(I)','comp(I)','invO(I)','invO(G)','invO(K)','iso(F)','I(旁心四面体)','O(旁心四面体)','K(旁心四面体)']
    dct={x[0]:x for x in L}
    cs=[dct[c] for c in core if c in dct and dct[c][3] is not None]
    for (k1,n1,_,P1),(k2,n2,_,P2) in itertools.combinations(cs,2):
        add('mid(%s,%s)'%(k1,k2),'%s与%s的中点'%(n1,n2),'',(P1+P2)/2)
        add('ref(%s;%s)'%(k1,k2),'%s关于%s的对称点'%(n1,n2),'',2*P2-P1)
        add('ref(%s;%s)'%(k2,k1),'%s关于%s的对称点'%(n2,n1),'',2*P1-P2)
        x1,x2=t.bary(P1),t.bary(P2)
        add('prod(%s,%s)'%(k1,k2),'%s与%s的重心坐标乘积'%(n1,n2),'重心坐标 x_i·y_i',t.pt(x1*x2))
    return L,t
if __name__=='__main__':
    sys.path.insert(0,'.');from tpts import rand_tetra
    rng=np.random.default_rng(101);NT=6
    Vs=[rand_tetra(rng) for _ in range(NT)]
    perm=[2,0,3,1]
    runs=[build(V) for V in Vs]+[build(Vs[0][perm])]
    keys=[x[0] for x in runs[0][0]];meta={x[0]:(x[1],x[2]) for x in runs[0][0]}
    for L,_ in runs[1:]:assert [x[0] for x in L]==keys
    P=np.full((NT+1,len(keys),3),np.nan)
    for a,(L,t) in enumerate(runs):
        for b,x in enumerate(L):
            if x[3] is not None:P[a,b]=x[3]
    scale=np.array([np.linalg.norm(t.V-t.G,axis=1).max() for _,t in runs])
    ok=[]
    for b,k in enumerate(keys):
        if np.isnan(P[:,b]).any():continue
        d=np.linalg.norm(P[:,b]-np.array([t.G for _,t in runs]),axis=1)/scale
        if d.max()>200:continue
        if np.linalg.norm(P[NT,b]-P[0,b])>1e-7*(1+np.linalg.norm(P[0,b])):print('非中心',k);continue
        ok.append(b)
    # 去重
    uniq=[];alias={}
    for b in ok:
        hit=None
        for u in uniq:
            if np.all(np.linalg.norm(P[:NT,b]-P[:NT,u],axis=1)<1e-7*(1+np.linalg.norm(P[:NT,u],axis=1))):hit=u;break
        if hit is None:uniq.append(b);alias[keys[b]]=[]
        else:alias[keys[hit]].append(keys[b])
    print('定义总数',len(keys),'有效中心',len(ok),'去重后',len(uniq))
    pickle.dump(dict(keys=[keys[b] for b in uniq],meta=meta,alias=alias,P=P[:NT][:,uniq],Vs=Vs),open('tetlib.pkl','wb'))
