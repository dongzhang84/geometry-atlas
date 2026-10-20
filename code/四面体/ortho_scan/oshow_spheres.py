# 把未解释的共球写成 Markdown 表：python3 oshow_spheres.py ospheres_cls_<点数>.pkl > ospheres_left.md
import sys,pickle
d0=pickle.load(open('ortho_points.pkl','rb'))
nmap={}
for l,nm in zip(d0['labels'],d0['names']):nmap[l]=nm
def nm(x):return '%s %s'%(x,nmap.get(x,''))
d=pickle.load(open(sys.argv[1],'rb'))
print('| 编号 | 点数 | 球上的点 | 同类个数 |\n|---|---|---|---|')
for k,(c,v) in enumerate(sorted(d['can'].items(),key=lambda x:(-len(x[0]),x[0])),1):
    print('| %d | %d | %s | %d |'%(k,len(c),'；'.join(nm(x) for x in c),len(v)))
