import json,math,numpy as np,sympy as sp,sys
sys.path.insert(0,'../../probe3');from centers import centers
db={int(k):v for k,v in json.load(open('db_expr.json')).items()}
syms=sp.symbols('a b c A B C W D R r s S U V Y Z');a,b,c,A,B,C,W,D,R,r,s,S,U,V,Y,Z=syms
fns={}
for k,lst in db.items():
  fns[k]=[]
  for kind,ex in lst:
    e=sp.sympify(ex,locals={str(x):x for x in syms})
    e2=e.subs({a:b,b:c,c:a,A:B,B:C,C:A,U:V,V:Y,Y:U},simultaneous=True)
    e3=e2.subs({a:b,b:c,c:a,A:B,B:C,C:A,U:V,V:Y,Y:U},simultaneous=True)
    try:fns[k].append((kind,sp.lambdify(syms,[e,e2,e3],'math')))
    except Exception:pass
def tri_vals(Pa,Pb,Pc):
    a_=np.linalg.norm(Pb-Pc);b_=np.linalg.norm(Pc-Pa);c_=np.linalg.norm(Pa-Pb)
    A_=math.acos((b_*b_+c_*c_-a_*a_)/(2*b_*c_));B_=math.acos((c_*c_+a_*a_-b_*b_)/(2*c_*a_));C_=math.pi-A_-B_
    s_=(a_+b_+c_)/2;D_=math.sqrt(s_*(s_-a_)*(s_-b_)*(s_-c_));R_=a_*b_*c_/(4*D_);r_=D_/s_
    W_=math.atan(1/(1/math.tan(A_)+1/math.tan(B_)+1/math.tan(C_)))
    U_=(b_*b_+c_*c_-a_*a_)/2;V_=(c_*c_+a_*a_-b_*b_)/2;Y_=(a_*a_+b_*b_-c_*c_)/2;Z_=(a_*a_+b_*b_+c_*c_)/2
    return [a_,b_,c_,A_,B_,C_,W_,D_,R_,r_,s_,2*D_,U_,V_,Y_,Z_]
def evaluate(Pa,Pb,Pc):
    v=tri_vals(Pa,Pb,Pc);out={}
    for k,L in fns.items():
        res=[]
        for kind,f in L:
          try:
            w=np.array([complex(x) for x in f(*v)])
            if np.max(np.abs(w.imag))>1e-9*np.max(np.abs(w)):continue
            w=w.real
            if kind=='Trilinears':w=w*np.array(v[:3])
            if abs(w.sum())<1e-12*np.abs(w).max():continue
            w=w/w.sum();res.append(w[0]*Pa+w[1]*Pb+w[2]*Pc)
          except Exception:pass
        if not res:continue
        if len(res)>=2:
            agree=[p for p in res[1:] if np.linalg.norm(p-res[0])<1e-7*(1+np.linalg.norm(p))]
            if not agree:
                # try majority among others
                if len(res)>=3 and np.linalg.norm(res[1]-res[2])<1e-7*(1+np.linalg.norm(res[1])):res=[res[1]]
                else:continue
        out[k]=res[0]
    return out
if __name__=='__main__':
    rng=np.random.default_rng(1)
    for t in range(2):
        Pa,Pb,Pc=np.array([0.3,3.1]),np.array([-1.7,0.0]),np.array([4.1,0.2])
        if t:Pa,Pb,Pc=np.array([1.3,2.6]),np.array([-2.2,-0.4]),np.array([3.5,0.1])
        X=evaluate(Pa,Pb,Pc);ref=centers(Pa,Pb,Pc)
        bad=[k for k in ref if k in X and np.linalg.norm(X[k]-ref[k])>1e-6*(1+np.linalg.norm(ref[k]))]
        print('evaluated',len(X),'checked',sum(k in X for k in ref),'bad',bad)
