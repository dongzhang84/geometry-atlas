import numpy as np,pickle,itertools
T,P=pickle.load(open('trustedP.pkl','rb'))
idx={k:i for i,k in enumerate(T)}
tests={(3,9,40,101):[(1,165)],(9,55,57,101):[(1,165),(2,63)],(2,6,42,101):[(395,396)],(7,8,21,99):[(69,75),(55,958),(65,388),(333,1043)],(6,39,76,99):[(3,83),(2,194),(3,1975)],(2,6,37,100):[(1,9),(55,1376),(395,396),(1449,1743)]}
def inverse(t,p,i,j):
    c=(P[t][idx[i]]+P[t][idx[j]])/2;r2=(P[t][idx[i]]-c)@(P[t][idx[i]]-c);d=P[t][idx[p]]-c;return c+d*r2/(d@d)
for Cn,gs in tests.items():
    for i,j in gs:
        res=[(p,q) for p,q in itertools.combinations(Cn,2) if all(np.linalg.norm(inverse(t,p,i,j)-P[t][idx[q]])<1e-7*(1+np.linalg.norm(P[t][idx[q]])) for t in range(3))]
        print(Cn,'直径 X%dX%d'%(i,j),'反演对',res)
