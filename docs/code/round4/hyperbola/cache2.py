from hyp import *
rng=np.random.default_rng(23);out=[]
while len(out)<150:
    T,S,sq=config(rng,'hyp')
    if min(sq)<0.17*max(sq):continue
    X=bary(tri_vals(*sq))
    P={k:(w@T).real for k,w in X.items() if w is not None and np.max(np.abs(w.imag))<1e-8}
    out.append((T,S,P))
pickle.dump(out,open('cfg16.pkl','wb'))
