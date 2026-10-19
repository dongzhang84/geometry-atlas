from mpmath import mp,mpf,matrix,det,sqrt,lu_solve
import random
mp.dps=40
def inter(P,Q,R,S):
    M=matrix([[Q[0]-P[0],R[0]-S[0]],[Q[1]-P[1],R[1]-S[1]]]);t=lu_solve(M,matrix([R[0]-P[0],R[1]-P[1]]));return (P[0]+t[0]*(Q[0]-P[0]),P[1]+t[0]*(Q[1]-P[1]))
def row(p):x,y=p;return [x*x,x*y,y*y,x,y,1]
def rect_center(A,B,C,P):
    # conic a x^2+bxy-a y^2+dx+ey+f through 4 points: unknowns a,b,d,e,f ; set f via nullspace using cofactors
    rows=[[p[0]**2-p[1]**2,p[0]*p[1],p[0],p[1],1] for p in (A,B,C,P)]
    co=[]
    for j in range(5):
        M=matrix([[r[k] for k in range(5) if k!=j] for r in rows]);co.append((-1)**j*det(M))
    a,b,d,e,f=co;c=-a
    M=matrix([[2*a,b],[b,2*c]]);s=lu_solve(M,matrix([-d,-e]));return (s[0],s[1])
random.seed(11)
for t in range(6):
    A,B,C,P=[(mpf(random.uniform(-3,3)),mpf(random.uniform(-3,3))) for _ in range(4)]
    Da,Db,Dc=inter(A,P,B,C),inter(B,P,C,A),inter(C,P,A,B);Po=rect_center(A,B,C,P)
    M=matrix([[p[0]**2+p[1]**2,p[0],p[1],1] for p in (Da,Db,Dc,Po)])
    print(t,mp.nstr(det(M),5))
print("incentral circle through Feuerbach point:")
def nrm(p):return sqrt(p[0]**2+p[1]**2)
for t in range(4):
    A,B,C=[(mpf(random.uniform(-3,3)),mpf(random.uniform(-3,3))) for _ in range(3)]
    a=nrm((B[0]-C[0],B[1]-C[1]));b=nrm((C[0]-A[0],C[1]-A[1]));c=nrm((A[0]-B[0],A[1]-B[1]))
    I=((a*A[0]+b*B[0]+c*C[0])/(a+b+c),(a*A[1]+b*B[1]+c*C[1])/(a+b+c))
    Da,Db,Dc=inter(A,I,B,C),inter(B,I,C,A),inter(C,I,A,B);F=rect_center(A,B,C,I)
    M=matrix([[p[0]**2+p[1]**2,p[0],p[1],1] for p in (Da,Db,Dc,F)]);print(t,mp.nstr(det(M),5))
