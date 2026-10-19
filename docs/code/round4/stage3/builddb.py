import json,re,math,sys
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application,convert_xor
E={int(k):v for k,v in json.load(open('ents.json')).items()}
T=standard_transformations+(implicit_multiplication_application,convert_xor)
syms=sp.symbols('a b c A B C W D R r s S U V Y Z')
a,b,c,A,B,C,W,D,R,r,s,S,U,V,Y,Z=syms
loc={str(x):x for x in syms};loc.update({'sec':sp.sec,'csc':sp.csc,'cot':sp.cot,'cos':sp.cos,'sin':sp.sin,'tan':sp.tan,'pi':sp.pi,'sqrt':sp.sqrt,'Sqrt':sp.sqrt,'f':sp.Function('f')})
def clean(t):
    t=t.replace('−','-').replace('–','-').replace('[','(').replace(']',')').replace('{','(').replace('}',')')
    t=re.sub(r'\(area ABC\)|area\(ABC\)|area ABC|area|Δ','D',t)
    t=t.replace('ω','W').replace('π','pi').replace('√','sqrt')
    t=re.sub(r'\bSA\b','U',t);t=re.sub(r'\bSB\b','V',t);t=re.sub(r'\bSC\b','Y',t);t=re.sub(r'\bSW\b','Z',t);t=re.sub(r'\bSω\b','Z',t)
    t=re.sub(r'([a-cA-CsrR\)])(\d+)',r'\1**\2',t)   # a2 -> a**2, (..)2 -> (..)**2
    t=t.replace('²','**2').replace('³','**3')
    t=re.sub(r'(cos|sin|tan|sec|csc|cot)\s*(\d*\s*[A-CW]/?\d*)(?![\w(])',lambda m:m.group(1)+'('+m.group(2).replace(' ','')+')',t)
    return t
def parse(t):
    return parse_expr(clean(t),local_dict=loc,transformations=T)
cyc={a:b,b:c,c:a,A:B,B:C,C:A,U:V,V:Y,Y:U}
def getformula(lines):
    out=[]
    for i,l in enumerate(lines[1:10]):
        m=re.match(r'^(Trilinears|Barycentrics)\s+(.*)$',l)
        if not m:continue
        kind,rest=m.groups();rest=rest.split('    (')[0]
        if 'X(' in rest or 'x : y : z' in rest: continue
        fdef=None
        if re.match(r'^\s*\w*\s*f\(a,\s*b,\s*c\)',rest) or rest.strip().startswith('f(a') or re.match(r'^[a-c]{0,3}\s*f\(a,b,c\)',rest.strip()):
            mm=re.search(r'f\(a,\s*b,\s*c\)\s*=\s*(.*)$',rest)
            if mm:fdef=mm.group(1)
            else:
                for l2 in lines[i+2:i+5]:
                    mm=re.search(r'f\(a,\s*b,\s*c\)\s*=\s*(.*)$',l2)
                    if mm:fdef=mm.group(1);break
            if not fdef:continue
            pref=rest.strip().split(':')[0].strip()
            out.append((kind,pref,fdef))
        else:
            out.append((kind,rest.split(':')[0].strip(),None))
    return out
db={}
fails=0
for k in sorted(E):
    got=None
    for kind,first,fdef in getformula(E[k]):
        try:
            if fdef is not None:
                fexpr=parse(fdef.rstrip(',;. '))
                ex=parse(first).replace(sp.Function('f'),sp.Lambda((a,b,c),fexpr)) if 'f' in first else None
                if ex is None:continue
                ex=parse(first.replace('f(a,b,c)','('+fdef.rstrip(',;. ')+')'))
            else:
                ex=parse(first)
            if ex.free_symbols-set(syms):continue
            got=(got or [])+[(kind,str(ex))]
            if len(got)>=3:break
        except Exception as e:
            continue
    if got:db[k]=got
    else:fails+=1
json.dump(db,open('db_expr.json','w'))
print('parsed',len(db),'fail',fails)
