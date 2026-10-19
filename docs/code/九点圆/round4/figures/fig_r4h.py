import pickle,json,sys,numpy as np,matplotlib
matplotlib.use('Agg');import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
D='/tmp/claude-0/-home-claude/6d1d8178-e201-53be-9783-71567739a6d5/scratchpad/'
fm.fontManager.addfont('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')
plt.rcParams['font.family']='Noto Sans CJK JP';plt.rcParams['axes.unicode_minus']=False
E_=D+'r4/etc/'
C=pickle.load(open(E_+'sieve.pkl','rb'))['C']
cl=pickle.load(open(E_+'closure2.pkl','rb'));dec=cl['dec'];reg=cl['reg']
cfg=pickle.load(open(D+'r4/hyp/cfg16.pkl','rb'))
ents=json.load(open(E_+'ents.json'))
def name(n):
    e=ents.get(str(n))
    if not e:return ''
    t=e[0].split('=',1)[1].strip();t=t.title() if t.isupper() else t
    return t[:60]
def fit(P,S):
    M=np.array([[p@S@p,p[0],p[1],1] for p in P]);return np.linalg.svd(M)[2][-1]
def f(co,S,x,y):return co[0]*(S[0,0]*x*x+2*S[0,1]*x*y+S[1,1]*y*y)+co[1]*x+co[2]*y+co[3]
def draw(no):
    ci=no-1;pts=C[ci];best=None
    for t,(T,S,PX) in enumerate(cfg):
        if any(k not in PX for k in pts):continue
        P=np.array([PX[k] for k in pts]);allp=np.vstack([T,P])
        span=np.ptp(allp,0).max();sz=span/np.ptp(T,0).max()
        Q=np.vstack([P,T]);n=len(P)
        dmin=min(np.linalg.norm(Q[i]-Q[j]) for i in range(len(Q)) for j in range(i) if i<n)/span
        e=[np.linalg.norm(T[i]-T[j]) for i,j in ((1,2),(2,0),(0,1))];ar=abs((T[1]-T[0])[0]*(T[2]-T[0])[1]-(T[1]-T[0])[1]*(T[2]-T[0])[0])
        fat=ar/max(e)**2
        sv=np.linalg.svd(P-P.mean(0),compute_uv=False);flat=sv[1]/sv[0]
        co=fit(P,S);cen=-np.linalg.solve(S,co[1:3])/(2*co[0]);r2=cen@S@cen-co[3]/co[0];deg=abs(r2)/span**2
        sc=sz-25*min(dmin,0.07)-6*min(fat,0.35)-12*min(flat,0.4)-10*min(deg,0.05)/0.05
        sc-=40*min(flat,0.2)
        if dmin<0.02 or deg<0.01:sc+=100
        if best is None or sc<best[0]:best=(sc,T,S,P,PX)
    _,T,S,P,PX=best
    allp=np.vstack([T,P]);lo=allp.min(0);hi=allp.max(0);span=(hi-lo).max();ctr=(lo+hi)/2
    half=0.62*span;x0,x1,y0,y1=ctr[0]-half,ctr[0]+half,ctr[1]-half,ctr[1]+half
    fig=plt.figure(figsize=(8,8));ax=fig.add_axes([0.04,0.21,0.92,0.71])
    xs=np.linspace(x0,x1,900);ys=np.linspace(y0,y1,900);XX,YY=np.meshgrid(xs,ys)
    cc=fit(T,S) if False else None
    # S-外接曲线（过 A、B、C 的同形双曲线）：用 A、B、C 与圆心条件，取 x^T S x + l·x + m 过三点
    M=np.array([[t[0],t[1],1] for t in T]);rhs=-np.array([t@S@t for t in T]);l=np.linalg.solve(M,rhs)
    ax.contour(XX,YY,S[0,0]*XX**2+2*S[0,1]*XX*YY+S[1,1]*YY**2+l[0]*XX+l[1]*YY+l[2],[0],colors='#bbbbbb',linewidths=1,linestyles='--')
    co=fit(P,S)
    ax.contour(XX,YY,f(co,S,XX,YY),[0],colors='#7b3fbf',linewidths=2.2)
    ax.fill(*T.T,fc='none',ec='black',lw=1.4)
    for lab,p,off in zip('ABC',T,[(0,8),(-12,-12),(8,-12)]):ax.annotate(lab,p,xytext=off,textcoords='offset points',fontsize=13,weight='bold')
    note=''
    if dec.get(ci):
        w,a,b=dec[ci][0];X=reg[w][0]
        if X in PX:
            Xp=PX[X]
            q1=np.array([PX[k] for k in a]);q2=np.array([PX[k] for k in b])
            cr=lambda u,v:u[0]*v[1]-u[1]*v[0]
            if abs(cr(q1[1]-q1[0],Xp-q1[0]))<1e-7*span**2 and abs(cr(q2[1]-q2[0],Xp-q2[0]))<1e-7*span**2:
                for q,col in ((q1,'#e07b00'),(q2,'#1f77b4')):
                    ends=np.vstack([q,Xp]);u=(q[1]-q[0])/np.linalg.norm(q[1]-q[0]);s=[(e-q[0])@u for e in ends]
                    ax.plot(*np.array([q[0]+min(s)*u*1.05,q[0]+max(s)*u*1.05]).T,color=col,lw=1.2,ls='-.')
                ax.plot(*Xp,'s',color='#2a2a2a',ms=7);ax.annotate('X%d'%X,Xp,xytext=(7,-14),textcoords='offset points',fontsize=11)
                note='两条点划线交于 X%d'%X
    for k,p in zip(pts,P):
        ax.plot(*p,'o',color='#d62728',ms=6 if len(pts)>8 else 7,zorder=5);ax.annotate('X%d'%k,p,xytext=(7,6),textcoords='offset points',fontsize=11 if len(pts)>8 else 12,color='#a01010',weight='bold')
    ax.set_xlim(x0,x1);ax.set_ylim(y0,y1);ax.set_aspect('equal');ax.axis('off')
    # 局部放大：点挤在一起时
    Q=list(zip(pts,P));close=set()
    for i in range(len(Q)):
        for j in range(i):
            if np.linalg.norm(Q[i][1]-Q[j][1])<0.1*span:close|={i,j}
    if close:
        cp=np.array([P[i] for i in close]);c0=cp.mean(0);h=max(np.ptp(cp,0).max()*0.7,0.025*span)
        # 选离数据最远的角落放小图
        corners={'ul':[0.02,0.62],'ur':[0.62,0.62],'ll':[0.02,0.02],'lr':[0.62,0.02]}
        def crowd(k):
            fx,fy=corners[k];cx=x0+(fx+0.18)*(x1-x0);cy=y0+(fy+0.18)*(y1-y0)
            return np.min(np.linalg.norm(np.vstack([T,P])-[cx,cy],axis=1))
        k=max(corners,key=crowd);fx,fy=corners[k]
        ia=ax.inset_axes([fx,fy,0.36,0.36])
        xs2=np.linspace(c0[0]-h,c0[0]+h,500);ys2=np.linspace(c0[1]-h,c0[1]+h,500);X2,Y2=np.meshgrid(xs2,ys2)
        ia.contour(X2,Y2,f(co,S,X2,Y2),[0],colors='#7b3fbf',linewidths=1.8)
        ia.fill(*T.T,fc='none',ec='black',lw=1.0)
        for lab,p in zip('ABC',T):
            if np.max(np.abs(p-c0))<h:ia.annotate(lab,p,xytext=(-12,-12),textcoords='offset points',fontsize=10,weight='bold')
        for i in range(len(P)):
            if np.max(np.abs(P[i]-c0))>h:continue
            ia.plot(*P[i],'o',color='#d62728',ms=6,zorder=5);ia.annotate('X%d'%pts[i],P[i],xytext=(6,5),textcoords='offset points',fontsize=10,color='#a01010',weight='bold')
        if note:
            Xn=int(note.split('X')[-1]);Xq=PX[Xn]
            if np.max(np.abs(Xq-c0))<h:ia.plot(*Xq,'s',color='#2a2a2a',ms=6);ia.annotate('X%d'%Xn,Xq,xytext=(6,-12),textcoords='offset points',fontsize=9)
        ia.set_xlim(c0[0]-h,c0[0]+h);ia.set_ylim(c0[1]-h,c0[1]+h);ia.set_aspect('equal');ia.set_xticks([]);ia.set_yticks([])
        for sp_ in ia.spines.values():sp_.set_color('#888888')
        ia.set_title('局部放大',fontsize=9)
        ax.indicate_inset_zoom(ia,edgecolor='#888888')

    fig.text(0.5,0.955,'第 %d 号（双曲线）：%s'%(no,', '.join('X%d'%k for k in pts)),fontsize=15 if len(pts)<9 else 12,ha='center',va='center')
    head='紫线：换成双曲线尺子后的「圆」；灰色虚线：过 A、B、C 的「外接圆」'
    txt='\n'.join([head]+([note] if note else [])+['X%d：%s'%(k,name(k)) for k in pts])
    fig.text(0.05,0.185,txt,fontsize=10 if len(pts)<9 else 8,va='top')
    out=D+'fig/r4h/r4h_%03d.png'%no;fig.savefig(out,dpi=250);plt.close(fig);return out
if __name__=='__main__':
    for n in sys.argv[1:]:print(draw(int(n)))
