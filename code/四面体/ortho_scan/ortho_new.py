# 第二步：垂心四面体新增的 H 系列、垂足四面体系列；检查新点是否真是中心、是否和已有点重合
import numpy as np,pickle,sys,itertools,collections
sys.path.insert(0,'.')
from tetlib import T,FACES,EDGES,proj
from orbits import sphere_second
from scipy.spatial import cKDTree
D=pickle.load(open('ortho_dedup.pkl','rb'));Vs=D['Vs'];NT=6;KEYS=D['KEYS']
def C5(u):  # 一个四面体的五个基本中心 + 几个附加中心
    G,O=u.G,u.O;R={'G':G,'O':O,'M':2*G-O,'I':u.I,'K':u.pt(u.S**2)}
    try:R['F']=u.fermat()
    except Exception:pass
    R['Hiso']=u.pt(u.S**2/u.bary(O));fc=np.array([f['G'] for f in u.f]);R['Ssurf']=u.S@fc/u.S.sum()
    return R
CN={'G':'重心','O':'外心','M':'Monge 点','I':'内心','K':'类似重心','F':'Fermat 点','Hiso':'外心的等角共轭','Ssurf':'表面重心'}
def new_points(V):
    t=T(V);V=t.V;G,O=t.G,t.O;H=2*G-O;fa=[V[list(f)] for f in FACES]
    F=np.array([proj(V[i],*fa[i]) for i in range(4)])
    p=(V[0]-H)@(F[0]-H)                     # 极球的幂（四个顶点都相同）
    cen={};orb={}
    # 极球反演：P -> H + p (P-H)/|P-H|²
    def invH(P):d=P-H;n=d@d;return None if n<1e-14 else H+p*d/n
    core={'G':G,'O':O,'N12':(4*G-O)/3,'I':t.I,'K':t.pt(t.S**2),'Hiso':t.pt(t.S**2/t.bary(O)),'F':t.fermat(),'invO(G)':O+t.R**2*(G-O)/((G-O)@(G-O))}
    for k,P in core.items():cen['invH(%s)'%k]=('%s关于极球的反演点'%k,invH(P))
    # 衍生四面体
    der={'高足四面体':F,'H关于各面的对称点四面体':2*F-H,
         'H的外接球塞瓦四面体':np.array([sphere_second(V[i],H,O,t.R) for i in range(4)]),
         '极球反演的切线四面体':None}
    for dn,DV in der.items():
        if DV is None:continue
        u=T(DV);c=C5(u)
        for ck,P in c.items():
            key='%s(%s)'%(ck,dn)
            if dn=='高足四面体' and ck in('G','O','M','I','K'):continue   # 库里已有
            cen[key]=('%s的%s'%(dn,CN[ck]),P)
    # 新增的中心，再取等角、等截共轭
    for k,(nm,P) in list(cen.items()):
        if P is None:continue
        x=t.bary(P)
        if np.all(np.abs(x)>1e-12):
            cen['iso(%s)'%k]=(nm+'的等角共轭',t.pt(t.S**2/x));cen['isot(%s)'%k]=(nm+'的等截共轭',t.pt(1/x))
    # 轨道：垂心组的另外四个四面体 H V_j V_k V_l（每个顶点 i 一个）
    sub=[T(np.vstack([H,fa[i]])) for i in range(4)]
    for ck in ('O','I','K','F','Hiso','Ssurf'):
        orb['h'+ck]=('四面体 H+面 i 的%s'%CN[ck],[C5(u)[ck] for u in sub])
    orb['refHf']=('H 关于面 i 的对称点',list(2*F-H))
    orb['refHm']=('H 关于棱中点的对称点',[V[i]+V[j]-H for i,j in EDGES])
    orb['refHe']=('H 关于棱的对称点',[2*(V[i]+((H-V[i])@(V[j]-V[i]))/((V[j]-V[i])@(V[j]-V[i]))*(V[j]-V[i]))-H for i,j in EDGES])
    orb['invHfG']=('面重心关于极球的反演点',[invH(f['G']) for f in t.f])
    orb['invHfO']=('面外心关于极球的反演点',[invH(f['O']) for f in t.f])
    orb['invHm']=('棱中点关于极球的反演点',[invH((V[i]+V[j])/2) for i,j in EDGES])
    facts=dict(p=p,
      sub12=max(abs(np.linalg.norm(f['G']-(4*u.G-u.O)/3)-u.R/3) for u in sub for f in u.f)/t.R,
      sub12same=max(np.linalg.norm((4*u.G-u.O)/3-(4*G-O)/3) for u in sub)/t.R,
      refHf_on_circ=max(abs(np.linalg.norm(2*F[i]-H-O)-t.R) for i in range(4))/t.R,
      Hpow_circ=((H-O)@(H-O)-t.R**2)/p)
    return t,cen,orb,facts
