from fractions import Fraction as Fr
import random, sympy as sp
def pts(a,b,c):
    S=lambda f:(f(a,b,c),f(b,c,a),f(c,a,b))
    def nrm(w):s=sum(w);return tuple(x/s for x in w)
    P={}
    P[1]=S(lambda a,b,c:a);P[2]=S(lambda a,b,c:1)
    P[3]=S(lambda a,b,c:a*a*(b*b+c*c-a*a));P[4]=S(lambda a,b,c:Fr(1)/(b*b+c*c-a*a))
    P[6]=S(lambda a,b,c:a*a);P[7]=S(lambda a,b,c:Fr(1)/(b+c-a));P[8]=S(lambda a,b,c:b+c-a)
    P[9]=S(lambda a,b,c:a*(b+c-a));P[11]=S(lambda a,b,c:(b+c-a)*(b-c)**2)
    cos=lambda a,b,c:Fr(b*b+c*c-a*a,2*b*c)
    P[21]=S(lambda a,b,c:a/(cos(b,c,a)+cos(c,a,b)))
    P[31]=S(lambda a,b,c:a**3);P[32]=S(lambda a,b,c:a**4)
    P[35]=S(lambda a,b,c:a*a*(b*b+c*c-a*a+b*c));P[36]=S(lambda a,b,c:a*a*(b*b+c*c-a*a-b*c))
    P[37]=S(lambda a,b,c:a*(b+c));P[38]=S(lambda a,b,c:a*(b*b+c*c));P[39]=S(lambda a,b,c:a*a*(b*b+c*c))
    P[42]=S(lambda a,b,c:a*a*(b+c))
    P[55]=S(lambda a,b,c:a*a*(b+c-a));P[56]=S(lambda a,b,c:Fr(a*a)/(b+c-a));P[57]=S(lambda a,b,c:Fr(a)/(b+c-a))
    P[65]=S(lambda a,b,c:Fr(a*(b+c))/(b+c-a));P[69]=S(lambda a,b,c:b*b+c*c-a*a);P[75]=S(lambda a,b,c:Fr(1,a))
    P[76]=S(lambda a,b,c:Fr(1,a*a))
    P[99]=S(lambda a,b,c:Fr(1)/(b*b-c*c));P[100]=S(lambda a,b,c:Fr(a)/(b-c));P[101]=S(lambda a,b,c:Fr(a*a)/(b-c))
    P[110]=S(lambda a,b,c:Fr(a*a)/(b*b-c*c))
    P={k:nrm(tuple(Fr(x) for x in v)) for k,v in P.items()}
    P[40]=tuple(2*x-y for x,y in zip(P[3],P[1]))
    return P
def concyc(a,b,c,Q):
    rows=[[a*a*y*z+b*b*z*x+c*c*x*y,x,y,z] for (x,y,z) in Q]
    return sp.Matrix(rows).det()
circles=[(2,6,37,100),(2,6,42,101),(2,32,39,110),(3,4,69,99),(3,9,40,101),(6,11,37,55),(6,39,76,99),(7,8,21,99),(8,55,65,100),(9,55,57,101),(21,35,36,110),(21,55,56,110),(31,38,75,99)]
random.seed(3);tri=[]
while len(tri)<30:
    a,b,c=[random.randint(3,60) for _ in range(3)]
    if a<b+c and b<a+c and c<a+b and len({a,b,c})==3:tri.append((a,b,c))
# sanity: X35/X36 formula check: X36 inverse of I -> collinear with I,O, and X35, X36 harmonic wrt 1,3 -- check collinear only
for C in circles:
    vals=[concyc(Fr(a),Fr(b),Fr(c),[pts(Fr(a),Fr(b),Fr(c))[k] for k in C]) for a,b,c in tri]
    print('{'+','.join('X%d'%k for k in C)+'}', '30个三角形全为0' if all(v==0 for v in vals) else '不为0: %s'%vals[:3])
# control: a false quadruple
a,b,c=tri[0];print('对照组 {X1,X2,X3,X4}:',concyc(Fr(a),Fr(b),Fr(c),[pts(Fr(a),Fr(b),Fr(c))[k] for k in (1,2,3,4)]))
