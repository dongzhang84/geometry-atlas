import pickle,json,re,sys,numpy as np,matplotlib
matplotlib.use('Agg');import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
D='/tmp/claude-0/-home-claude/6d1d8178-e201-53be-9783-71567739a6d5/scratchpad/'
fm.fontManager.addfont('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')
plt.rcParams['font.family']='Noto Sans CJK JP';plt.rcParams['axes.unicode_minus']=False
E_=D+'r4/etc/'
A=pickle.load(open(E_+'bigall.pkl','rb'));AK=A['keys'];PA=A['Pall'];AI={k:i for i,k in enumerate(AK)}
tris=pickle.load(open(E_+'big.pkl','rb'))['tris']
C=pickle.load(open(E_+'sieve.pkl','rb'))['C']
cl=pickle.load(open(E_+'closure2.pkl','rb'));dec=cl['dec'];reg=cl['reg']
r2=pickle.load(open(E_+'recheck2.pkl','rb'))
ents=json.load(open(E_+'ents.json'))
def name(n):
    e=ents.get(str(n));
    if not e:return ''
    t=e[0].split('=',1)[1].strip();t=t.title() if t.isupper() else t
    return t[:60]
def circ(ps):
    (x1,y1),(x2,y2),(x3,y3)=ps[:3]
    a=np.array([[x2-x1,y2-y1],[x3-x1,y3-y1]])*2;b=np.array([x2**2-x1**2+y2**2-y1**2,x3**2-x1**2+y3**2-y1**2])
    c=np.linalg.solve(a,b);return c,np.linalg.norm(ps[0]-c)
def draw(no):
    ci=no-1;pts=C[ci]
    st='有结构' if ci in r2['struct'] else ('没有结构' if ci in r2['nost'] else '已解释')
    best=None
    for t in range(len(tris)):
        T=np.array(tris[t]);P=np.array([PA[t,AI[k]] for k in pts]);c,r=circ(P)
        allp=np.vstack([T,P,c+r*np.array([[1,0],[-1,0],[0,1],[0,-1]])])
        sz=np.ptp(allp,0).max()/np.ptp(T,0).max()
        Q=np.vstack([P,T]);dmin=min(np.linalg.norm(Q[i]-Q[j]) for i in range(len(Q)) for j in range(i) if i<len(P) or j<len(P))/np.ptp(allp,0).max()
        sc=sz-8*min(dmin,0.08)-(0 if dmin>0.03 else -5)
        if best is None or sc<best[0]:best=(sc,t,T,P,c,r)
    _,t,T,P,c,r=best
    fig=plt.figure(figsize=(8,8));ax=fig.add_axes([0.04,0.21,0.92,0.71])
    O,R=circ(T);th=np.linspace(0,2*np.pi,400)
    ax.plot(O[0]+R*np.cos(th),O[1]+R*np.sin(th),color='#bbbbbb',lw=1,ls='--',label='外接圆')
    ax.fill(*T.T,fc='none',ec='black',lw=1.4)
    for lab,p,off in zip('ABC',T,[(0,8),(-12,-12),(8,-12)]):ax.annotate(lab,p,xytext=off,textcoords='offset points',fontsize=13,weight='bold')
    ax.plot(c[0]+r*np.cos(th),c[1]+r*np.sin(th),color='#7b3fbf',lw=2.2,label='这个共圆')
    note=''
    if st=='有结构' and dec.get(ci):
        w,a,b=dec[ci][0];X=reg[w][0];Xp=PA[t,AI[X]]
        for pr,col in ((a,'#e07b00'),(b,'#1f77b4')):
            q=np.array([PA[t,AI[k]] for k in pr]);ends=np.vstack([q,Xp])
            d=q[1]-q[0];u=d/np.linalg.norm(d);s=[(e-q[0])@u for e in ends]
            ax.plot(*np.array([q[0]+min(s)*u*1.05,q[0]+max(s)*u*1.05]).T,color=col,lw=1.2,ls='-.')
        ax.plot(*Xp,'s',color='#2a2a2a',ms=7);ax.annotate('X%d'%X,Xp,xytext=(7,-14),textcoords='offset points',fontsize=11)
        note='两条点划线交于 X%d：X%d、X%d 和 X%d、X%d 关于以 X%d 为圆心的同一个圆互为反演'%(X,a[0],a[1],b[0],b[1],X)
    for k,p in zip(pts,P):
        ax.plot(*p,'o',color='#d62728',ms=7,zorder=5);ax.annotate('X%d'%k,p,xytext=(7,6),textcoords='offset points',fontsize=12,color='#a01010',weight='bold')
    ax.set_aspect('equal',adjustable='datalim');ax.axis('off')
    allp=np.vstack([T,P,c+r*np.array([[1,0],[-1,0],[0,1],[0,-1]])]);lo=allp.min(0);hi=allp.max(0);m=0.08*(hi-lo).max()
    ax.set_xlim(lo[0]-m,hi[0]+m);ax.set_ylim(lo[1]-m,hi[1]+m)
    fig.text(0.5,0.955,'第 %d 号圆：%s'%(no,', '.join('X%d'%k for k in pts)),fontsize=15,ha='center',va='center')
    txt='\n'.join('X%d：%s'%(k,name(k)) for k in pts)
    if note:txt=note+'\n'+txt
    fig.text(0.05,0.185,txt,fontsize=10,va='top')
    out=D+'fig/r4c/r4c_%03d.png'%no;fig.savefig(out,dpi=250);plt.close(fig);return out
if __name__=='__main__':
    for n in sys.argv[1:]:print(draw(int(n)))
