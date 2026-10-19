import json,re,pickle,collections
E={int(k):v for k,v in json.load(open('ents.json')).items()}
cl=pickle.load(open('closure2.pkl','rb'));reg=cl['reg']
def mentions(line,k):return re.search(r'X\(%d\)(?!\d)'%k,line)
out=[];kinds=collections.Counter()
for (w,(p,q)),cs in sorted(cl['need'].items(),key=lambda kv:-len(kv[1])):
    X=reg[w][0];hits=[]
    for a,b in ((p,q),(q,p)):
        for l in E.get(a,[]):
            if mentions(l,b) and len(l)<400 and 'lies on these lines' not in l:hits.append(l.strip()[:150])
    out.append((X,p,q,len(cs),hits))
    kinds['有共同提及' if hits else '无任何共同提及']+=1
print(kinds)
for X,p,q,n,h in out[:40]:
    print('ω圆心X%d  X%d↔X%d (%d圆)'%(X,p,q,n),'|',h[0] if h else '—')
pickle.dump(out,open('comention.pkl','wb'))
