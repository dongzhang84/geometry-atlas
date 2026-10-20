# 垂心四面体 1167 点（913 原子中心 + 254 轨道点）：共线、共面
import pickle,numpy as np,itertools,time,collections,sys
from tetlib import EDGES
_d=pickle.load(open('ortho_points.pkl','rb'))
labels=_d['labels'];kind=_d['kind'];P=_d['P']
if len(sys.argv)>1:_n=int(sys.argv[1]);P=P[:,:_n];labels=labels[:_n];kind=kind[:_n]
oidx=[None if k=='c' else (l.rsplit('.',1)[0],int(l.rsplit('.',1)[1])) for l,k in zip(labels,kind)]
P=np.array(P);N=P.shape[1];NT=6
print('点数',N,flush=True)
PAIRS=[((0,1),(2,3)),((0,2),(1,3)),((0,3),(1,2))]
def lab_perm(i,s):
    if kind[i]=='c':return labels[i]
    L,j=oidx[i];k=kind[i]
    if k==4:return '%s.%d'%(L,s[j])
    if k==6:e=EDGES[j];return '%s.%d'%(L,EDGES.index(tuple(sorted((s[e[0]],s[e[1]])))))
    p=PAIRS[j];q=tuple(sorted((tuple(sorted((s[p[0][0]],s[p[0][1]]))),tuple(sorted((s[p[1][0]],s[p[1][1]]))))))
    return '%s.%d'%(L, [tuple(sorted(pp)) for pp in [tuple(sorted(x)) for x in PAIRS]].index(q))
PERMS=list(itertools.permutations(range(4)))
def canon(S):
    return min(tuple(sorted(lab_perm(i,s) for i in S)) for s in PERMS)
scale=np.array([np.linalg.norm(P[t]-P[t].mean(0),axis=1).max() for t in range(NT)])
def rank_ok(S,dim,tol=1e-9):
    for t in range(NT):
        X=P[t][list(S)];X=X-X.mean(0);s=np.linalg.svd(X,compute_uv=False)
        if s[dim]>tol*max(s[0],1e-300):return False
    return True
# ---------------- 共线 ----------------
t0=time.time();lines=set()
X=P[0]
for i in range(N):
    D=X-X[i];n=np.linalg.norm(D,axis=1);n[i]=1;U=D/n[:,None]
    C=np.abs(U@U.T);np.fill_diagonal(C,0);C[i,:]=0;C[:,i]=0
    J,K=np.where(np.triu(C,1)>1-1e-11)
    for j,k in zip(J,K):lines.add(frozenset((i,j,k)))
# 合并成最大组：按「两点决定一条线」
def merge(sets,share):
    sets=[set(s) for s in sets];changed=True
    while changed:
        changed=False;out=[]
        for s in sets:
            for o in out:
                if len(o&s)>=share:o|=s;changed=True;break
            else:out.append(s)
        sets=out
    return sets
# 先验证三元组，再合并
tri=[s for s in lines if rank_ok(s,1,1e-8)]
L=merge(tri,2);L=[s for s in L if rank_ok(s,1,1e-8)]
print('共线：候选三元组',len(lines),'复核后',len(tri),'合并成直线',len(L),'%.0fs'%(time.time()-t0),flush=True)
pickle.dump(dict(labels=labels,kind=kind,lines=L),open('oscan_lines%s.pkl'%('_'+sys.argv[1] if len(sys.argv)>1 else ''),'wb'))
# ---------------- 共面 ----------------
t0=time.time();onl=collections.defaultdict(set)
for s in L:
    for i,j in itertools.combinations(sorted(s),2):onl[(i,j)]|=s
ptl=collections.defaultdict(set)
for li,s_ in enumerate(L):
    for p in s_:ptl[p].add(li)
def trivial(S):
    c=collections.Counter(l for p in S for l in ptl[p])
    return bool(c) and max(c.values())>=len(S)-1
