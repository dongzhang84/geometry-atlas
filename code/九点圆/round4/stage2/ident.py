from sym import *
import sys
circles=[(2,6,37,100),(2,6,42,101),(2,32,39,110),(3,4,69,99),(3,9,40,101),(6,11,37,55),(6,39,76,99),(7,8,21,99),(8,55,65,100),(9,55,57,101),(21,35,36,110),(21,55,56,110),(31,38,75,99)]
circum={99,100,101,110}
out={}
for C in circles:
    base=[k for k in C if k not in circum][:3]
    if len(base)<3: base=list(C[:3])
    uvw=circle([P[k] for k in base])
    rad=cleanline(uvw)   # radical axis with circumcircle: u x+v y+w z=0
    print('{'+','.join('X%d'%k for k in C)+'}');print('   radical axis coeffs (A-part):',rad[0]);sys.stdout.flush()
    out[C]=rad
import pickle;pickle.dump(out,open('rad.pkl','wb'))
