import numpy as np,pickle,collections,itertools
exec(open('reduce.py').read().split('out=[];stat')[0])
R=pickle.load(open('reduce.pkl','rb'))
basic=[1,2,3,4,5,6,8,10,20,40,7,9,11,13,14,15,16,32,39,55,56,65,69,76,99,100,101,110]
def collinear(ks):
    M=np.stack([Pt(k) for k in ks],1);u=M[:,1]-M[:,0]
    return all(np.max(np.abs(u[:,0]*(M[:,j]-M[:,0])[:,1]-u[:,1]*(M[:,j]-M[:,0])[:,0])/(np.linalg.norm(u,axis=1)*np.linalg.norm(M[:,j]-M[:,0],axis=1)+1e-300))<1e-8 for j in range(2,M.shape[1]))
stat=collections.Counter();openoff=[]
for o in R['out']:
    X=o['X']
    for (p,q),w in o['cls'].items():
        if w!='待查':
            stat['平凡或已记载' if not w.startswith('调和') else '调和（ETC 未写明）']+=1;continue
        bas=[b for b in basic if b not in (X,p,q) and collinear([X,p,b])]
        if len(bas)>=2:stat['在中心线上（一维计算）']+=1;o['cls'][(p,q)]='在中心线上（与 X%d、X%d 共线，一维计算）'%tuple(bas[:2])
        else:stat['真正待查（不在中心线上）']+=1;openoff.append((X,p,q,o['cnt']))
print(stat)
print('真正待查的点对数',len(openoff))
pickle.dump(dict(out=R['out'],openoff=openoff),open('reduce2.pkl','wb'))
# how many circles become fully explained? circle explained if both its pairs are non-open
