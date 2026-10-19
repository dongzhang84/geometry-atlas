import numpy as np,pickle,collections
A_=pickle.load(open('bigall.pkl','rb'));AK=A_['keys'];PA=A_['Pall'];AI={k:i for i,k in enumerate(AK)}
cl=pickle.load(open('closure.pkl','rb'));reg=cl['reg'];dec=cl['dec'];K=set(cl['K']);E=set(cl['E'])
C=pickle.load(open('sieve.pkl','rb'))['C']
basic=[1,2,3,4,5,6,8,10,20,40,7,9,11,13,14,15,16,32,39,55,56,65,69,76,99,100,101,110]
def col(a,b,c):
    U=PA[:,AI[b]]-PA[:,AI[a]];V=PA[:,AI[c]]-PA[:,AI[a]]
    return np.max(np.abs(U[:,0]*V[:,1]-U[:,1]*V[:,0])/(np.linalg.norm(U,axis=1)*np.linalg.norm(V,axis=1)+1e-300))<1e-8
memo={}
def oned(w,pr):
    X=reg[w][0];p,q=pr
    key=(X,p,q)
    if key not in memo:memo[key]=sum(1 for b in basic if b not in (X,p,q) and col(X,p,b))>=2
    return memo[key]
for ci,L in dec.items():
    for w,a,b in L:
        for pr in (a,b):
            if oned(w,pr):K.add((w,pr))
changed=True
while changed:
    changed=False
    for ci,L in dec.items():
        for w,a,b in L:
            ka,kb=(w,a) in K,(w,b) in K
            if ci in E:
                if ka and not kb:K.add((w,b));changed=True
                if kb and not ka:K.add((w,a));changed=True
            elif ka and kb:E.add(ci);changed=True
need=collections.defaultdict(set);nostruct=[]
for ci in range(len(C)):
    if ci in E:continue
    L=dec.get(ci,[])
    if not L:nostruct.append(ci);continue
    best=min(L,key=lambda x:((x[0],x[1]) not in K)+((x[0],x[2]) not in K))
    for pr in (best[1],best[2]):
        if (best[0],pr) not in K:need[(best[0],pr)].add(ci)
print('explained',len(E),'unexplained structured',len(C)-len(E)-len(nostruct),'no structure',len(nostruct),'open relations',len(need))
pickle.dump(dict(reg=reg,dec=dec,K=K,E=E,need=dict(need),nostruct=nostruct),open('closure2.pkl','wb'))
