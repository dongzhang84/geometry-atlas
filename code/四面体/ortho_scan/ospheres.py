# 垂心四面体：五点以上共球的扫描（1167 个点）
# 用法：python3 ospheres.py [点数上限，默认全部]
# 第 1 步（numba 并行）：在四面体 0 上，对每个三元组 i<j<k，算其余点 p>k 所在的「过 i,j,k 的球」的参数，
#        参数相同的 ≥2 个点给出 ≥5 点共球；只保留 i,j,k 恰是球上最小三个编号的那一次（每个球只记一次）。
# 第 2 步：在另外 5 个四面体上复核，并补全球上的全部点。
# 第 3 步：分类（圆 + 一点、已知球、三对反演点……），按顶点对称合并，输出结果。
import sys,time,pickle,collections,itertools,numpy as np
from numba import njit,prange
exec(open('opoints.py').read())
NMAX=int(sys.argv[1]) if len(sys.argv)>1 else N
X0=np.ascontiguousarray(P[0][:NMAX]);sc0=scale[0]
@njit(cache=True)
def stage1_i(X,i,sc,tol,cap):
    n=X.shape[0];buf=np.empty((cap,4));m=0
    for j in range(i+1,n):
        for k in range(j+1,n):
            A=X[i];B=X[j];C=X[k]
            ab=B-A;ac=C-A
            nx=ab[1]*ac[2]-ab[2]*ac[1];ny=ab[2]*ac[0]-ab[0]*ac[2];nz=ab[0]*ac[1]-ab[1]*ac[0]
            nn=nx*nx+ny*ny+nz*nz
            la=ab[0]*ab[0]+ab[1]*ab[1]+ab[2]*ab[2];lc=ac[0]*ac[0]+ac[1]*ac[1]+ac[2]*ac[2]
            if nn<1e-12*la*lc:continue
            t1x=ny*ab[2]-nz*ab[1];t1y=nz*ab[0]-nx*ab[2];t1z=nx*ab[1]-ny*ab[0]
            t2x=ac[1]*nz-ac[2]*ny;t2y=ac[2]*nx-ac[0]*nz;t2z=ac[0]*ny-ac[1]*nx
            cx=A[0]+(t1x*lc+t2x*la)/(2*nn);cy=A[1]+(t1y*lc+t2y*la)/(2*nn);cz=A[2]+(t1z*lc+t2z*la)/(2*nn)
            r2=(A[0]-cx)**2+(A[1]-cy)**2+(A[2]-cz)**2
            s=np.sqrt(nn);ux=nx/s;uy=ny/s;uz=nz/s
            L=n-k-1
            if L<2:continue
            tv=np.empty(L);idx=np.empty(L,np.int64);q=0
            for p in range(k+1,n):
                dx=X[p,0]-cx;dy=X[p,1]-cy;dz=X[p,2]-cz
                d=dx*ux+dy*uy+dz*uz
                if abs(d)<1e-9*sc:continue
                tv[q]=(dx*dx+dy*dy+dz*dz-r2)/(2*d);idx[q]=p;q+=1
            if q<2:continue
            o=np.argsort(tv[:q]);ts=tv[:q][o];ps=idx[:q][o]
            a=0
            while a<q:
                b=a+1
                while b<q and abs(ts[b]-ts[a])<tol*(sc+abs(ts[a])):b+=1
                if b-a>=2:
                    t0=ts[a];ex=cx+t0*ux;ey=cy+t0*uy;ez=cz+t0*uz
                    R2=(A[0]-ex)**2+(A[1]-ey)**2+(A[2]-ez)**2
                    ok=True
                    for r in range(k):
                        if r==i or r==j:continue
                        e2=(X[r,0]-ex)**2+(X[r,1]-ey)**2+(X[r,2]-ez)**2
                        if abs(e2-R2)<tol*10*(sc*sc+R2):ok=False;break
                    if ok:
                        # 球上全部点；若除一点外都在同一个圆（平面）上，则是「圆 + 一点」，平凡，跳过
                        mem=np.empty(n,np.int64);mm=0
                        for r in range(n):
                            e2=(X[r,0]-ex)**2+(X[r,1]-ey)**2+(X[r,2]-ez)**2
                            if abs(e2-R2)<tol*10*(sc*sc+R2):mem[mm]=r;mm+=1
                        best=3
                        for u in range(mm):
                            for v in range(u+1,mm):
                                for w in range(v+1,mm):
                                    P0=X[mem[u]];a1=X[mem[v]]-P0;a2=X[mem[w]]-P0
                                    hx=a1[1]*a2[2]-a1[2]*a2[1];hy=a1[2]*a2[0]-a1[0]*a2[2];hz=a1[0]*a2[1]-a1[1]*a2[0]
                                    hn=np.sqrt(hx*hx+hy*hy+hz*hz)
                                    if hn<1e-9*sc*sc:continue
                                    c3=0
                                    for z in range(mm):
                                        dd=(X[mem[z],0]-P0[0])*hx+(X[mem[z],1]-P0[1])*hy+(X[mem[z],2]-P0[2])*hz
                                        if abs(dd)<1e-8*sc*hn:c3+=1
                                    if c3>best:best=c3
                            if best>=mm-1:break
                        if best>=mm-1:ok=False
                    if ok:
                        if m>=cap:return buf,-1
                        buf[m,0]=j;buf[m,1]=k;buf[m,2]=ps[a];buf[m,3]=t0;m+=1
                a=b
    return buf,m
def work(i):
    cap=20000
    while True:
        buf,m=stage1_i(X0,i,sc0,1e-9,cap)
        if m>=0:return [(i,int(r[0]),int(r[1]),int(r[2])) for r in buf[:m]]
        cap*=4
if __name__=='__main__':
    t0=time.time()
    import multiprocessing as mp
    stage1_i(X0[:8],0,sc0,1e-9,10)   # 先编译
    cand=[]
    with mp.Pool(mp.cpu_count()) as pool:
        for c,r in enumerate(pool.imap_unordered(work,range(NMAX),chunksize=4)):
            cand+=r
            if c%100==0:print('  i 完成',c,'候选',len(cand),'%.0fs'%(time.time()-t0),flush=True)
    print('第 1 步：候选球',len(cand),'用时 %.0fs'%(time.time()-t0),flush=True)
    # 第 2 步：每个候选由 4 个点确定；在 6 个四面体上求球、补全成员、复核
    def sphere4(Q):
        A=2*(Q[1:]-Q[0]);b=(Q[1:]**2).sum(1)-(Q[0]**2).sum()
        c=np.linalg.solve(A,b);return c,np.linalg.norm(Q[0]-c)
    sph=set()
    for (i,j,k,p) in cand:
        mem=None;ok=True
        for t in range(NT):
            Q=P[t][[i,j,k,p]]
            try:c,R=sphere4(Q)
            except np.linalg.LinAlgError:ok=False;break
            on=np.abs(np.linalg.norm(P[t][:NMAX]-c,axis=1)-R)<1e-8*(scale[t]+R)
            mem=on if mem is None else mem&on
        if ok:
            S=frozenset(np.where(mem)[0])
            if len(S)>=5:sph.add(S)
    print('第 2 步：6 个四面体上都成立的球',len(sph),'用时 %.0fs'%(time.time()-t0),flush=True)
    pickle.dump(dict(spheres=list(sph),labels=labels[:NMAX]),open('ospheres_raw_%d.pkl'%NMAX,'wb'))
