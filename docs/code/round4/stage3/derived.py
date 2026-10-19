import numpy as np,pickle
from evaldb import evaluate
T,P=pickle.load(open('trustedP.pkl','rb'));trusted=set(T)
tris=[(np.array([0.3,3.1]),np.array([-1.7,0.0]),np.array([4.1,0.2])),(np.array([1.3,2.6]),np.array([-2.2,-0.4]),np.array([3.5,0.1]))]
def derived(A,B,C,X):
    a=np.linalg.norm(B-C);b=np.linalg.norm(C-A);c=np.linalg.norm(A-B);s=(a+b+c)/2
    along=lambda P_,Q_,d:P_+(Q_-P_)*d/np.linalg.norm(Q_-P_)
    Ia=(-a*A+b*B+c*C)/(-a+b+c);Ib=(a*A-b*B+c*C)/(a-b+c);Ic=(a*A+b*B-c*C)/(a+b-c)
    def foot(P_,U,V):d=V-U;return U+d*((P_-U)@d)/(d@d)
    O=X[3];
    # tangential triangle: intersection of tangents at vertices
    def tang(U,V,W):
        # tangent at V and W intersect
        nV=V-O;nW=W-O;M=np.array([nV,nW]);return np.linalg.solve(M,[nV@V,nW@W])
    return {'excentral':(Ia,Ib,Ic),'medial':((B+C)/2,(C+A)/2,(A+B)/2),'anticompl':(B+C-A,C+A-B,A+B-C),
            'intouch':(along(B,C,s-b),along(C,A,s-c),along(A,B,s-a)),'orthic':(foot(A,B,C),foot(B,C,A),foot(C,A,B)),
            'tangential':(tang(None,B,C),tang(None,C,A),tang(None,A,B))}
base=[evaluate(*t) for t in tris]
der=[{k:evaluate(*v) for k,v in derived(*t,X).items()} for t,X in zip(tris,base)]
circles=[(2,6,37,100),(2,6,42,101),(2,32,39,110),(3,4,69,99),(3,9,40,101),(6,11,37,55),(6,39,76,99),(7,8,21,99),(8,55,65,100),(9,55,57,101),(21,35,36,110),(21,55,56,110),(31,38,75,99)]
def label(k,name):
    pool=set(der[0][name])&set(der[1][name])
    out=[]
    for n in pool:
        if all(n in d[name] and np.linalg.norm(d[name][n]-X[k])<1e-7*(1+np.linalg.norm(X[k])) for d,X in zip(der,base)):out.append(n)
    return out
res={}
for Cn in circles:
    print('{'+','.join('X%d'%k for k in Cn)+'}')
    for name in ['excentral','medial','anticompl','intouch','orthic','tangential']:
        labs=[label(k,name) for k in Cn]
        if all(labs):print(f'   作为 {name} 三角形的点:',labs)
        elif sum(bool(x) for x in labs)>=3:print(f'   ({name} 部分:',labs,')')
