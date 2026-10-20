import numpy as np, math
def cr(u,v):return u[0]*v[1]-u[1]*v[0]
def circum(A,B,C):
    M=np.array([2*(B-A),2*(C-A)]);return np.linalg.solve(M,[B@B-A@A,C@C-A@A])
def inv_circle(P,O,R):d=P-O;return O+d*R*R/(d@d)
def harm(P,Q,X):
    # harmonic conjugate of X wrt P,Q (on line PQ)
    d=Q-P;t=(X-P)@d/(d@d);s=t/(2*t-1);return P+s*d
def centers(A,B,C):
    a=np.linalg.norm(B-C);b=np.linalg.norm(C-A);c=np.linalg.norm(A-B);s=(a+b+c)/2
    cA=(b*b+c*c-a*a)/(2*b*c);cB=(c*c+a*a-b*b)/(2*c*a);cC=(a*a+b*b-c*c)/(2*a*b)
    An,Bn,Cn=math.acos(cA),math.acos(cB),math.acos(cC)
    def bary(w):w=np.array(w,float);return (w[0]*A+w[1]*B+w[2]*C)/w.sum()
    def sym(f):  # f(a,b,c,A,B,C) for vertex A, cyclic
        return bary([f(a,b,c,An,Bn,Cn),f(b,c,a,Bn,Cn,An),f(c,a,b,Cn,An,Bn)])
    X={}
    X[1]=sym(lambda a,b,c,A,B,C:a)
    X[2]=sym(lambda a,b,c,A,B,C:1)
    X[3]=sym(lambda a,b,c,A,B,C:a*math.cos(A))
    X[4]=sym(lambda a,b,c,A,B,C:math.tan(A))
    X[5]=sym(lambda a,b,c,A,B,C:a*math.cos(B-C))
    X[6]=sym(lambda a,b,c,A,B,C:a*a)
    X[7]=sym(lambda a,b,c,A,B,C:1/(b+c-a))
    X[8]=sym(lambda a,b,c,A,B,C:b+c-a)
    X[9]=sym(lambda a,b,c,A,B,C:a*(b+c-a))
    X[10]=sym(lambda a,b,c,A,B,C:b+c)
    X[11]=sym(lambda a,b,c,A,B,C:a*(1-math.cos(B-C)))
    X[12]=harm(X[1],X[5],X[11])
    X[13]=sym(lambda a,b,c,A,B,C:a/math.sin(A+math.pi/3))
    X[14]=sym(lambda a,b,c,A,B,C:a/math.sin(A-math.pi/3))
    X[15]=sym(lambda a,b,c,A,B,C:a*math.sin(A+math.pi/3))
    X[16]=sym(lambda a,b,c,A,B,C:a*math.sin(A-math.pi/3))
    X[17]=sym(lambda a,b,c,A,B,C:a/math.sin(A+math.pi/6))
    X[18]=sym(lambda a,b,c,A,B,C:a/math.sin(A-math.pi/6))
    X[19]=sym(lambda a,b,c,A,B,C:a*math.tan(A))
    X[20]=2*X[3]-X[4]
    X[21]=sym(lambda a,b,c,A,B,C:a/(math.cos(B)+math.cos(C)))
    X[22]=sym(lambda a,b,c,A,B,C:a*a*(b**4+c**4-a**4))
    X[23]=sym(lambda a,b,c,A,B,C:a*a*(b**4+c**4-a**4-b*b*c*c))
    X[25]=sym(lambda a,b,c,A,B,C:a*a*math.tan(A))
    X[31]=sym(lambda a,b,c,A,B,C:a**3)
    X[32]=sym(lambda a,b,c,A,B,C:a**4)
    O=X[3];R=np.linalg.norm(A-O)
    X[36]=inv_circle(X[1],O,R)
    X[35]=harm(X[1],X[3],X[36])
    X[37]=sym(lambda a,b,c,A,B,C:a*(b+c))
    X[38]=sym(lambda a,b,c,A,B,C:a*(b*b+c*c))
    X[39]=sym(lambda a,b,c,A,B,C:a*a*(b*b+c*c))
    X[40]=2*X[3]-X[1]
    X[42]=sym(lambda a,b,c,A,B,C:a*a*(b+c))
    X[55]=sym(lambda a,b,c,A,B,C:a*a*(b+c-a))
    X[56]=sym(lambda a,b,c,A,B,C:a*a/(b+c-a))
    X[57]=sym(lambda a,b,c,A,B,C:a/(b+c-a))
    X[58]=sym(lambda a,b,c,A,B,C:a*a/(b+c))
    X[63]=sym(lambda a,b,c,A,B,C:a*(b*b+c*c-a*a))
    X[65]=sym(lambda a,b,c,A,B,C:a*(b+c)/(b+c-a))
    X[69]=sym(lambda a,b,c,A,B,C:b*b+c*c-a*a)
    X[75]=sym(lambda a,b,c,A,B,C:1/a)
    X[76]=sym(lambda a,b,c,A,B,C:1/(a*a))
    X[81]=sym(lambda a,b,c,A,B,C:a/(b+c))
    X[86]=sym(lambda a,b,c,A,B,C:1/(b+c))
    X[99]=sym(lambda a,b,c,A,B,C:1/(b*b-c*c))
    X[100]=sym(lambda a,b,c,A,B,C:a/(b-c))
    X[101]=sym(lambda a,b,c,A,B,C:a*a/(b-c))
    X[110]=sym(lambda a,b,c,A,B,C:a*a/(b*b-c*c))
    X[140]=(X[3]+X[5])/2
    X[141]=sym(lambda a,b,c,A,B,C:b*b+c*c)
    X[182]=(X[3]+X[6])/2
    X[376]=2*X[3]-X[2]
    X[381]=(X[2]+X[4])/2
    return X
