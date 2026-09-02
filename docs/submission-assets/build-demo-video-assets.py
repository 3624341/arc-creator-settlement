from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT=Path(r"C:\Users\user\Documents\New project\arc-creator-settlement\docs\submission-assets\video-frames")
OUT.mkdir(parents=True,exist_ok=True)
EVID=Path(r"C:\Users\user\Documents\New project\arc-creator-settlement\docs\evidence")
W,H=1280,720
BLACK=(17,17,17); WHITE=(255,255,255); MUTED=(108,103,94); PANEL=(244,242,237); PURPLE=(110,42,230); GREEN=(156,255,46); CYAN=(50,230,195)
REG=r"C:\Windows\Fonts\arial.ttf"; BOLD=r"C:\Windows\Fonts\arialbd.ttf"; MONO=r"C:\Windows\Fonts\consola.ttf"
def font(n,b=False,m=False): return ImageFont.truetype(MONO if m else (BOLD if b else REG),n)
def wrap(draw,text,f,width):
    words=text.split(); lines=[]; cur=""
    for w in words:
        t=(cur+" "+w).strip()
        if draw.textbbox((0,0),t,font=f)[2] <= width: cur=t
        else: lines.append(cur); cur=w
    if cur: lines.append(cur)
    return lines
def text(draw,xy,s,n=24,color=BLACK,b=False,m=False,width=None,spacing=8):
    f=font(n,b,m)
    if width:
        s="\n".join(wrap(draw,s,f,width))
    draw.multiline_text(xy,s,font=f,fill=color,spacing=spacing)
def base(kicker,title):
    im=Image.new("RGB",(W,H),WHITE); d=ImageDraw.Draw(im)
    text(d,(58,32),kicker,16,MUTED,True); text(d,(58,72),title,42,BLACK,True,width=1150)
    d.line((58,152,1220,152),fill=(215,210,201),width=2)
    return im,d
def save(im,i): im.save(OUT/f"frame-{i:02d}.png")
def codebox(d,code,x=58,y=205,w=1160,h=400,accent=CYAN):
    d.rounded_rectangle((x,y,x+w,y+h),24,fill=BLACK)
    d.ellipse((x+24,y+22,x+38,y+36),fill=(255,95,86)); d.ellipse((x+48,y+22,x+62,y+36),fill=(255,189,46)); d.ellipse((x+72,y+22,x+86,y+36),fill=(39,201,63))
    yy=y+72
    for line in code.splitlines(): text(d,(x+30,yy),line,20,accent if line.strip().startswith("//") else WHITE,m=True); yy+=31

im,d=base("QUESTBOOK TECHNICAL DEMO · 04:00","Arc Creator Settlement v0.3")
text(d,(58,205),"Programmable USDC milestone settlement on Arc",38,BLACK,True,width=720)
text(d,(58,315),"Circle user-owned wallets · Arc Testnet escrow · public onchain receipts",25,MUTED,width=720)
d.rounded_rectangle((850,195,1190,555),28,fill=BLACK); text(d,(890,235),"LIVE PROOF",16,CYAN,True); text(d,(890,315),"0.25",64,WHITE,True); text(d,(890,390),"USDC released",25,WHITE,True); text(d,(890,485),"Block 59,934,707",19,GREEN,True); save(im,1)

im,d=base("01 · PRODUCT FLOW","One agreement becomes four milestone releases")
steps=[("CREATE","Define creator + value"),("FUND","Deposit Arc USDC"),("SUBMIT","Creator delivers"),("RELEASE","Client approves"),("VERIFY","Share receipt")]
for i,(a,b) in enumerate(steps):
 x=58+i*232; d.rounded_rectangle((x,225,x+205,510),18,fill=(237,228,255) if a=="RELEASE" else PANEL); text(d,(x+20,255),str(i+1),30,PURPLE,True); text(d,(x+20,320),a,23,BLACK,True); text(d,(x+20,370),b,19,MUTED,width=165)
 if i<4:text(d,(x+206,345),"→",30,PURPLE,True)
text(d,(58,590),"The receipt is derived from confirmed chain state—not a database-only status.",23,BLACK,True); save(im,2)

im,d=base("02 · CONTRACT WALKTHROUGH","The factory deploys isolated escrows")
codebox(d,"// contracts/CreatorEscrowFactory.sol\nfunction createEscrow(\n  address creator,\n  uint256 totalAmount,\n  uint256[] calldata milestoneAmounts\n) external returns (address escrow) {\n  escrow = address(new CreatorEscrow(...));\n  emit EscrowCreated(msg.sender, creator, escrow);\n}")
text(d,(58,635),"Deployed Factory: 0x5b90cdfecf1c59596e0b6b9cae448a29c2774e32",18,MUTED,True,m=True); save(im,3)

