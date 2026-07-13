import cv2, numpy as np
from PIL import Image

SRC = r'C:/Users/Josh Birch/.claude/uploads/c5880b80-7b6f-4319-818d-8ed5d85ecdd9/027c80da-1783894114567.jpg'
OUT = r'C:/Users/Josh Birch/dev/tb-app/scratchpad'
EMBER = (238, 92, 40)  # #ee5c28 RGB

img = cv2.imread(SRC)  # BGR
h, w = img.shape[:2]

mask = np.zeros((h, w), np.uint8)
bgd = np.zeros((1, 65), np.float64)
fgd = np.zeros((1, 65), np.float64)
rect = (22, 92, w - 44, 255)
cv2.grabCut(img, mask, rect, bgd, fgd, 7, cv2.GC_INIT_WITH_RECT)
m = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

# --- clean: despeckle only, keep the rifle body, PRESERVE interior gaps (holes) ---
k5 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
k3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k5, iterations=1)   # shave nibs / speckle
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k3, iterations=1)  # gentle — don't fill holes
n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
if n > 1:
    biggest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    m = np.where(lab == biggest, 255, 0).astype(np.uint8)

# --- de-lump at 4x res (smooth facets, gentle epsilon) and KEEP interior holes ---
SS = 4
big = cv2.resize(m, (w * SS, h * SS), interpolation=cv2.INTER_NEAREST)
cnts, hier = cv2.findContours(big, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
simp = np.zeros_like(big)
if cnts:
    hier = hier[0]
    for outer in (True, False):  # outer (white) first, then holes (black)
        for i, c in enumerate(cnts):
            is_outer = hier[i][3] == -1
            if is_outer != outer or len(c) < 4:
                continue
            area = cv2.contourArea(c)
            if is_outer and area < 500 * SS * SS:
                continue
            if (not is_outer) and area < 45 * SS * SS:  # keep gaps > ~45 native px
                continue
            eps = 0.0022 * cv2.arcLength(c, True)
            a = cv2.approxPolyDP(c, eps, True)
            cv2.drawContours(simp, [a], -1, 255 if is_outer else 0, cv2.FILLED)

# --- antialias: feather + area-downsample the 4x shape to an 8-bit alpha ---
big = cv2.GaussianBlur(simp, (0, 0), sigmaX=SS * 0.6)
alpha = cv2.resize(big, (w, h), interpolation=cv2.INTER_AREA)

ys, xs = np.where(alpha > 40)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
cropA = alpha[y0:y1 + 1, x0:x1 + 1]

rgba = np.zeros((cropA.shape[0], cropA.shape[1], 4), np.uint8)
rgba[..., 0], rgba[..., 1], rgba[..., 2] = EMBER
rgba[..., 3] = cropA
Image.fromarray(rgba, 'RGBA').save(OUT + '/rifle_silhouette.png')
# white-on-black luminance mask (antialiased) so the SVG can relight the shape
Image.fromarray(np.stack([cropA, cropA, cropA], -1).astype(np.uint8), 'RGB').save(OUT + '/rifle_mask.png')
print('bbox', (x0, y0, x1, y1), 'crop', cropA.shape[::-1])
