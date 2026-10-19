# 把 623 个圆推广到「换尺子」后的同形二次曲线：S 正定 = 椭圆，S 不定 = 双曲线
import json,pickle,sys,numpy as np,sympy as sp,collections
E_='/tmp/claude-0/-home-claude/6d1d8178-e201-53be-9783-71567739a6d5/scratchpad/r4/etc/'
C=pickle.load(open(E_+'sieve.pkl','rb'))['C']
need=sorted(set(x for c in C for x in c))
db={int(k):v for k,v in json.load(open(E_+'db_expr.json')).items()}
syms=sp.symbols('a b c A B C W D R r s S U V Y Z');a,b,c,A,B,C_,W,D,R,r,s,S,U,V,Y,Z=syms
rot={a:b,b:c,c:a,A:B,B:C_,C_:A,U:V,V:Y,Y:U}
fns={}
for k in need:
    fns[k]=[]
    for kind,ex in db[k]:
        try:
            e=sp.sympify(ex,locals={str(x):x for x in syms});e2=e.subs(rot,simultaneous=True);e3=e2.subs(rot,simultaneous=True)
            fns[k].append((kind,sp.lambdify(syms,[e,e2,e3],'numpy')))
        except Exception:pass
def tri_vals(a2,b2,c2):
    a_,b_,c_=[np.complex128(np.sqrt(x+0j)) for x in (a2,b2,c2)]
    H=(2*a2*b2+2*b2*c2+2*c2*a2-a2*a2-b2*b2-c2*c2)/16   # Δ²
    D_=np.sqrt(np.complex128(H))
    cA=(b2+c2-a2)/(2*b_*c_);cB=(c2+a2-b2)/(2*c_*a_);cC=(a2+b2-c2)/(2*a_*b_)
    sA=2*D_/(b_*c_);sB=2*D_/(c_*a_);sC=2*D_/(a_*b_)
    ang=lambda co,si:-1j*np.log(co+1j*si)
    A_,B_,Cc=ang(cA,sA),ang(cB,sB),ang(cC,sC)
    s_=(a_+b_+c_)/2;R_=a_*b_*c_/(4*D_);r_=D_/s_
    W_=np.arctan(1/(cA/sA+cB/sB+cC/sC))
    return [a_,b_,c_,A_,B_,Cc,W_,D_,R_,r_,s_,2*D_,(b2+c2-a2)/2,(c2+a2-b2)/2,(a2+b2-c2)/2,(a2+b2+c2)/2]
def bary(v):
    out={}
    with np.errstate(all='ignore'):
     for k,L in fns.items():
        res=[]
        for kind,f in L:
            try:
                w=np.array([np.complex128(x) for x in f(*v)])
                if kind=='Trilinears':w=w*np.array(v[:3])
                if not np.all(np.isfinite(w)) or abs(w.sum())<1e-12*np.abs(w).max():continue
                res.append(w/w.sum())
            except Exception:pass
        if not res:continue
        if len(res)>=2:
            ag=[p for p in res[1:] if np.max(np.abs(p-res[0]))<1e-7*(1+np.max(np.abs(p)))]
            if not ag:
                if len(res)>=3 and np.max(np.abs(res[1]-res[2]))<1e-7*(1+np.max(np.abs(res[1]))):res=[res[1]]
                else:out[k]=None;continue
        out[k]=res[0]
    return out
def config(rng,kind):
    while True:
        T=rng.uniform(-3,3,(3,2))
        if abs((T[1]-T[0])[0]*(T[2]-T[0])[1]-(T[1]-T[0])[1]*(T[2]-T[0])[0])<2:continue
        th=rng.uniform(0,np.pi);Rm=np.array([[np.cos(th),-np.sin(th)],[np.sin(th),np.cos(th)]])
        k=rng.uniform(0.3,3)
        S=Rm.T@np.diag([1,-k if kind=='hyp' else k])@Rm
        if kind=='euc':S=np.eye(2)
        q=lambda u:u@S@u
        a2,b2,c2=q(T[1]-T[2]),q(T[2]-T[0]),q(T[0]-T[1])
        L=max(a2,b2,c2)
        if min(a2,b2,c2)<0.15*L:continue
        H=2*a2*b2+2*b2*c2+2*c2*a2-a2*a2-b2*b2-c2*c2
        if abs(H)<0.05*L*L:continue
        return T,S,(a2,b2,c2)
def onconic(P,S):
    M=np.array([[p@S@p,p[0],p[1],1] for p in P])
    M=M/np.linalg.norm(M,axis=0)
    sv=np.linalg.svd(M,compute_uv=False);return sv[-1]/sv[0] if len(P)>=4 else 0
if __name__=='__main__':
    kind=sys.argv[1];NC=int(sys.argv[2]);rng=np.random.default_rng(int(sys.argv[3]) if len(sys.argv)>3 else 7)
    res=collections.defaultdict(list)
    for t in range(NC):
        T,S,sq=config(rng,kind);X=bary(tri_vals(*sq))
        for ci,c in enumerate(C):
            ws=[X.get(k,'miss') for k in c]
            if any(isinstance(w,str) for w in ws):res[ci].append('缺');continue
            if any(w is None for w in ws):res[ci].append('歧义');continue
            imag=max(np.max(np.abs(w.imag)) for w in ws)>1e-8
            P=[w@T for w in ws]   # 复坐标（实点时虚部为 0）
            e=onconic(P,S)
            res[ci].append(('虚' if imag else '实')+('成立' if e<1e-8 else '不成立'))
        print(t,file=sys.stderr)
    pickle.dump(dict(res=dict(res)),open('/tmp/claude-0/-home-claude/6d1d8178-e201-53be-9783-71567739a6d5/scratchpad/r4/hyp/res_%s.pkl'%kind,'wb'))
    summ=collections.Counter(tuple(sorted(set(v))) for v in res.values())
    for k,v in summ.most_common():print(v,k)
