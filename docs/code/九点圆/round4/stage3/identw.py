import numpy as np,pickle,collections,itertools,math
d=pickle.load(open('big.pkl','rb'));tris=d['tris'];NT=len(tris)
A_=pickle.load(open('bigall.pkl','rb'));AK=A_['keys'];PA=A_['Pall'];AI={k:i for i,k in enumerate(AK)}
R3=pickle.load(open('reduce3.pkl','rb'));C=pickle.load(open('sieve.pkl','rb'))['C']
Pt=lambda k:PA[:,AI[k]]
def close(u,v,tol=1e-7):return np.all(np.abs(u-v)<tol*(1+np.abs(v)))
def circles(t):
    A,B,Cc=tris[t];a=np.linalg.norm(B-Cc);b=np.linalg.norm(Cc-A);c=np.linalg.norm(A-B);s=(a+b+c)/2;D=math.sqrt(s*(s-a)*(s-b)*(s-c))
    X=lambda k:PA[t,AI[k]];O=X(3);R2=(A-O)@(A-O);r=D/s
    cA=(b*b+c*c-a*a)/(2*b*c);cB=(c*c+a*a-b*b)/(2*c*a);cC=(a*a+b*b-c*c)/(2*a*b);cotw=(a*a+b*b+c*c)/(4*D);sw2=1/(1+cotw**2)
    dia=lambda i,j:((X(i)+X(j))/2,((X(i)-X(j))@(X(i)-X(j)))/4)
    ra,rb,rc=D/(s-a),D/(s-b),D/(s-c)
    Ia=(-a*A+b*B+c*Cc)/(-a+b+c)
    return {'外接圆':(O,R2),'九点圆':(X(5),R2/4),'内切圆':(X(1),r*r),'Brocard圆':dia(3,6),'垂心-重心圆':dia(2,4),'polar圆':(X(4),-4*R2*cA*cB*cC),
            'Spieker圆':(X(10),r*r/4),'Bevan圆':(X(40),4*R2),'Conway圆':(X(1),r*r+s*s),'第二Brocard圆':(O,R2*(1-4*sw2)),'de Longchamps圆':(X(20),-16*R2*cA*cB*cC),
            '反补圆(外接圆的反补)':(X(4),4*R2),'Fuhrmann圆':dia(4,8),'以OI为直径的圆':dia(1,3),'垂心-类似重心圆':dia(4,6),'以OH为直径的圆':dia(3,4),
            'Moses圆':(X(39),R2*sw2*(1-sw2)/1),'Gallatly圆':(X(39),R2*sw2),'切线三角形外接圆':None}
CN=[circles(t) for t in range(NT)]
names=[k for k in CN[0] if CN[0][k] is not None]
def cc(nm):return np.array([CN[t][nm][0] for t in range(NT)]),np.array([CN[t][nm][1] for t in range(NT)])
def identify(X,k):
    labels=[]
    Xp=Pt(X)
    for nm in names:
        c0,r2=cc(nm)
        if close(Xp,c0) and close(k,r2):labels.append('就是'+nm)
        pw=((Xp-c0)**2).sum(1)-r2
        if close(k,pw):labels.append('与%s正交'%nm)
        if close(k,-pw):labels.append('与%s「反正交」(平分)'%nm)
    # inverter of two named circles: center X is similitude center; k = lambda*pow(X,G1)
    for n1,n2 in itertools.combinations(names,2):
        c1,r1=cc(n1);c2,r2=cc(n2)
        if np.any(r1<=0) or np.any(r2<=0):continue
        for sgn in (1,-1):
            lam=sgn*np.sqrt(r2/r1)
            S=(c2-lam[:,None]*c1)/(1-lam)[:,None] if np.all(np.abs(1-lam)>1e-9) else None
            if S is None or not close(S,Xp):continue
            kk=lam*(((Xp-c1)**2).sum(1)-r1)
            if close(k,kk):labels.append('交换%s与%s的反演'%(n1,n2))
    if np.all(k>0):
        d2=((PA-Xp[:,None,:])**2).sum(2)
        hit=[AK[i] for i in np.where(np.all(np.abs(d2-k[:,None])<1e-7*(1+np.abs(k[:,None])),0))[0]]
        if hit:labels.append('过 '+'、'.join('X%d'%h for h in hit[:6]))
    else:
        d2=((PA-Xp[:,None,:])**2).sum(2)
        hit=[AK[i] for i in np.where(np.all(np.abs(d2+k[:,None])<1e-7*(1+np.abs(k[:,None])),0))[0]]
        if hit:labels.append('负幂，|k| = 到 '+'、'.join('X%d'%h for h in hit[:4])+' 距离的平方')
    return labels
res={};stat=collections.Counter()
for (X,(p,q)),cs in R3['dep'].items():
    k=((Pt(p)-Pt(X))*(Pt(q)-Pt(X))).sum(1)
    lab=identify(X,k);res[(X,(p,q))]=(lab,sorted(cs))
    stat['ω 已识别' if lab else 'ω 未识别']+=1
print(stat)
pickle.dump(res,open('identw.pkl','wb'))
for (X,pq),(lab,cs) in sorted(res.items(),key=lambda kv:-len(kv[1][1]))[:25]:print('X%d'%X,pq,len(cs),lab[:3])
