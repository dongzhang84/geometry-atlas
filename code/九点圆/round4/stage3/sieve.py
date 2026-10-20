import numpy as np,pickle,itertools,collections
d=pickle.load(open('big.pkl','rb'));keys=d['keys'];P=d['P'];tris=d['tris'];NT=P.shape[0]
idx={k:i for i,k in enumerate(keys)}
C=pickle.load(open('bigcircles.pkl','rb'))['circles']
def circfit(pts):
    p1,p2,p3=pts[:3];M=np.array([2*(p2-p1),2*(p3-p1)]);c=np.linalg.solve(M,[p2@p2-p1@p1,p3@p3-p1@p1]);return c,(p1-c)@(p1-c)
def match(pts):  # pts (NT,2) -> trusted key or None
    dd=np.max(np.linalg.norm(P-pts[:,None,:],axis=2)/(1+np.linalg.norm(pts,axis=1))[:,None],axis=0)
    j=np.argmin(dd);return keys[j] if dd[j]<1e-7 else None
# ---------- maps (similarities) for translation sieve
def X(k):return P[:,idx[k]]
G_,O_,H_=X(2),X(3),X(4)
maps={'补点(G,-1/2)':lambda Y:(3*G_-Y)/2,'反补点(G,-2)':lambda Y:3*G_-2*Y,'关于O对称':lambda Y:2*O_-Y,
      '关于G对称':lambda Y:2*G_-Y,'H为中心缩半':lambda Y:(H_+Y)/2,'H为中心放倍':lambda Y:2*Y-H_,
      '关于X5对称':lambda Y:2*X(5)-Y,'关于X1对称':lambda Y:2*X(1)-Y,'X1为中心缩半':lambda Y:(X(1)+Y)/2,'X1为中心放倍':lambda Y:2*Y-X(1)}
image={}
for name,f in maps.items():
    image[name]={k:match(f(P[:,i])) for k,i in idx.items()}
csets=[frozenset(c) for c in C]
where=collections.defaultdict(list)
for ci,c in enumerate(csets):
    for q in itertools.combinations(sorted(c),3):where[q].append(ci)
links=collections.defaultdict(set)
for ci,c in enumerate(csets):
    for name in maps:
        im=[image[name][k] for k in c]
        if None in im:continue
        q=tuple(sorted(im))[:3]
        tgt=[cj for cj in where.get(tuple(sorted(im[:3])),[]) if set(im)<=csets[cj]]
        for cj in tgt:
            if cj!=ci:links[ci].add((cj,name))
# components
comp=list(range(len(C)))
def find(x):
    while comp[x]!=x:comp[x]=comp[comp[x]];x=comp[x]
    return x
for a,s in links.items():
    for b,_ in s:comp[find(a)]=find(b)
comps=collections.defaultdict(list)
for i in range(len(C)):comps[find(i)].append(i)
print('circles',len(C),'translation families',len(comps),'sizes',collections.Counter(len(v) for v in comps.values()).most_common(8))
# ---------- inverse-pair sieve with diameter circles over trusted pairs + named circles
def named(t):
    A,B,Cc=tris[t];a=np.linalg.norm(B-Cc);b=np.linalg.norm(Cc-A);c=np.linalg.norm(A-B);s=(a+b+c)/2;D=np.sqrt(s*(s-a)*(s-b)*(s-c))
    O=P[t,idx[3]];R2=(A-O)@(A-O);r=D/s;N=P[t,idx[5]];I=P[t,idx[1]];H=P[t,idx[4]]
    cosA=(b*b+c*c-a*a)/(2*b*c);cosB=(c*c+a*a-b*b)/(2*c*a);cosC=(a*a+b*b-c*c)/(2*a*b)
    cotw=(a*a+b*b+c*c)/(4*D);sinw2=1/(1+cotw**2)
    return {'外接圆':(O,R2),'九点圆':(N,R2/4),'内切圆':(I,r*r),'第二Brocard圆':(O,R2*(1-4*sinw2)),'polar圆':(H,-4*R2*cosA*cosB*cosC),
            'de Longchamps圆':(P[t,idx[20]],-16*R2*cosA*cosB*cosC),'Bevan圆':(P[t,idx[40]],4*R2),'Conway圆':(I,r*r+s*s),'Spieker圆':(P[t,idx[10]],r*r/4),
            '外接圆(反演取负)':(O,-R2)}
NM=[named(t) for t in range(NT)]
def inv_pair_ok(c0,r2,p,q):   # p,q (NT,2)
    u=p-c0;v=q-c0
    cr=np.abs(u[:,0]*v[:,1]-u[:,1]*v[:,0])/(np.linalg.norm(u,axis=1)*np.linalg.norm(v,axis=1)+1e-300)
    dot=(u*v).sum(1)
    return np.all(cr<1e-8) and np.all(np.abs(dot-r2)/(np.abs(r2)+np.linalg.norm(u,axis=1)*np.linalg.norm(v,axis=1))<1e-8)
expl={}
for ci,c in enumerate(C):
    pts=np.stack([P[:,idx[k]] for k in c],1)   # NT,m,2
    found=None
    # named circles
    for nm in NM[0]:
        c0=np.array([NM[t][nm][0] for t in range(NT)]);r2=np.array([NM[t][nm][1] for t in range(NT)])
        prs=[(a,b) for a,b in itertools.combinations(range(len(c)),2) if inv_pair_ok(c0,r2,pts[:,a],pts[:,b])]
        used=set();k=0
        for a,b in prs:
            if a not in used and b not in used:used|={a,b};k+=1
        if k>=2:found=('反演对',nm,[(c[a],c[b]) for a,b in prs]);break
    if found is None:
        # conjugate trusted pairs wrt circle (diameter circles orthogonal)
        cf=[circfit(pts[t]) for t in range(NT)]
        ok=None
        for t in range(NT):
            c0,r2=cf[t];Q=P[t]-c0;Gm=Q@Q.T-r2;sc=np.abs(r2)+np.linalg.norm(Q,axis=1)[:,None]*np.linalg.norm(Q,axis=1)[None,:]
            h=np.abs(Gm)/sc<1e-8;ok=h if ok is None else ok&h
        ii,jj=np.where(np.triu(ok,1))
        for i,j in zip(ii,jj):
            if keys[i] in c and keys[j] in c:continue
            c0=(P[:,i]+P[:,j])/2;r2=((P[:,i]-c0)**2).sum(1)
            prs=[(a,b) for a,b in itertools.combinations(range(len(c)),2) if inv_pair_ok(c0,r2,pts[:,a],pts[:,b])]
            used=set();k=0
            for a,b in prs:
                if a not in used and b not in used:used|={a,b};k+=1
            if k>=2:found=('反演对','以X%d X%d为直径'%(keys[i],keys[j]),[(c[a],c[b]) for a,b in prs]);break
    expl[ci]=found
pickle.dump(dict(C=C,links=dict(links),comps=dict(comps),expl=expl),open('sieve.pkl','wb'))
nA=sum(v is not None for v in expl.values())
famA=sum(any(expl[i] is not None for i in v) for v in comps.values())
print('circles with inverse-pair explanation',nA,'/',len(C))
print('families',len(comps),'families with at least one inverse-pair-explained member',famA)
