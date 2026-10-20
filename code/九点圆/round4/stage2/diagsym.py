from sym import *
def line(p,q):
    return [sp.cancel(p[1]*q[2]-p[2]*q[1]),sp.cancel(p[2]*q[0]-p[0]*q[2]),sp.cancel(p[0]*q[1]-p[1]*q[0])]
def meet(l,m):return cleanline(line(l,m))
todo=[(2,6,42,101),(3,9,40,101),(9,55,57,101),(7,8,21,99),(6,39,76,99),(2,6,37,100),(31,38,75,99),(21,35,36,110)]
for Cn in todo:
    print('{'+','.join('X%d'%k for k in Cn)+'}')
    for (p,q),(r,s) in [((Cn[0],Cn[1]),(Cn[2],Cn[3])),((Cn[0],Cn[2]),(Cn[1],Cn[3])),((Cn[0],Cn[3]),(Cn[1],Cn[2]))]:
        M=meet(line(P[p],P[q]),line(P[r],P[s]))
        print(f'   X{p}X{q} ∩ X{r}X{s}: A坐标 = {M[0]}   (次数 {sp.Poly(sp.numer(sp.together(M[0])),a,b,c).total_degree()})',flush=True)