planes=set()
for i in range(N):
    D=X-X[i]
    for j in range(i+1,N):
        ax=D[j];axn=ax/np.linalg.norm(ax)
        Q=D-np.outer(D@axn,axn);nq=np.linalg.norm(Q,axis=1)
        good=nq>1e-9*scale[0];good[i]=good[j]=False
        if (i,j) in onl:
            for k in onl[(i,j)]:good[k]=False
        ref=Q[np.argmax(nq*good)];ref=ref/np.linalg.norm(ref);ref2=np.cross(axn,ref)
        ang=np.mod(np.arctan2(Q@ref2,Q@ref),np.pi);idx=np.where(good)[0];av=ang[idx]
        o=np.argsort(av);av=av[o];idx=idx[o]
        d=np.diff(av);brk=np.where(d>1e-9)[0]
        starts=np.concatenate([[0],brk+1]);ends=np.concatenate([brk+1,[len(av)]])
        # 环绕：首尾接近 π
        for s_,e_ in zip(starts,ends):
            if e_-s_>=2:
                S_=frozenset([i,j,*idx[s_:e_]])
                if not trivial(S_):planes.add(S_)
        if len(av)>1 and av[0]+np.pi-av[-1]<1e-9:
            S_=frozenset([i,j,idx[0],idx[-1]])
            if not trivial(S_):planes.add(S_)
    if i%100==0:print(' ',i,len(planes),'%.0fs'%(time.time()-t0),flush=True)
print('共面候选',len(planes))
# 复核：在其余四面体上逐个检查，失败的集合交给更细的拆分（再找子平面）
def subplanes(S,t):
    S=sorted(S);res=set()
    for i,j in itertools.combinations(S,2):
        D=P[t][S]-P[t][i];ax=P[t][j]-P[t][i];axn=ax/np.linalg.norm(ax)
        Q=D-np.outer(D@axn,axn);nq=np.linalg.norm(Q,axis=1)
        good=nq>1e-9*scale[t]
        if not good.any():continue
        ref=Q[np.argmax(nq)];ref/=np.linalg.norm(ref);ref2=np.cross(axn,ref)
        ang=np.mod(np.arctan2(Q@ref2,Q@ref),np.pi)
        grp=collections.defaultdict(list)
        for k,(g,an) in enumerate(zip(good,ang)):
            if g:grp[round(an/1e-7)].append(S[k])
        for v in grp.values():
            if len(v)>=2:res.add(frozenset([i,j,*v]))
    return res
def flat_mask(sets,t):
    # 批量判断：按点数分组，堆叠后一次做 SVD
    out=np.zeros(len(sets),bool);byn=collections.defaultdict(list)
    for q,S in enumerate(sets):byn[len(S)].append(q)
    for m,qs in byn.items():
        for c0 in range(0,len(qs),200000):
            qq=qs[c0:c0+200000];idx=np.array([sorted(sets[q]) for q in qq])
            X_=P[t][idx];X_=X_-X_.mean(1,keepdims=True);sv=np.linalg.svd(X_,compute_uv=False)
            out[qq]=sv[:,2]<1e-9*sv[:,0]
    return out
cur=list(planes)
for t in range(1,NT):
    ok=flat_mask(cur,t);nxt=set(S for S,o in zip(cur,ok) if o)
    for S,o in zip(cur,ok):
        if not o and len(S)>4:nxt|=subplanes(S,t)
    cur=list(nxt);print('  复核四面体',t,'剩',len(cur),'%.0fs'%(time.time()-t0),flush=True)
# 去掉被别的平面包含的
cur=sorted(cur,key=len,reverse=True);final=[]
for S in cur:
    if not any(S<=F for F in final):final.append(S)
final=[S for S in final if rank_ok(S,2,1e-9) and not trivial(S)]
print('共面：复核后',len(final),'%.0fs'%(time.time()-t0))
pickle.dump(dict(labels=labels,kind=kind,lines=L,planes=final),open('oscan_planes%s.pkl'%('_'+sys.argv[1] if len(sys.argv)>1 else ''),'wb'))
