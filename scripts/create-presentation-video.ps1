$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$renderDir = Join-Path $repoRoot '.video-work'
$outputPath = Join-Path $repoRoot 'public\waraka-presentation.mp4'
$posterPath = Join-Path $repoRoot 'public\waraka-presentation-poster.png'
$scenePage = Join-Path $repoRoot 'scripts\presentation-scene.html'
$edgeCandidates = @(
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Google\Chrome\Application\chrome.exe'
)
$browserPath = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $browserPath) {
  throw 'Edge ou Chrome est nécessaire pour générer les scènes de présentation.'
}

New-Item -ItemType Directory -Force -Path $renderDir | Out-Null
for ($scene = 1; $scene -le 5; $scene++) {
  $sceneOutput = Join-Path $renderDir ("scene-{0}.png" -f $scene)
  $sceneUrl = 'file:///' + ($scenePage.Replace('\', '/')) + "?scene=$scene"
  & $browserPath --headless --disable-gpu --hide-scrollbars --allow-file-access-from-files --no-first-run --no-default-browser-check --run-all-compositor-stages-before-draw --virtual-time-budget=1000 --window-size=1920,1080 --screenshot=$sceneOutput $sceneUrl | Out-Null
  if (-not (Test-Path $sceneOutput)) { throw "Scene $scene non générée." }
}

$sceneArgs = @()
for ($scene = 1; $scene -le 5; $scene++) {
  $sceneArgs += @('-loop', '1', '-framerate', '30', '-t', '3.4', '-i', (Join-Path $renderDir ("scene-{0}.png" -f $scene)))
}

$filter = @'
[0:v]zoompan=z='min(zoom+0.00055,1.055)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=102:s=1920x1080:fps=30,trim=duration=3.4,setpts=PTS-STARTPTS[v0];
[1:v]zoompan=z='min(zoom+0.00065,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=102:s=1920x1080:fps=30,trim=duration=3.4,setpts=PTS-STARTPTS[v1];
[2:v]zoompan=z='min(zoom+0.00045,1.045)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=102:s=1920x1080:fps=30,trim=duration=3.4,setpts=PTS-STARTPTS[v2];
[3:v]zoompan=z='min(zoom+0.0006,1.055)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=102:s=1920x1080:fps=30,trim=duration=3.4,setpts=PTS-STARTPTS[v3];
[4:v]zoompan=z='min(zoom+0.0005,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=102:s=1920x1080:fps=30,trim=duration=3.4,setpts=PTS-STARTPTS[v4];
[v0][v1]xfade=transition=fade:duration=0.45:offset=2.95[x1];
[x1][v2]xfade=transition=fade:duration=0.45:offset=5.90[x2];
[x2][v3]xfade=transition=fade:duration=0.45:offset=8.85[x3];
[x3][v4]xfade=transition=fade:duration=0.45:offset=11.80,format=yuv420p[v]
'@

$ffmpegArgs = @('-y') + $sceneArgs + @('-filter_complex', $filter, '-map', '[v]', '-an', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-movflags', '+faststart', $outputPath)
& ffmpeg @ffmpegArgs | Out-Host
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $outputPath)) { throw 'Le rendu vidéo a échoué.' }

Copy-Item (Join-Path $renderDir 'scene-1.png') $posterPath -Force
Write-Output "Vidéo générée : $outputPath"
