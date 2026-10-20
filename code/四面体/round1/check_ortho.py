import sys;sys.path.insert(0,'.')
from tpts import *
rng=np.random.default_rng(1)
V=rand_ortho(rng)
print('opp edges perp',[(V[i]-V[j])@(V[k]-V[l]) for i,j,k,l in [(0,1,2,3),(0,2,1,3),(0,3,1,2)]])
P,S=points(V,True);print('H',P['H'])
