import sys,itertools,io,contextlib;sys.path.insert(0,'.')
with contextlib.redirect_stdout(io.StringIO()):
    from lift import *
for seed in (8,9,10):
    rng=np.random.default_rng(seed);V=rand_tetra(rng);basis=ortho_forms(V)
    rows=[]
    for _ in range(60):
        Q=sym(rng.normal(size=3)@basis);H,e=HQ(V,Q)
        if e>1e-9:continue
        x=np.linalg.solve(np.vstack([V.T,np.ones(4)]),np.append(H,1))   # barycentric
        rows.append(1/x)
    _,s,vt=np.linalg.svd(np.array(rows));c=vt[-1];c=c/c[0]
    print('四面体',seed,'Σ c_l/x_l=0 拟合残差 %.1e'%(s[-1]/s[0]),' c =',np.round(c,6))
    # compare with candidates: edge-based quantities
    e=lambda i,j:np.linalg.norm(V[i]-V[j])**2
    # candidate: c_l = sum of dot products? try c_l = (V_l - V_m).(V_l - V_n) etc. print some
    S=np.array([np.linalg.norm(np.cross(V[f[1]]-V[f[0]],V[f[2]]-V[f[0]]))/2 for f in FACES])
    print('   面积平方比',np.round(S**2/S[0]**2,6))
