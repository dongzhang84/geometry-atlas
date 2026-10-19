import numpy as np,pickle,time
d=pickle.load(open('big.pkl','rb'));keys=d['keys'];P=d['P'];n=len(keys)
Z=P[...,0]+1j*P[...,1]
tol=1e-8
def groups_for(t):
    z=Z[t];found=set()
    for i in range(n-3):
        zi=z[i]
        J=np.arange(i+1,n)
        # theta[j,k] = arg((zi-zk)/(zj-zk)) mod pi
        num=(zi-z)[None,:];den=(z[J][:,None]-z[None,:])
        with np.errstate(all='ignore'):
            th=np.angle(num/den)%np.pi
        for r,j in enumerate(J):
            row=th[r,j+1:];ks=np.arange(j+1,n)
            ok=np.isfinite(row)&(row>1e-7)&(row<np.pi-1e-7)
            row=row[ok];ks=ks[ok]
            if len(row)<2:continue
            o=np.argsort(row);rs=row[o];ks=ks[o]
            dif=np.diff(rs)<tol
            if not dif.any():continue
            # runs
            s=0
            while s<len(dif):
                if dif[s]:
                    e=s
                    while e<len(dif) and dif[e]:e+=1
                    found.add(frozenset([i,j]+list(ks[s:e+1])))
                    s=e
                else:s+=1
    return found
t0=time.time()
G=groups_for(0)
print('triangle0 groups',len(G),'time',round(time.time()-t0))
pickle.dump(G,open('groups0.pkl','wb'))
