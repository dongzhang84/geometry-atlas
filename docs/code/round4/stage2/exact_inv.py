import sys;sys.path.insert(0,'../probe3')
from fractions import Fraction as Fr
from exact import pts
# Heronian triangles placed with rational coordinates: (a,b,c) with A=(0,0),B=(c,0),C=(x,y)
tris=[(14,15,13),(10,17,21),(20,13,21),(11,13,20),(17,25,28),(13,37,40),(15,34,35),(29,21,20)]
def place(a,b,c):
    a,b,c=Fr(a),Fr(b),Fr(c);x=(b*b+c*c-a*a)/(2*c);y2=b*b-x*x
    from math import isqrt
    n,d=y2.numerator,y2.denominator;rn,rd=isqrt(n),isqrt(d)
    assert rn*rn==n and rd*rd==d,(a,b,c);return (Fr(0),Fr(0)),(c,Fr(0)),(x,Fr(rn,rd))
facts=[(2,100,1,9),(11,55,1,9),(6,37,1,9),(69,99,2,20),(3,4,2,20),(8,100,1,40),(55,65,1,40),(21,110,1,3),(35,36,1,3),(55,56,1,3),(75,99,1,63),(31,38,1,63)]
import sys
for (a,b,c) in tris:
    A,B,C=place(a,b,c)
    Pb=pts(Fr(a),Fr(b),Fr(c))
    def cart(k):
        w=Pb[k];return (w[0]*A[0]+w[1]*B[0]+w[2]*C[0],w[0]*A[1]+w[1]*B[1]+w[2]*C[1])
    def need(k):
        if k in Pb:return cart(k)
        if k==20:o=cart(3);h=cart(4);return (2*o[0]-h[0],2*o[1]-h[1])
        if k==63:
            w=[x*(y*y+z*z-x*x) for x,y,z in ((Fr(a),Fr(b),Fr(c)),(Fr(b),Fr(c),Fr(a)),(Fr(c),Fr(a),Fr(b)))];s=sum(w);w=[t/s for t in w]
            return (w[0]*A[0]+w[1]*B[0]+w[2]*C[0],w[0]*A[1]+w[1]*B[1]+w[2]*C[1])
        if k==5:o=cart(3);h=cart(4);return ((o[0]+h[0])/2,(o[1]+h[1])/2)
    ok=[]
    for p,q,i,j in facts:
        P,Q,X,Y=need(p),need(q),need(i),need(j)
        M=((X[0]+Y[0])/2,(X[1]+Y[1])/2);r2=((X[0]-M[0])**2+(X[1]-M[1])**2)
        u=(P[0]-M[0],P[1]-M[1]);v=(Q[0]-M[0],Q[1]-M[1])
        ok.append(u[0]*v[1]-u[1]*v[0]==0 and u[0]*v[0]+u[1]*v[1]==r2)
    print((a,b,c),ok)
