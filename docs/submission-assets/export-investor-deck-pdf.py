from pathlib import Path
from reportlab.pdfgen import canvas

root = Path(r"C:\Users\user\Documents\New project\arc-creator-settlement")
src = root / "docs" / "submission-assets"
out = root / "output" / "pdf" / "Arc-Creator-Settlement-v0.3-Investor-Deck.pdf"
out.parent.mkdir(parents=True, exist_ok=True)

width, height = 1280, 720
pdf = canvas.Canvas(str(out), pagesize=(width, height), pageCompression=1)
pdf.setTitle("Arc Creator Settlement v0.3 Investor Deck")
pdf.setAuthor("Arc Creator Settlement")
for index in range(1, 11):
    image = src / f"deck-slide-{index:02d}.png"
    pdf.drawImage(str(image), 0, 0, width=width, height=height, preserveAspectRatio=True)
    pdf.showPage()
pdf.save()
print(out)
