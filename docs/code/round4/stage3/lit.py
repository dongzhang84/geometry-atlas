import json,re
E={int(k):v for k,v in json.load(open('ents.json')).items()}
circles=[(2,6,37,100),(2,6,42,101),(2,32,39,110),(3,4,69,99),(3,9,40,101),(6,11,37,55),(6,39,76,99),(7,8,21,99),(8,55,65,100),(9,55,57,101),(21,35,36,110),(21,55,56,110),(31,38,75,99)]
pairs={(2,6,37,100):[(2,100)],(6,11,37,55):[(11,55)],(2,32,39,110):[(2,110)],(3,4,69,99):[(69,99)],(8,55,65,100):[(8,100)],(21,35,36,110):[(21,110)],(21,55,56,110):[(21,110)],(31,38,75,99):[(75,99)]}
def mentions(line,k):return re.search(r'X\(%d\)(?!\d)'%k,line) or re.search(r'[\(\{, ]%d[\)\}, ]'%k,line)
for C in circles:
    print('='*10,'{'+','.join('X%d'%k for k in C)+'}')
    for k in C:
        for line in E.get(k,[]):
            others=[j for j in C if j!=k and mentions(line,j)]
            if len(others)>=1 and re.search(r'concyclic|circle|inverse|harmonic',line,re.I) and len(line)<600:
                print(f'  [X{k}] ({others})',line[:300])
