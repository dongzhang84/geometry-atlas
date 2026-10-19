import numpy as np,pickle,collections
d=pickle.load(open('big.pkl','rb'));keys=d['keys'];P=d['P'];NT=P.shape[0];idx={k:i for i,k in enumerate(keys)}
A_=pickle.load(open('bigall.pkl','rb'));AK=A_['keys'];PA=A_['Pall']
S=pickle.load(open('sieve.pkl','rb'));C=S['C'];s3=pickle.load(open('sieve3.pkl','rb'))
cp={98,99,100,101,103,104,105,106,107,108,109,110,112,675}
def matchin(pts,tol=1e-7):
    dd=np.max(np.linalg.norm(PA-pts[:,None,:],axis=2)/(1+np.linalg.norm(pts,axis=1))[:,None],axis=0)
    j=np.argmin(dd);return AK[j] if dd[j]<tol else None
def circfit(p1,p2,p3):
    M=np.array([2*(p2-p1),2*(p3-p1)]);c=np.linalg.solve(M,[p2@p2-p1@p1,p3@p3-p1@p1]);return c,(p1-c)@(p1-c)
O=P[:,idx[3]];R2=np.array([((d['tris'][t][0]-O[t])**2).sum() for t in range(NT)])
feat=collections.Counter();rows=[]
for f in s3['un']:
    c=C[f[0]]
    zs=[k for k in c if k in cp]
    if not zs:continue
    z=zs[0];Zp=P[:,idx[z]]
    others=[k for k in c if k!=z]
    W=[];cen=[]
    for t in range(NT):
        c0,r2=circfit(*[P[t,idx[k]] for k in others[:3]])
        # radical axis with circumcircle: 2x.(O-c0) = |O|^2-R2-|c0|^2+r2 ; second intersection = reflection of Z over line O c0
        u=(c0-O[t]);u=u/np.linalg.norm(u);v=Zp[t]-O[t];W.append(O[t]+2*(v@u)*u-v);cen.append(c0)
    W=np.array(W);cen=np.array(cen)
    w=matchin(W);ce=matchin(cen)
    rows.append((c,z,w,ce))
    feat['second pt named' if w else 'second pt unnamed']+=1
    feat['center named' if ce else 'center unnamed']+=1
    feat['contains X3' if 3 in c else 'no X3']+=1
    feat['contains X1' if 1 in c else 'no X1']+=1
print(feat)
pickle.dump(rows,open('feat.pkl','wb'))
for r in rows[:25]:print(r)
