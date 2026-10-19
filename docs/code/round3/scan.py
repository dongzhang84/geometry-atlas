import numpy as np, itertools, sys, json
from geo import metric, points
rng=np.random.default_rng(int(sys.argv[2]))
mode=sys.argv[1]  # ell or hyp
cfgs=[]
while len(cfgs)<25:
    A=rng.uniform([-1,1.5],[1,4]);B=rng.uniform([-4,-1],[-2,0.5]);C=rng.uniform([2,-1],[4,0.5])
    area=abs((B-A)[0]*(C-A)[1]-(B-A)[1]*(C-A)[0])
    if area<3:continue
    if mode=='ell':
        w=rng.dirichlet([2,2,2]);P=w[0]*A+w[1]*B+w[2]*C
    else:
        P=rng.uniform(-25,25,2)
    S=metric(A,B,C,P)
    if S is None:continue
    if (np.linalg.det(S)>0)!=(mode=='ell'):continue
    pts,ex=points(A,B,C,S)
    if 'F' not in pts:continue
    if np.linalg.norm(pts['H']-P)>1e-7*max(1,np.linalg.norm(P)):raise SystemExit('H!=P')
    if max(np.linalg.norm(v) for v in pts.values())>1e4:continue
    cfgs.append((pts,S))
names=list(cfgs[0][0].keys());n=len(names);print(mode,'points',n)
def colin(X,Y,Z):
    u=Y-X;v=Z-X;return abs(u[0]*v[1]-u[1]*v[0])/(np.linalg.norm(u)*np.linalg.norm(v)+1e-300)
def concyc(Ps,S):
    M=np.array([[p@S@p,p[0],p[1],1] for p in Ps]);
    sc=np.linalg.norm(M,axis=0);sc[sc==0]=1;M=M/sc
    return abs(np.linalg.det(M))
tol=1e-8
lines=[];circs=[]
for tr in itertools.combinations(range(n),3):
    if all(colin(*[c[0][names[i]] for i in tr])<tol for c in cfgs):lines.append(set(tr))
lineset=[frozenset(l) for l in lines]
def in_line(q):
    return any(len(q&l)>=3 for l in lineset)
for qd in itertools.combinations(range(n),4):
    q=frozenset(qd)
    # skip if 3 collinear in quad (degenerate)
    if any(frozenset(t) in set(lineset) for t in itertools.combinations(qd,3)):continue
    if all(concyc([c[0][names[i]] for i in qd],c[1])<tol for c in cfgs[:6]):
        if all(concyc([c[0][names[i]] for i in qd],c[1])<tol for c in cfgs):circs.append(q)
# coincident points check
coinc=[(names[i],names[j]) for i,j in itertools.combinations(range(n),2) if all(np.linalg.norm(c[0][names[i]]-c[0][names[j]])<1e-9 for c in cfgs)]
def merge(groups,k=3):
    groups=[set(g) for g in groups];changed=True
    while changed:
        changed=False
        for i in range(len(groups)):
            for j in range(i+1,len(groups)):
                if len(groups[i]&groups[j])>=k:
                    groups[i]|=groups[j];groups.pop(j);changed=True;break
            if changed:break
    return groups
L=merge(lines,2);Cc=merge(circs)
def nm(g):return '、'.join(names[i] for i in sorted(g))
print('coincident',coinc)
print('LINES',len(L));[print('  ',nm(g)) for g in sorted(L,key=lambda g:-len(g))]
print('CIRCLES',len(Cc));[print('  ',nm(g)) for g in sorted(Cc,key=lambda g:-len(g))]
json.dump(dict(lines=[sorted(names[i] for i in g) for g in L],circles=[sorted(names[i] for i in g) for g in Cc]),open(f'res_{mode}.json','w'),ensure_ascii=False)
