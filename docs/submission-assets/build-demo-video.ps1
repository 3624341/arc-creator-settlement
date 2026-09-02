$ErrorActionPreference = 'Stop'
$root = 'C:\Users\user\Documents\New project\arc-creator-settlement\docs\submission-assets'
$frames = Join-Path $root 'video-frames'
$pptx = Join-Path $root 'Arc-Creator-Settlement-v0.3-Technical-Demo-Source.pptx'
$mp4 = Join-Path $root 'Arc-Creator-Settlement-v0.3-Technical-Demo.mp4'

$app = New-Object -ComObject PowerPoint.Application
$app.Visible = -1
$pres = $app.Presentations.Add()
$pres.PageSetup.SlideWidth = 960
$pres.PageSetup.SlideHeight = 540
for ($i=1; $i -le 12; $i++) {
  $slide = $pres.Slides.Add($i, 12)
  $png = Join-Path $frames ('frame-{0:D2}.png' -f $i)
  [void]$slide.Shapes.AddPicture($png, 0, -1, 0, 0, 960, 540)
  $slide.SlideShowTransition.AdvanceOnClick = 0
  $slide.SlideShowTransition.AdvanceOnTime = -1
  $slide.SlideShowTransition.AdvanceTime = 20
  $slide.SlideShowTransition.EntryEffect = 3849
}
$pres.SaveAs($pptx, 24)
$pres.CreateVideo($mp4, $true, 20, 1080, 30, 85)
$deadline = (Get-Date).AddMinutes(12)
while ($pres.CreateVideoStatus -in 1,2 -and (Get-Date) -lt $deadline) { Start-Sleep -Seconds 5 }
$status = $pres.CreateVideoStatus
$pres.Close()
$app.Quit()
Write-Output "CreateVideoStatus=$status"
Write-Output $mp4
