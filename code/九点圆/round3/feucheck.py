import numpy as np,sys,io,contextlib
from feu_core import setup,tangent_check
from geo import metric
rng=np.random.default_rng(9);res={'ell':[], 'hyp':[]}
while min(len(v) for v in res.values())<30:
    A=rng.uniform([-1,1.5],[1,4]);B=rng.uniform([-4,-1],[-2,0.5]);C=rng.uniform([2,-1],[4,0.5])
    P=rng.uniform(-25,25,2) if rng.random()<0.7 else (lambda w:w[0]*A+w[1]*B+w[2]*C)(rng.dirichlet([2,2,2]))
    S=metric(A,B,C,P)
    if S is None:continue
    k='ell' if np.linalg.det(S)>0 else 'hyp'
    with contextlib.redirect_stdout(io.StringIO()):d=setup(A,B,C,P)
    if len(d['circles'])<4:continue
    res[k].append(max(abs(tangent_check(d['S'],d['N'],d['rhoN'],c,r)) for c,r in d['circles']))
for k,v in res.items():print(k,len(v),'max tangency residual',max(v[:30]))
