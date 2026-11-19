"""One continuous torso cage, shared across body seams and upper sleeve roots.
Depth only; wide cut, shoulder height, neck opening and level hem are retained.
"""
import numpy as np

def profile_curve(z,knots,values):
 x=np.asarray(knots,dtype=float);y=np.asarray(values,dtype=float);h=np.diff(x);d=np.diff(y)/h;m=np.zeros(len(x))
 for i in range(1,len(x)-1):
  if d[i-1]*d[i]>0:
   w1=2*h[i]+h[i-1];w2=h[i]+2*h[i-1];m[i]=(w1+w2)/(w1/d[i-1]+w2/d[i])
 if z<=x[0]:return float(y[0])
 if z>=x[-1]:return float(y[-1])
 i=int(np.searchsorted(x,z)-1);t=(z-x[i])/h[i]
 return float((2*t**3-3*t*t+1)*y[i]+(t**3-2*t*t+t)*h[i]*m[i]+(-2*t**3+3*t*t)*y[i+1]+(t**3-t*t)*h[i]*m[i+1])

def shape_torso(bm,amount=1.):
 knots=[-.846,-.55,-.22,.10,.34,.52,.72,.94]
 front=[0,.008,.027,.09,.12,.09,0,0]
 back=[0,.003,.006,.018,.025,.02,0,0]
 maximum=0.;changed=0
 for v in bm.verts:
  x=abs(v.co.x);z=v.co.z
  if x>=.58 or z<=knots[0]or z>=.72:continue
  lateral=(1-(x/.58)**2)**2
  def side_weight(depth):
   t=max(0,min(1,depth/.16));return t*t*(3-2*t)
  delta=amount*lateral*(profile_curve(z,knots,back)*side_weight(v.co.y)-profile_curve(z,knots,front)*side_weight(-v.co.y))
  v.co.y+=delta;maximum=max(maximum,abs(delta));changed+=abs(delta)>1e-7
 info={'method':'continuous shape-preserving torso cage','amount':amount,'halfWidth':.58,'heightKnots':knots,'frontDepthOffsets':front,'backDepthOffsets':back,'maxDepthChange':maximum,'changedVertices':int(changed),'protected':'X/height, collar above .72, cuffs outside .58 and lower rim'}
 print('HUMAN_TORSO_CAGE',info,flush=True);return info