res=[new_points(V) for V in Vs]
for r in res:print({k:round(v,6) for k,v in r[3].items()})
# 中心性：把顶点重新编号后点不变
perm=[2,0,3,1];rp=new_points(Vs[0][perm])
scale=np.array([np.linalg.norm(r[0].V-r[0].G,axis=1).max() for r in res])
# 已有点
P=D['P'];ok=D['ok'];grp=D['grp']
oldk=[g for g in grp];old=np.concatenate([P[a][oldk]/scale[a] for a in range(NT)],axis=1)
from orbits import orbits
oruns=[orbits(r[0]) for r in res];og=D['orb_good']
oldo=[];oldon=[]
for k in og:
    for j in range(len(oruns[0][k][3])):
        oldo.append(np.concatenate([oruns[a][k][3][j]/scale[a] for a in range(NT)]));oldon.append('%s.%d'%(k,j))
allold=np.vstack([old,np.array(oldo)]);names=['T%d:%s'%(b+1,KEYS[b]) for b in oldk]+['L:'+x for x in oldon]
tr=cKDTree(allold)
newc=[];rep=collections.Counter()
for k in res[0][1]:
    pts=[r[1][k][1] for r in res]
    if any(p is None or not np.all(np.isfinite(p)) for p in pts):rep['无定义']+=1;continue
    if np.linalg.norm(rp[1][k][1]-res[0][1][k][1])>1e-7*scale[0]:print('不是中心',k);rep['不是中心']+=1;continue
    x=np.concatenate([pts[a]/scale[a] for a in range(NT)])
    if np.abs(x).max()>1e4:rep['无穷远']+=1;continue
    d,i=tr.query(x)
    if d<1e-6:print('  已有',k,'=',names[i]);rep['和已有点重合']+=1;continue
    if any(np.linalg.norm(x-y)<1e-6 for _,y in newc):print('  新点之间重合',k);rep['新点之间重合']+=1;continue
    newc.append((k,x))
print('新中心',len(newc),rep)
def same_set(A,B,s):return len(A)==len(B) and all(min(np.linalg.norm(x-y) for y in B)<1e-7*s for x in A)
newo=[]
for k in res[0][2]:
    pts=[r[2][k][1] for r in res]
    if any(p is None or not np.all(np.isfinite(np.array(p,float))) for p in pts):print('轨道无定义',k);continue
    if not same_set([np.array(v) for v in res[0][2][k][1]],[np.array(v) for v in rp[2][k][1]],scale[0]):print('不是轨道',k);continue
    hits=[]
    for j in range(len(pts[0])):
        x=np.concatenate([np.array(pts[a][j])/scale[a] for a in range(NT)]);d,i=tr.query(x)
        if d<1e-6:hits.append(names[i])
    if hits:print('  轨道已有',k,hits);continue
    newo.append(k)
print('新轨道族',len(newo),newo,'点数',sum(len(res[0][2][k][1]) for k in newo))
pickle.dump(dict(newc=[k for k,_ in newc],newo=newo,meta_c={k:res[0][1][k][0] for k,_ in newc},meta_o={k:res[0][2][k][0] for k in newo}),open('ortho_new.pkl','wb'))
