import numpy as np,pickle,math,re
d=pickle.load(open('big.pkl','rb'));tris=d['tris'];NT=len(tris)
A_=pickle.load(open('bigall.pkl','rb'));AK=A_['keys'];PA=A_['Pall'];AI={k:i for i,k in enumerate(AK)}
R=pickle.load(open('recheck2.pkl','rb'));cl=pickle.load(open('closure2.pkl','rb'));reg=cl['reg']
Pt=lambda k:PA[:,AI[k]]
def close(u,v):return np.all(np.abs(u-v)<1e-7*(1+np.abs(v)))
exec('def circles'+open('identw.py').read().split('def circles')[1].split('CN=[circles')[0])
CN=[circles(t) for t in range(NT)]
cc=lambda nm:(np.array([CN[t][nm][0] for t in range(NT)]),np.array([CN[t][nm][1] for t in range(NT)]))
# omega list per relation
oms={}
for (w,pr) in R['need']:oms.setdefault(tuple(sorted(pr)),[]).append(reg[w])
for nm,pr,i in R['rel_d']:
    m=re.match(r'以X(\d+) X(\d+)为直径',nm)
    if m:
        u,v=int(m.group(1)),int(m.group(2));c0=(Pt(u)+Pt(v))/2;oms.setdefault(tuple(sorted(pr)),[]).append(('dia%d_%d'%(u,v),c0,((Pt(u)-c0)**2).sum(1)))
    else:
        c0,r2=cc(nm) if nm in CN[0] else (None,None)
        if c0 is not None:oms.setdefault(tuple(sorted(pr)),[]).append((nm,c0,r2))
def omega_params(o):
    if len(o)==2:X,k=o;return Pt(X),k
    return o[1],o[2]
def inverter(n1,n2):
    c1,r1=cc(n1);c2,r2=cc(n2);res=[]
    for s in (1,-1):
        lam=s*np.sqrt(r2/r1);S=(c2-lam[:,None]*c1)/(1-lam)[:,None];k=lam*(((S-c1)**2).sum(1)-r1);res.append((S,k))
    return res
etc=[((1,36),'I','外接圆'),((3,5),'I','垂心-重心圆'),((5,23),'INV','外接圆|九点圆'),((11,105),'INV','外接圆|九点圆'),((11,108),'I','polar圆'),((11,1837),'I','Fuhrmann圆'),
     ((15,16),'I','外接圆'),((15,16),'I','Brocard圆'),((25,403),'INV','外接圆|九点圆'),((36,354),'INV','外接圆|九点圆'),((36,354),'INV','外接圆|内切圆'),((65,2078),'INV','外接圆|内切圆'),
     ((98,125),'INV','外接圆|九点圆'),((99,126),'INV','外接圆|九点圆'),((946,1785),'I','内切圆'),
     ((1,36),'H',(3,56)),((1,40),'H',(56,3057)),((1,57),'H',(56,65)),((1,165),'H',(3,40)),((3,5),'H',(2,4)),((10,1999),'H',(37794,37795)),((21,377),'H',(3,20)),((65,2646),'H',(1,3)),((110,1614),'H',(3,156))]
confirmed=set()
for pr,typ,arg in etc:
    for o in oms.get(tuple(sorted(pr)),[]):
        c0,k=omega_params(o)
        ok=False
        if typ=='I':
            c,r2=cc(arg);ok=close(c0,c) and close(k,r2)
        elif typ=='INV':
            n1,n2=arg.split('|')
            ok=any(close(c0,S) and close(k,kk) for S,kk in inverter(n1,n2))
        else:
            u,v=arg
            if u in AI and v in AI:ok=close(((Pt(u)-c0)**2).sum(1),k) and close(((Pt(v)-c0)**2).sum(1),k)
        print(pr,typ,arg,'ω匹配' if ok else 'ω不同')
        if ok:confirmed.add(tuple(sorted(pr)))
print('confirmed',confirmed)
pickle.dump(confirmed,open('etc_confirmed.pkl','wb'))
