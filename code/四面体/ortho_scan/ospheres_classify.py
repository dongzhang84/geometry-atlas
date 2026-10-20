# 垂心四面体共球结果分类：python3 ospheres_classify.py ospheres_raw_<点数>.pkl
# 已知球：外接球、内切球、十二点球（12 点）、棱中点球（球心 G）、极球（球心 H，幂 p = HV_i·HF_i，可正可负）
import sys,pickle,collections,itertools,numpy as np
exec(open('opoints.py').read())
from tetlib import T as TT
raw=pickle.load(open(sys.argv[1],'rb'));SPH=raw['spheres'];n=len(raw['labels'])
TS=[TT(V) for V in a['Vs']]
KNOWN=[]
for t in range(NT):
    tt=TS[t];G,O=tt.G,tt.O;H=2*G-O;V=tt.V
    F0=V[0]-((V[0]-V[1])@np.cross(V[2]-V[1],V[3]-V[1]))/np.sum(np.cross(V[2]-V[1],V[3]-V[1])**2)*np.cross(V[2]-V[1],V[3]-V[1])
    p=(V[0]-H)@(F0-H)
    KNOWN.append({'外接球':(O,tt.R**2),'内切球':(tt.I,tt.r**2),'十二点球':((4*G-O)/3,(tt.R/3)**2),
                  '棱中点球':(G,np.sum(((V[0]+V[1])/2-G)**2)),'极球':(H,p)})
CEN={'外接球':'T2','内切球':'T5','十二点球':'T4','棱中点球':'T1','极球':'T3'}
def fit(S,t):
    Q=P[t][list(S)];A=2*(Q[1:]-Q[0]);b=(Q[1:]**2).sum(1)-(Q[0]**2).sum()
    c=np.linalg.lstsq(A,b,rcond=None)[0];return c,np.linalg.norm(Q[0]-c)
def same_sphere(S,nm):
    for t in range(NT):
        C,pw=KNOWN[t][nm]
        if pw<=0:return False
        c,R=fit(S,t)
        if np.linalg.norm(c-C)>1e-7*scale[t] or abs(R-np.sqrt(pw))>1e-7*scale[t]:return False
    return True
def inv_pairs(S,nm):
    pr=[]
    for i,j in itertools.combinations(list(S),2):
        ok=True
        for t in range(NT):
            C,pw=KNOWN[t][nm];u=P[t][i]-C;v=P[t][j]-C;nu,nv=np.linalg.norm(u),np.linalg.norm(v)
            if nu*nv==0 or np.linalg.norm(np.cross(u,v))>1e-8*nu*nv or abs(u@v-pw)>1e-8*abs(pw):ok=False;break
        if ok:pr.append((i,j))
    return pr
def coplanar_all(X):
    X=np.array(X);X=X-X.mean(0);s=np.linalg.svd(X,compute_uv=False);return s[2]<1e-8*s[0]
def plane_image(S,nm,cl):
    if cl<0 or cl not in S:return False
    oth=[i for i in S if i!=cl]
    for t in range(NT):
        C,pw=KNOWN[t][nm];Y=[C+pw*(P[t][i]-C)/np.sum((P[t][i]-C)**2) for i in oth]
        if not coplanar_all(Y):return False
    return True
def thales(S):
    t=0;c,R=fit(S,t)
    on=np.where(np.abs(np.linalg.norm(P[t][:n]-c,axis=1)-R)<1e-8*scale[t])[0]
    for x in on:
        y=np.argmin(np.linalg.norm(P[t][:n]-(2*c-P[t][x]),axis=1))
        if y!=x and np.linalg.norm(P[t][y]-(2*c-P[t][x]))<1e-8*scale[t]:return True
    return False
lab=raw['labels']
cnt=collections.Counter();left=[]
for S in SPH:
    why=None
    for nm in KNOWN[0]:
        if same_sphere(S,nm):why='就是%s'%nm;break
    if not why:
        for nm in KNOWN[0]:
            pr=inv_pairs(S,nm)
            if len(pr)>=3 and set(x for p in pr for x in p)>=set(S):why='三对以上点关于%s互为反演'%nm;break
    if not why:
        for nm in ('外接球','内切球','极球'):
            cl=lab.index(CEN[nm]) if CEN[nm] in lab else -1
            if plane_image(S,nm,cl):why='平面关于%s的反演像（球过球心）'%nm;break
    if not why and thales(S):why='以两个库点为直径的球'
    if why:cnt[why]+=1
    else:left.append(S)
print('球',len(SPH));print(cnt);print('未解释',len(left))
can=collections.defaultdict(list)
for S in left:can[canon(S)].append(S)
print('未解释的按顶点对称合并',len(can),'；点数分布',collections.Counter(len(c) for c in can))
pickle.dump(dict(cnt=cnt,left=left,can=dict(can)),open(sys.argv[1].replace('raw','cls'),'wb'))
