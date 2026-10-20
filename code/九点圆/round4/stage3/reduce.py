import numpy as np,pickle,collections,itertools,math
d=pickle.load(open('big.pkl','rb'));tris=d['tris'];NT=len(tris)
A_=pickle.load(open('bigall.pkl','rb'));AK=A_['keys'];PA=A_['Pall'];AI={k:i for i,k in enumerate(AK)}
om=pickle.load(open('omega.pkl','rb'));rel=pickle.load(open('etc_rel.pkl','rb'))
Pt=lambda k:PA[:,AI[k]]
def named(t):
    A,B,Cc=tris[t];a=np.linalg.norm(B-Cc);b=np.linalg.norm(Cc-A);c=np.linalg.norm(A-B);s=(a+b+c)/2;D=math.sqrt(s*(s-a)*(s-b)*(s-c))
    X=lambda k:PA[t,AI[k]];O=X(3);R2=(A-O)@(A-O);r=D/s
    cA=(b*b+c*c-a*a)/(2*b*c);cB=(c*c+a*a-b*b)/(2*c*a);cC=(a*a+b*b-c*c)/(2*a*b);cotw=(a*a+b*b+c*c)/(4*D);sw2=1/(1+cotw**2)
    dia=lambda i,j:((X(i)+X(j))/2,((X(i)-X(j))@(X(i)-X(j)))/4)
    return {'外接圆':(O,R2),'九点圆':(X(5),R2/4),'内切圆':(X(1),r*r),'Brocard圆':dia(3,6),'垂心-重心圆':dia(2,4),'polar圆':(X(4),-4*R2*cA*cB*cC),
            'Spieker圆':(X(10),r*r/4),'Bevan圆':(X(40),4*R2),'Conway圆':(X(1),r*r+s*s),'第二Brocard圆':(O,R2*(1-4*sw2)),'de Longchamps圆':(X(20),-16*R2*cA*cB*cC)}
NM=[named(t) for t in range(NT)]
names=list(NM[0])
def close(u,v):return np.all(np.abs(u-v)<1e-7*(1+np.abs(v)))
def onc(k,nm):
    c0=np.array([NM[t][nm][0] for t in range(NT)]);r2=np.array([NM[t][nm][1] for t in range(NT)])
    return close(((Pt(k)-c0)**2).sum(1),r2)
def pow_(X,nm):
    c0=np.array([NM[t][nm][0] for t in range(NT)]);r2=np.array([NM[t][nm][1] for t in range(NT)])
    return ((Pt(X)-c0)**2).sum(1)-r2
def match(pts):
    dd=np.max(np.linalg.norm(PA-pts[:,None,:],axis=2)/(1+np.linalg.norm(pts,axis=1))[:,None],axis=0)
    j=np.argmin(dd);return AK[j] if dd[j]<1e-7 else None
out=[];stat=collections.Counter();openrel=[]
for cnt,X,desc,pairs in om['rows']:
    a,b=pairs[0];k=((Pt(a)-Pt(X))*(Pt(b)-Pt(X))).sum(1)
    # ω on which named points? (points at distance^2 = k)
    on_w=[K for K in AK if close(((Pt(K)-Pt(X))**2).sum(1),k)] if np.all(k>0) else []
    orth=[nm for nm in names if close(pow_(X,nm),k)]
    cls={}
    for p,q in pairs:
        why=None
        for nm in orth:
            if onc(p,nm) and onc(q,nm):why='弦的两端（%s上，圆幂定理）'%nm;break
            c0=np.array([NM[t][nm][0] for t in range(NT)])
            for u,v in ((p,q),(q,p)):
                if close(Pt(u),c0):
                    r2=np.array([NM[t][nm][1] for t in range(NT)]);dX=Pt(X)-c0;invX=c0+(r2/(dX**2).sum(1))[:,None]*dX
                    if close(Pt(v),invX):why='由定义（%s的圆心与 X%d 的反演点）'%(nm,X)
            if why:break
        if not why:
            for U,V in itertools.combinations(on_w,2):
                if (frozenset((p,q)),frozenset((U,V))) in rel['harm']:why='ETC 记载：关于 {X%d,X%d} 调和'%(U,V);break
        if not why and frozenset((p,q)) in rel['invl']:why='ETC 有反演记载：'+sorted(rel['invl'][frozenset((p,q))])[0][:60]
        if not why:
            # harmonic wrt two named points of ω on line pq (geometric)
            for U,V in itertools.combinations(on_w,2):
                M=np.stack([Pt(U),Pt(V),Pt(p),Pt(q)],1)
                u=M[:,1]-M[:,0];ok=all(np.max(np.abs(u[:,0]*(M[:,j]-M[:,0])[:,1]-u[:,1]*(M[:,j]-M[:,0])[:,0]))<1e-7*np.max(np.abs(u)) for j in (2,3))
                if ok:why='调和：关于 ω 上的 X%d、X%d（ETC 未写明）'%(U,V);break
        cls[(p,q)]=why or '待查'
        stat['平凡/已记载' if why and not why.startswith('调和') else ('调和(未写明)' if why else '待查')]+=1
        if not why:openrel.append((X,(p,q)))
    out.append(dict(cnt=cnt,X=X,desc=desc,on_w=on_w[:6],orth=orth,cls=cls))
print(stat)
print('distinct open pair relations',len(openrel))
pickle.dump(dict(out=out,openrel=openrel),open('reduce.pkl','wb'))
for o in out[:12]:
    print('ω 圆心 X%d'%o['X'],'| 正交于',o['orth'],'| ω 上的有名点',o['on_w'],'| 圆数',o['cnt'])
    for pq,w in o['cls'].items():print('     X%d↔X%d :'%pq,w)
