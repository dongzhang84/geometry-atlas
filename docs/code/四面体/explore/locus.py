import sys,itertools;sys.path.insert(0,'.')
import io,contextlib
with contextlib.redirect_stdout(io.StringIO()):
    from lift import *
def monos(deg):
    return [e for e in itertools.product(range(deg+1),repeat=3) if sum(e)<=deg]
for seed in (8,9):
    rng=np.random.default_rng(seed);V=rand_tetra(rng);basis=ortho_forms(V)
    Hs=[]
    for _ in range(400):
        Q=sym(rng.normal(size=3)@basis)
        if abs(np.linalg.det(Q))<1e-6:continue
        H,e=HQ(V,Q)
        if e<1e-9 and np.linalg.norm(H)<50:Hs.append(H)
    Hs=np.array(Hs)
    for deg in (1,2,3,4):
        E=monos(deg);M=np.array([[np.prod(h**np.array(e)) for e in E] for h in Hs])
        M=M/np.linalg.norm(M,axis=0)
        s=np.linalg.svd(M,compute_uv=False)
        print('四面体',seed,'度数',deg,'未知数',len(E),'最小奇异值比 %.1e'%(s[-1]/s[0]))
    # do vertices lie on it? check deg3 surface
    E=monos(3);M=np.array([[np.prod(h**np.array(e)) for e in E] for h in Hs]);sc=np.linalg.norm(M,axis=0)
    _,_,vt=np.linalg.svd(M/sc);c=vt[-1]/sc
    f=lambda p:np.array([np.prod(p**np.array(e)) for e in E])@c/np.linalg.norm(np.array([np.prod(p**np.array(e)) for e in E]))
    P,S=points(V)
    test={'顶点V0':V[0],'G':P['G'],'O':P['O'],'M(Monge)':P['M'],'I':P['I'],'棱中点m01':P['m01'],'面重心fG0':P['fG0']}
    print('  三次曲面上的点:',{k:('在' if abs(f(v))<1e-8 else '不在') for k,v in test.items()})
    edge=[f(V[0]+t*(V[1]-V[0])) for t in (0.13,0.71,1.9)]
    s_=np.linalg.svd(M/sc,compute_uv=False)
    print('  三次曲面零空间维数(奇异值<1e-12):',int((s_/s_[0]<1e-12).sum()),' 棱V0V1上的点:',['在' if abs(x)<1e-8 else '不在' for x in edge])
    # line through m01 and m23 (bimedian)?
    print('  双中线 m01-m23 上的点:',['在' if abs(f(P['m01']+t*(P['m23']-P['m01'])))<1e-8 else '不在' for t in (0.3,1.7)])
