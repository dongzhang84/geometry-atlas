from hyp import *
rng=np.random.default_rng(7);T,S,sq=config(rng,'hyp');X=bary(tri_vals(*sq))
for q in ([566,2080,39,573],[412,1368,458,376],[140,29,26,1368]):
    P=[X[k].real@T for k in q];M=np.array([[p[0],p[1],1] for p in P]);M=M/np.linalg.norm(M,axis=0)
    sv=np.linalg.svd(M,compute_uv=False);print(q,'共线' if sv[-1]/sv[0]<1e-8 else '不共线')
