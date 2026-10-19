import numpy as np,pickle,itertools,collections,json
d=pickle.load(open('big.pkl','rb'));keys=d['keys'];P=d['P'];NT=P.shape[0];idx={k:i for i,k in enumerate(keys)}
A_=pickle.load(open('bigall.pkl','rb'));AK=A_['keys'];PA=A_['Pall'];D=A_['D']
S=pickle.load(open('sieve.pkl','rb'));C=S['C'];expl=S['expl']
S2=pickle.load(open('sieve2.pkl','rb'))
SA=pickle.load(open('sieve_all.pkl','rb'));named=SA['named']
def matchin(PP,KK,pts,tol=1e-7):
    dd=np.max(np.linalg.norm(PP-pts[:,None,:],axis=2)/(1+np.linalg.norm(pts,axis=1))[:,None],axis=0)
    j=np.argmin(dd);return KK[j] if dd[j]<tol else None
csets=[frozenset(c) for c in C]
where=collections.defaultdict(list)
for ci,c in enumerate(csets):
    for q in itertools.combinations(sorted(c),3):where[q].append(ci)
links=collections.defaultdict(set);trans={}
# derived-triangle relabel
for T,(KT,PT) in D.items():
    for ci,c in enumerate(C):
        lab=[matchin(PT,KT,P[:,idx[k]]) for k in c]
        if None in lab:continue
        trans.setdefault(ci,[]).append((T,lab))
        for cj in where.get(tuple(sorted(lab)[:3]),[]):
            if set(lab)<=csets[cj] and cj!=ci:links[ci].add(cj)
# inversion with expanded identification
import math
def named_c(t):
    A,B,Cc=d['tris'][t];a=np.linalg.norm(B-Cc);b=np.linalg.norm(Cc-A);c=np.linalg.norm(A-B);s=(a+b+c)/2;Dd=math.sqrt(s*(s-a)*(s-b)*(s-c))
    O=P[t,idx[3]];R2=(A-O)@(A-O);r=Dd/s;cosA=(b*b+c*c-a*a)/(2*b*c);cosB=(c*c+a*a-b*b)/(2*c*a);cosC=(a*a+b*b-c*c)/(2*a*b)
    return {'外接圆':(O,R2),'九点圆':(P[t,idx[5]],R2/4),'内切圆':(P[t,idx[1]],r*r),'polar圆':(P[t,idx[4]],-4*R2*cosA*cosB*cosC),'Bevan圆':(P[t,idx[40]],4*R2)}
NMc=[named_c(t) for t in range(NT)]
invs={nm:(np.array([NMc[t][nm][0] for t in range(NT)]),np.array([NMc[t][nm][1] for t in range(NT)])) for nm in NMc[0]}
for i,j in [(2,4),(3,6),(1,3)]:
    c0=(P[:,idx[i]]+P[:,idx[j]])/2;invs['以X%dX%d为直径'%(i,j)]=(c0,((P[:,idx[i]]-c0)**2).sum(1))
L={int(k):v for k,v in json.load(open('etc_lines.json')).items()}
toline={}
for ci,c in enumerate(C):
    for nm,(c0,k) in invs.items():
        imgs=[];hasc=False
        for key in c:
            Y=P[:,idx[key]];dv=Y-c0;dd=(dv*dv).sum(1)
            if np.max(dd)<1e-14:hasc=True;continue
            imgs.append(matchin(PA,AK,c0+(k/dd)[:,None]*dv))
        if None in imgs:continue
        if hasc:toline.setdefault(ci,(nm,imgs))
        else:
            for cj in where.get(tuple(sorted(imgs)[:3]),[]):
                if set(imgs)<=csets[cj] and cj!=ci:links[ci].add(cj)
for a,s in S['links'].items():
    for b,_ in s:links[a].add(b)
for a,s in S2['links'].items():
    for b,_ in s:links[a].add(b)
adj=collections.defaultdict(set)
for a,s in links.items():
    for b in s:adj[a].add(b);adj[b].add(a)
seen=set();fams=[]
for i in range(len(C)):
    if i in seen:continue
    st=[i];f=[]
    while st:
        x=st.pop()
        if x in seen:continue
        seen.add(x);f.append(x);st+=list(adj[x])
    fams.append(f)
def why(i):
    if i in named:return '本身是有名的圆'
    if expl[i] is not None:return '两对反演点（%s）'%expl[i][1]
    if i in toline:return '经%s反演变成直线（等价于共线）'%toline[i][0]
    if i in S2['res']:return '经%s反演变成直线（等价于共线）'%S2['res'][i][1]
    return None
ex=[f for f in fams if any(why(i) for i in f)];un=[f for f in fams if not any(why(i) for i in f)]
print('circles',len(C),'families',len(fams),'explained families',len(ex),'(circles %d)'%sum(map(len,ex)),'unexplained families',len(un),'(circles %d)'%sum(map(len,un)))
cp={98,99,100,101,103,104,105,106,107,108,109,110,112,675}
print('unexplained families containing circumcircle point:',sum(any(set(C[i])&cp for i in f) for f in un))
pickle.dump(dict(fams=fams,un=un,ex=ex,trans=trans,toline=toline,links=dict(links)),open('sieve3.pkl','wb'))
