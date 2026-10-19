import sys,itertools,json;sys.path.insert(0,'.')
from centers import *
res=json.load(open('res3.json'))
lines=[frozenset(int(x[1:]) for x in L) for L in res['lines']]
circles=[frozenset(int(x[1:]) for x in C) for C in res['circles']]
t=(np.array([-2.,1.2]),np.array([2.2,1.4]),np.array([-0.7,-1.6]))
t2=(np.array([-1.3,0.2]),np.array([2.9,-0.4]),np.array([0.4,2.5]))
def opmap(t):
    X=centers(*t);G=X[2];O=X[3];R=np.linalg.norm(t[0]-O)
    f={'补点':lambda P:(3*G-P)/2,'反补点':lambda P:3*G-2*P,'关于O对称':lambda P:2*O-P,
       '外接圆反演':lambda P:O+(P-O)*R*R/((P-O)@(P-O))}
    m={}
    for nm,g in f.items():
        d={}
        for k,P in X.items():
            if nm=='外接圆反演' and np.linalg.norm(P-O)<1e-9:continue
            Q=g(P)
            for j,S in X.items():
                if np.linalg.norm(Q-S)<1e-8*max(1,np.linalg.norm(S)):d[k]=j
        m[nm]=d
    return m
m1,m2=opmap(t),opmap(t2)
M={nm:{k:v for k,v in m1[nm].items() if m2[nm].get(k)==v} for nm in m1}
rels=[('线',L) for L in lines]+[('圆',C) for C in circles]
def name(S):return '{'+' '.join('X%d'%x for x in sorted(S))+'}'
# transfers: image of relation A under op lands on relation B with >= 3(line)/4(circle) points
trans=[]
for i,(ka,A) in enumerate(rels):
    for nm,d in M.items():
        img=frozenset(d[k] for k in A if k in d)
        need=3
        for j,(kb,B) in enumerate(rels):
            if i==j:continue
            common=img&B
            if len(common)>=need and (len(common)>=3):
                # type check: lines->lines except inversion (line not through O -> circle)
                trans.append((i,nm,j,common))
for i,nm,j,cm in trans:
    print(rels[i][0],name(rels[i][1]),'--'+nm+'-->',rels[j][0],name(rels[j][1]),' 对应点',name(cm))