im,d=base("03 · STATE MACHINE","Submission and release are explicit onchain transitions")
codebox(d,"// contracts/CreatorEscrow.sol\nfunction submitMilestone(uint256 index) external onlyCreator {\n  milestones[index].submitted = true;\n  emit MilestoneSubmitted(index);\n}\nfunction releaseMilestone(uint256 index) external onlyClient {\n  require(milestones[index].submitted, 'not submitted');\n  usdc.safeTransfer(creator, milestones[index].amount);\n  emit PaymentReleased(index, creator, milestones[index].amount);\n}",accent=GREEN); save(im,4)

im,d=base("04 · CIRCLE INTEGRATION","The user authorizes wallet operations without a seed phrase")
codebox(d,"// server-side Circle flow\nconst challenge = await circle.createTransaction({\n  walletId,\n  blockchain: 'ARC-TESTNET',\n  contractAddress: escrowAddress,\n  abiFunctionSignature: 'releaseMilestone(uint256)',\n  abiParameters: [milestoneIndex],\n});\n\n// browser: Circle SDK completes the challenge\nawait execute(challenge.challengeId);",accent=CYAN)
text(d,(58,635),"API key and Entity Secret stay in server-only environment variables.",20,PURPLE,True); save(im,5)

im,d=base("05 · WALLET UX","A Circle wallet on Arc is loaded with its USDC balance")
d.rounded_rectangle((58,190,750,585),26,fill=PANEL); text(d,(88,225),"User-owned wallet on Arc",38,BLACK,True); text(d,(88,310),"Demo user ID",18,MUTED,True); d.rounded_rectangle((88,345,700,405),16,outline=(210,205,196),width=2); text(d,(110,361),"grant-demo-client",21,BLACK); d.rounded_rectangle((88,440,255,500),28,fill=BLACK); text(d,(116,458),"Reload wallet",18,WHITE,True)
d.rounded_rectangle((790,190,1190,585),26,fill=BLACK); text(d,(825,230),"ARC TESTNET WALLET",16,CYAN,True); text(d,(825,295),"0x066c…5534",29,WHITE,True,m=True); d.rounded_rectangle((825,365,1155,490),18,fill=(47,47,47)); text(d,(850,390),"USDC balance",18,(190,190,190)); text(d,(850,430),"10 USDC",39,WHITE,True); save(im,6)

im,d=base("06 · LIVE SETTLEMENT","The demo escrow holds 1 USDC across four milestones")
for i,name in enumerate(["Contract accepted","Content produced","Content published","Campaign completed"]):
 y=190+i*105; d.rounded_rectangle((58,y,1220,y+82),20,outline=(221,216,207),width=2); text(d,(82,y+20),f"{i+1}. {name}",21,BLACK,True); text(d,(520,y+23),"0.25 USDC",19,BLACK,True); d.rounded_rectangle((815,y+17,905,y+62),22,fill=BLACK); text(d,(836,y+28),"Submit",16,WHITE,True); d.rounded_rectangle((920,y+17,1018,y+62),22,fill=PURPLE); text(d,(943,y+28),"Release",16,WHITE,True)
text(d,(58,630),"Escrow: 0x22De463e9969b8Cef07b151b9cB5D8c5A16D81Df",18,MUTED,True,m=True); save(im,7)

im,d=base("07 · PUBLIC RECEIPT","A confirmed release becomes a shareable proof page")
src=Image.open(EVID/"arc-creator-settlement-receipt.png").convert("RGB"); src.thumbnail((760,500)); im.paste(src,(58,175)); d.rounded_rectangle((855,185,1215,590),24,fill=BLACK); text(d,(890,225),"CONFIRMED ON ARC",16,CYAN,True); text(d,(890,290),"0.25 USDC",42,WHITE,True); text(d,(890,385),"Milestone 1",18,(170,170,170)); text(d,(890,420),"Contract accepted",23,WHITE,True); text(d,(890,505),"Block 59,934,707",19,GREEN,True); save(im,8)

im,d=base("08 · ARCSCAN VERIFICATION","The chain explorer independently confirms the transfer")
src=Image.open(EVID/"arcscan-payment-release.png").convert("RGB"); src.thumbnail((820,500)); im.paste(src,(45,175)); text(d,(920,220),"SUCCESS",32,(20,155,83),True); text(d,(920,300),"0.25 USDC",37,BLACK,True); text(d,(920,355),"to 0x066c…5534",20,MUTED); d.line((920,420,1180,420),fill=(210,205,196),width=2); text(d,(920,460),"Confirmed < 0.52 sec",19,PURPLE,True); text(d,(920,520),"Fee 0.004082715 USDC",18,BLACK,True); save(im,9)

