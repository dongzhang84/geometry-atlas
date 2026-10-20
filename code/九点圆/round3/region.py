import numpy as np
A,B,C=np.array([0.3,3.0]),np.array([-3.0,0.0]),np.array([3.4,0.0])
def cond(U,V):return [U[0]*V[0],U[0]*V[1]+U[1]*V[0],U[1]*V[1]]
def bc(P,X,Y,Z):
    M=np.array([[X[0]-Z[0],Y[0]-Z[0]],[X[1]-Z[1],Y[1]-Z[1]]]);l=np.linalg.solve(M,P-Z);return np.array([l[0],l[1],1-l.sum()])
aA,aB,aC=B+C-A,C+A-B,A+B-C
from collections import Counter
cnt=Counter()
for x in np.linspace(-15,15,301):
  for y in np.linspace(-15,15,301):
    P=np.array([x,y]);l=bc(P,A,B,C)
    Mm=np.array([cond(B-C,A-P),cond(C-A,B-P)]);s=np.linalg.svd(Mm)[2][-1];S=np.array([[s[0],s[1]],[s[1],s[2]]])
    d=np.linalg.det(S);q=[(V-U)@S@(V-U) for U,V in ((B,C),(C,A),(A,B))]
    typ='ell' if d>0 else ('hreal' if len(set(np.sign(q)))==1 else 'himag')
    signs=''.join('+' if v>0 else '-' for v in l)
    la=bc(P,aA,aB,aC);inanti=la.min()>0
    cnt[(typ,signs,'anti_in' if inanti else 'anti_out')]+=1
for k,v in sorted(cnt.items()):print(k,v)
