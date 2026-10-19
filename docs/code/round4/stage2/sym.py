import sympy as sp
a,b,c=sp.symbols('a b c',positive=True)
def S(f):return [sp.together(f(a,b,c)),sp.together(f(b,c,a)),sp.together(f(c,a,b))]
P={}
P[1]=S(lambda a,b,c:a);P[2]=S(lambda a,b,c:1)
P[3]=S(lambda a,b,c:a*a*(b*b+c*c-a*a));P[4]=S(lambda a,b,c:1/(b*b+c*c-a*a))
P[6]=S(lambda a,b,c:a*a);P[7]=S(lambda a,b,c:1/(b+c-a));P[8]=S(lambda a,b,c:b+c-a)
P[9]=S(lambda a,b,c:a*(b+c-a));P[11]=S(lambda a,b,c:(b+c-a)*(b-c)**2)
cos=lambda a,b,c:(b*b+c*c-a*a)/(2*b*c)
P[21]=S(lambda a,b,c:a/(cos(b,c,a)+cos(c,a,b)))
P[31]=S(lambda a,b,c:a**3);P[32]=S(lambda a,b,c:a**4)
P[35]=S(lambda a,b,c:a*a*(b*b+c*c-a*a+b*c));P[36]=S(lambda a,b,c:a*a*(b*b+c*c-a*a-b*c))
P[37]=S(lambda a,b,c:a*(b+c));P[38]=S(lambda a,b,c:a*(b*b+c*c));P[39]=S(lambda a,b,c:a*a*(b*b+c*c))
P[42]=S(lambda a,b,c:a*a*(b+c))
P[55]=S(lambda a,b,c:a*a*(b+c-a));P[56]=S(lambda a,b,c:a*a/(b+c-a));P[57]=S(lambda a,b,c:a/(b+c-a))
P[65]=S(lambda a,b,c:a*(b+c)/(b+c-a));P[69]=S(lambda a,b,c:b*b+c*c-a*a);P[75]=S(lambda a,b,c:1/a)
P[76]=S(lambda a,b,c:1/(a*a))
P[99]=S(lambda a,b,c:1/(b*b-c*c));P[100]=S(lambda a,b,c:a/(b-c));P[101]=S(lambda a,b,c:a*a/(b-c))
P[110]=S(lambda a,b,c:a*a/(b*b-c*c))
def nrm(v):s=sp.together(sum(v));return [sp.together(x/s) for x in v]
P={k:nrm(v) for k,v in P.items()}
P[40]=[sp.together(2*x-y) for x,y in zip(P[3],P[1])]
def cleanline(v):
    # clear denominators & gcd
    v=[sp.together(x) for x in v]
    L=sp.lcm([sp.denom(x) for x in v]);v=[sp.factor(sp.cancel(x*L)) for x in v]
    g=sp.gcd_list(v);return [sp.factor(sp.cancel(x/g)) for x in v]
def circle(pts):
    # circle: a2 yz+b2 zx+c2 xy - (x+y+z)(u x+v y+w z)=0 with x+y+z=1 normalized
    u,v,w=sp.symbols('u v w')
    eqs=[a*a*y*z+b*b*z*x+c*c*x*y-(u*x+v*y+w*z) for x,y,z in pts]
    sol=sp.solve(eqs,[u,v,w],dict=True)[0]
    return [sp.factor(sp.cancel(sol[s])) for s in (u,v,w)]
