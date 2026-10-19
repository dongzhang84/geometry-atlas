from hyp import *
rng=np.random.default_rng(7)
T,S,sq=config(rng,'hyp');X=bary(tri_vals(*sq))
cplx=sorted(k for k in need if X.get(k) is not None and np.max(np.abs(X[k].imag))>1e-8)
print('虚点',len(cplx),cplx)
# 负对照：随机 4 点
import random;random.seed(1);bad=0
for _ in range(2000):
    q=random.sample([k for k in need if k not in cplx],4)
    if onconic([X[k].real@T for k in q],S)<1e-8:bad+=1
print('随机四点误判为共曲线',bad,'/2000')
# 哪些圆含虚点
r=pickle.load(open('res_hyp.pkl','rb'))['res']
V=[ci for ci,v in r.items() if v[0].startswith('虚')]
print(len(V));print([ (ci+1,[k for k in C[ci] if k in cplx]) for ci in V])
random.seed(1);Cs=[set(c) for c in C]
for _ in range(2000):
    q=random.sample([k for k in need if k not in cplx],4)
    if onconic([X[k].real@T for k in q],S)<1e-8:print(q,any(set(q)<=c for c in Cs))
