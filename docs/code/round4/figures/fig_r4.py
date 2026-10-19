import sys;sys.path.insert(0,'../probe3')
from centers import centers
from common import INK,MUTED,PUR,GRN,ORG,BLU,RED,GOLD,pt,lab,H_,Line2D,plt,np
def circ3(P,Q,R):
    M=np.array([2*(Q-P),2*(R-P)]);c=np.linalg.solve(M,[Q@Q-P@P,R@R-P@P]);return c,np.linalg.norm(P-c)
# ---------- Fig A: two inverse pairs
A,B,C=np.array([2.5,1.5]),np.array([0.0,0.0]),np.array([6.0,0.0])
X=centers(A,B,C)
fig,ax=plt.subplots(figsize=(10,8.6));fig.patch.set_facecolor('white')
c0,r0=circ3(X[2],X[6],X[37]);M=(X[1]+X[9])/2;rw=np.linalg.norm(X[1]-M)
th=np.linspace(0,2*np.pi,400)
cA=np.linspace(0,1,2)
tri=np.array([A,B,C,A]);ax.plot(*tri.T,color=INK,lw=2,zorder=3)
ax.plot(*(c0[:,None]+r0*np.array([np.cos(th),np.sin(th)])),color=PUR,lw=2.6,zorder=2)
ax.plot(*(M[:,None]+rw*np.array([np.cos(th),np.sin(th)])),color=GRN,lw=1.8,ls=(0,(6,3)),zorder=2)
# lines through M
for p,q,col in ((6,37,ORG),(2,100,BLU)):
    d=(X[q]-X[p]);d/=np.linalg.norm(d);ax.plot(*np.array([M-d*6,M+d*6]).T,color=col,lw=1.1,alpha=0.8,zorder=1)
ax.plot(*np.array([X[1],X[9]]).T,color=GRN,lw=1.2,zorder=2)
pt(ax,M,GRN,7);lab(ax,M,'X1001',GRN,(-0.1,-0.06),11)
offs={1:(-0.08,0.06),9:(0.08,-0.05),2:(0.1,0.01),100:(0.1,-0.04),6:(-0.08,0.05),37:(0.08,0.05)}
cols={1:GRN,9:GRN,2:BLU,100:BLU,6:ORG,37:ORG}
for k,o in offs.items():pt(ax,X[k],cols[k],9,7);lab(ax,X[k],'X%d'%k,cols[k],o,13)
items=[(H_(PUR,2.6),'待解释的圆：X2、X6、X37、X100 四点共圆'),
       (H_(GRN,1.8,ls=(0,(6,3))),'参考圆 ω：以 X1X9 为直径（圆心 X1001）；在外心三角形里，它是「垂心-类似重心圆」'),
       (H_(ORG,1.1),'第一对：X6、X37 关于 ω 互为反演（与 ω 的圆心共线，且关于 X1、X9 调和）'),
       (H_(BLU,1.1),'第二对：X2、X100 关于 ω 互为反演（ETC 记载的「X51、X125 关于垂心-类似重心圆互为反演」在外心三角形里的翻版）'),
       (Line2D([],[],color=INK,ls='none'),'两对点关于同一个圆互为反演 ⇒ 四点共圆，而且这个圆与 ω 正交')]
ax.legend([h for h,_ in items],[t for _,t in items],loc='upper left',bbox_to_anchor=(0,0.02),frameon=False,fontsize=11.5,handlelength=2.6)
allp=np.array([X[k] for k in offs]+[c0+r0,c0-r0,M+rw,M-rw]);lo=allp.min(0)-0.35;hi=allp.max(0)+0.35
ax.set_xlim(lo[0],hi[0]);ax.set_ylim(lo[1],hi[1]);ax.set_aspect('equal');ax.axis('off')
for t in ax.texts:t.set_clip_on(True)
ax.text(0.01,0.99,'黑线：三角形 ABC 的边（拐角处是 A，B、C 在画面外）',transform=ax.transAxes,fontsize=11,va='top',color=INK)
fig.savefig('r4_inverse_pairs.png',dpi=170,bbox_inches='tight',facecolor='white')
# ---------- Fig B: excentral transfer
A,B,C=np.array([-0.5,1.5]),np.array([0.0,0.0]),np.array([5.0,0.0])
X=centers(A,B,C);a=np.linalg.norm(B-C);b=np.linalg.norm(C-A);c=np.linalg.norm(A-B)
Ia=(-a*A+b*B+c*C)/(-a+b+c);Ib=(a*A-b*B+c*C)/(a-b+c);Ic=(a*A+b*B-c*C)/(a+b-c)
fig,ax=plt.subplots(figsize=(10,10));fig.patch.set_facecolor('white')
ax.plot(*np.array([Ia,Ib,Ic,Ia]).T,color=MUTED,lw=1.8,zorder=1)
ax.plot(*np.array([A,B,C,A]).T,color=INK,lw=2,zorder=3)
c1,r1=circ3(X[3],X[9],X[40])
ax.plot(*(c1[:,None]+r1*np.array([np.cos(th),np.sin(th)])),color=PUR,lw=2.6,zorder=2)
ax.add_patch(plt.Circle(X[3],np.linalg.norm(A-X[3]),fill=False,color=BLU,lw=1.2,ls=(0,(4,3)),zorder=1))
labs={3:'X3 = 外心三角形的 X5（九点圆心）',9:'X9 = 外心三角形的 X6（类似重心）',40:'X40 = 外心三角形的 X3（外心）',101:'X101 = 外心三角形的 X115'}
offs={3:(0.15,-0.32),9:(0.0,0.3),40:(0.3,0.25),101:(0.0,0.3)}
for k,t in labs.items():pt(ax,X[k],PUR,9,7);lab(ax,X[k],'X%d'%k,PUR,offs[k],13)
pt(ax,X[1],GRN,8,7);lab(ax,X[1],'X1',GRN,(-0.25,-0.2),12)
for V,n,o in zip((A,B,C),'ABC',((0,0.3),(-0.3,-0.2),(0.3,-0.2))):pt(ax,V,INK,5);lab(ax,V,n,INK,o,14)
for V,n,o in zip((Ia,Ib,Ic),('Ia','Ib','Ic'),((0,-0.35),(0.35,0.2),(-0.35,0.2))):pt(ax,V,MUTED,6);lab(ax,V,n,MUTED,o,14)
items=[(H_(INK,2),'三角形 ABC'),(H_(MUTED,1.8),'外心三角形 IaIbIc（三个旁心）；ABC 的内心 X1 是它的垂心'),
       (H_(BLU,1.2,ls=(0,(4,3))),'ABC 的外接圆 = 外心三角形的九点圆'),
       (H_(PUR,2.6),'圆 {X3, X9, X40, X101}：就是已知圆 {X3, X5, X6, X115} 在外心三角形里的翻版')]+[(Line2D([],[],color=PUR,marker='o',ls='none',ms=7,mec='white'),t) for t in labs.values()]
ax.legend([h for h,_ in items],[t for _,t in items],loc='upper left',bbox_to_anchor=(0,0.02),frameon=False,fontsize=11.5,handlelength=2.6)
allp=np.array([Ia,Ib,Ic,c1+r1,c1-r1]);lo=allp.min(0)-0.5;hi=allp.max(0)+0.5
ax.set_xlim(lo[0],hi[0]);ax.set_ylim(lo[1],hi[1]);ax.set_aspect('equal');ax.axis('off')
fig.savefig('r4_excentral.png',dpi=170,bbox_inches='tight',facecolor='white')
print('ok')
