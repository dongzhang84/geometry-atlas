import sys;sys.path.insert(0,'.')
from centers import *
A,B,C=np.array([-2.,1.2]),np.array([2.2,1.4]),np.array([-0.7,-1.6])
X=centers(A,B,C);O=X[3];R=np.linalg.norm(A-O);N=X[5]
a=np.linalg.norm(B-C);b=np.linalg.norm(C-A);c=np.linalg.norm(A-B);s=(a+b+c)/2
r=abs(cr(B-A,C-A))/2/s
def col(p,q,t):return cr(q-p,t-p)
print('X5 mid OH',np.linalg.norm(X[5]-(X[3]+X[4])/2))
print('H is orthocenter',(X[4]-A)@(B-C),(X[4]-B)@(C-A))
print('X11 on incircle',np.linalg.norm(X[11]-X[1])-r,' on NPC',np.linalg.norm(X[11]-N)-R/2)
print('X12 on line 1-5',col(X[1],X[5],X[12]))
def foot(P,U,V):d=V-U;return U+d*((P-U)@d)/(d@d)
T=[foot(X[1],B,C),foot(X[1],C,A),foot(X[1],A,B)]
H2=lambda P,Q,S: np.linalg.solve(np.array([S-Q,S-P]),[ (S-Q)@P,(S-P)@Q])
print('X65 orthocenter intouch',np.linalg.norm(H2(*T)-X[65]))
import math
ang=lambda P,Q,S:math.degrees(math.acos((Q-P)@(S-P)/np.linalg.norm(Q-P)/np.linalg.norm(S-P)))
print('X13 Fermat angles',ang(X[13],A,B),ang(X[13],B,C))
for k in (21,22,23,140,376,381):print('X%d Euler'%k,col(X[3],X[4],X[k]))
for k in (99,100,101,110):print('X%d circum'%k,np.linalg.norm(X[k]-O)-R)
print('X36 on OI',col(X[1],X[3],X[36]),'X35',col(X[1],X[3],X[35]))
# isodynamic: pedal triangle of X15 equilateral
P=[foot(X[15],B,C),foot(X[15],C,A),foot(X[15],A,B)]
print('X15 pedal sides',[np.linalg.norm(P[i]-P[(i+1)%3]) for i in range(3)])
P=[foot(X[16],B,C),foot(X[16],C,A),foot(X[16],A,B)]
print('X16 pedal sides',[np.linalg.norm(P[i]-P[(i+1)%3]) for i in range(3)])
print('X17,X18 on line X13? napoleon: X17 on line X5-X13?',col(X[5],X[13],X[17]) if False else '')