im,d=base("09 · RECEIPT VERIFICATION","The page reads logs and chain state before rendering Paid")
codebox(d,"// receipt verification path\nconst tx = await publicClient.getTransactionReceipt({ hash });\nconst released = parseEventLogs({\n  abi: CreatorEscrowAbi,\n  logs: tx.logs,\n  eventName: 'PaymentReleased',\n})[0];\nconst milestone = await publicClient.readContract({\n  address: released.address, functionName: 'milestones', args: [index]\n});\nreturn { status: 'paid', amount, recipient, blockNumber };",accent=GREEN); save(im,10)

im,d=base("10 · VERIFICATION","The repository is tested and the proof is reproducible")
items=[("19 / 19","web tests"),("2 / 2","Solidity tests"),("1 USDC","funded escrow"),("0.25 USDC","released onchain")]
for i,(a,b) in enumerate(items):
 x=58+(i%2)*580;y=205+(i//2)*190;d.rounded_rectangle((x,y,x+540,y+155),22,fill=PANEL);text(d,(x+28,y+25),a,41,PURPLE if i==3 else BLACK,True);text(d,(x+28,y+95),b,21,MUTED)
text(d,(58,610),"GitHub: github.com/3624341/arc-creator-settlement",21,BLACK,True); save(im,11)

im=Image.new("RGB",(W,H),BLACK); d=ImageDraw.Draw(im); text(d,(58,80),"Arc Creator Settlement v0.3",18,CYAN,True); text(d,(58,155),"Working proof today.\nReusable infrastructure next.",54,WHITE,True); text(d,(58,355),"Live demo",17,(170,170,170),True); text(d,(58,390),"arc-creator-settlement-v0-2.vercel.app",24,WHITE,True); text(d,(58,470),"Public receipt",17,(170,170,170),True); text(d,(58,505),"…/receipt/0xdf8a7711…eb856",24,WHITE,True,m=True); text(d,(58,610),"Arc Testnet · Chain ID 5042002",19,GREEN,True); save(im,12)

Path(OUT.parent/"Arc-Creator-Settlement-v0.3-Video-Narration.txt").write_text("""Arc Creator Settlement version zero point three is a working milestone settlement application on Arc Testnet. It combines Circle user-owned wallets, programmable USDC escrow, and public onchain receipts.\n\nThe flow begins when a client creates an agreement with a creator, a total value, and four milestones. The client funds the escrow with Arc USDC. The creator submits completed work, the client releases the milestone, and anyone can verify the result from a public receipt.\n\nThe Creator Escrow Factory deploys an isolated escrow for each agreement. The current factory is deployed on Arc Testnet at the address shown here, and the creation event makes new escrows discoverable.\n\nInside each escrow, submission and release are separate state transitions. Only the creator can submit. Only the client can release. A successful release transfers the exact milestone amount and emits a Payment Released event.\n\nFor user authorization, the server creates a Circle contract-execution challenge for the Arc Testnet wallet. The browser completes that challenge through Circle's wallet SDK. API keys and the Entity Secret remain server-side and never enter the browser bundle.\n\nThe Circle Wallet page reloads or creates a user-owned wallet and displays its Arc Testnet USDC balance. The demo wallet address ends in five five three four. The user keeps control of the keyshare without handling a seed phrase.\n\nThis deployed demo escrow was funded with one USDC and splits the project into four milestones of zero point two five USDC each. The interface exposes approval, deposit, submit, and release operations for the complete settlement lifecycle.\n\nAfter the first milestone was submitted and released, the application generated this public read-only receipt. It reports the milestone, amount, creator, client, escrow, timestamp, block number, and transaction hash from confirmed Arc data.\n\nArcScan independently confirms the same transaction. It succeeded at block fifty-nine million nine hundred thirty-four thousand seven hundred seven, transferring zero point two five USDC to the creator wallet.\n\nThe receipt route fetches the transaction receipt, parses the Payment Released event, reads the escrow milestone state, and renders Paid only after those values agree. The URL itself is not treated as proof.\n\nThe repository currently passes nineteen web tests and two Solidity tests. The live proof includes a one-USDC funded escrow and a confirmed zero-point-two-five-USDC milestone release. All deployment evidence and links are documented in GitHub.\n\nArc Creator Settlement already demonstrates the end-to-end path on Arc Testnet. The next phase is to harden authorization and failure handling, add event observability and reusable marketplace APIs, prototype Circle Gateway funding, and complete a focused security review and controlled pilot.""",encoding="utf-8")
