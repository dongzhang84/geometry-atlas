import numpy as np,pickle,itertools
A_=pickle.load(open('bigall.pkl','rb'));AK=A_['keys'];PA=A_['Pall'];AI={k:i for i,k in enumerate(AK)}
cl=pickle.load(open('closure.pkl','rb'));reg=cl['reg'];idw=pickle.load(open('identw.pkl','rb'))
small=[k for k in AK if k<=200]
def pairs_for(X,k):
    Xp=PA[:,AI[X]];out=[]
    for u,v in itertools.combinations(small,2):
        if X in (u,v):continue
        U=PA[:,AI[u]]-Xp;V=PA[:,AI[v]]-Xp
        cr=np.abs(U[:,0]*V[:,1]-U[:,1]*V[:,0])/(np.linalg.norm(U,axis=1)*np.linalg.norm(V,axis=1)+1e-300)
        if np.max(cr)>1e-8:continue
        if np.all(np.abs((U*V).sum(1)-k)<1e-7*(1+np.abs(k))):out.append((u,v))
    return out
top=sorted(cl['need'].items(),key=lambda kv:-len(kv[1]))[:12]
res=[]
for (w,(p,q)),cs in top:
    X,k=reg[w];pr=pairs_for(X,k)
    lab=idw.get((X,(p,q)),([],[]))[0]
    print('ω圆心X%d'%X,'X%d↔X%d'%(p,q),'| ω:',lab[:2],'| 编号≤200的其他反演对:',pr[:6])
    res.append((X,p,q,len(cs),lab,pr))
pickle.dump(res,open('simplest.pkl','wb'))
