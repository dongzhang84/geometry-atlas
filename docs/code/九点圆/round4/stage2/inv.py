import numpy as np,sys,itertools
sys.path.insert(0,'../probe3');from centers import centers
data={(2,6,37,100):[(1,9)],(2,32,39,110):[(3,6)],(3,4,69,99):[(2,20),(76,376)],(6,11,37,55):[(1,9),(31,42)],(7,8,21,99):[(69,75)],(8,55,65,100):[(1,40)],(9,55,57,101):[(2,63)],(21,35,36,110):[(1,3)],(21,55,56,110):[(1,3)],(31,38,75,99):[(1,63)]}
rng=np.random.default_rng(3);tris=[]
while len(tris)<8:
    A,B,C=[rng.uniform(-3,3,2) for _ in range(3)];u=B-A;v=C-A
    if abs(u[0]*v[1]-u[1]*v[0])<5:continue
    tris.append((A,B,C))
Xs=[centers(*t) for t in tris]
def inverse(X,P,i,j):
    c=(X[i]+X[j])/2;r2=(X[i]-c)@(X[i]-c);d=X[P]-c;return c+d*r2/(d@d)
for Cn,gs in data.items():
    for (i,j) in gs:
        res=[]
        for p,q in itertools.combinations(Cn,2):
            if all(np.linalg.norm(inverse(X,p,i,j)-X[q])<1e-7*(1+np.linalg.norm(X[q])) for X in Xs):res.append((p,q))
        print(Cn,'圆 X%dX%d 为直径:'%(i,j),'圆内的反演对',res)
