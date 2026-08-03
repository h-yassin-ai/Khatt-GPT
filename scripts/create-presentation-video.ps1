$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$renderDir = Join-Path $repoRoot '.video-work'
$outputPath = Join-Path $repoRoot 'public\waraka-presentation.mp4'
$posterPath = Join-Path $repoRoot 'public\waraka-presentation-poster.png'
$scenePage = Join-Path $repoRoot 'scripts\presentation-scene.html'
$lineAsset = Join-Path $repoRoot 'public\images\guide\thuluth-line.png'
$edgeCandidates = @(
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Google\Chrome\Application\chrome.exe'
)
$browserPath = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $browserPath) {
  throw 'Edge ou Chrome est nécessaire pour générer les scènes de présentation.'
}

New-Item -ItemType Directory -Force -Path $renderDir | Out-Null
& ffmpeg -loglevel error -y -i (Join-Path $repoRoot 'public\images\guide\thuluth.png') -vf 'crop=518:28:0:20,scale=1600:-1:flags=lanczos' $lineAsset
for ($scene = 1; $scene -le 4; $scene++) {
  $sceneOutput = Join-Path $renderDir ("scene-{0}.png" -f $scene)
  $sceneUrl = 'file:///' + ($scenePage.Replace('\', '/')) + "?scene=$scene"
  & $browserPath --headless --disable-gpu --hide-scrollbars --allow-file-access-from-files --no-first-run --no-default-browser-check --run-all-compositor-stages-before-draw --virtual-time-budget=1000 --window-size=1920,1080 --screenshot=$sceneOutput $sceneUrl | Out-Null
  if (-not (Test-Path $sceneOutput)) { throw "Scene $scene non générée." }
}

$sceneArgs = @()
for ($scene = 1; $scene -le 4; $scene++) {
  $sceneArgs += @('-loop', '1', '-framerate', '30', '-t', '3.9', '-i', (Join-Path $renderDir ("scene-{0}.png" -f $scene)))
}

$filter = @'
[0:v]zoompan=z='min(zoom+0.00045,1.045)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=117:s=1920x1080:fps=30,trim=duration=3.9,setpts=PTS-STARTPTS[v0];
[1:v]zoompan=z='min(zoom+0.00055,1.055)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=117:s=1920x1080:fps=30,trim=duration=3.9,setpts=PTS-STARTPTS[v1];
[2:v]zoompan=z='min(zoom+0.00045,1.045)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=117:s=1920x1080:fps=30,trim=duration=3.9,setpts=PTS-STARTPTS[v2];
[3:v]zoompan=z='min(zoom+0.00055,1.055)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=117:s=1920x1080:fps=30,trim=duration=3.9,setpts=PTS-STARTPTS[v3];
[v0][v1]xfade=transition=fade:duration=0.45:offset=3.45[x1];
[x1][v2]xfade=transition=fade:duration=0.45:offset=6.90[x2];
[x2][v3]xfade=transition=fade:duration=0.45:offset=10.35,format=yuv420p[v]
'@

$ffmpegArgs = @('-y') + $sceneArgs + @('-filter_complex', $filter, '-map', '[v]', '-an', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-movflags', '+faststart', $outputPath)
& ffmpeg @ffmpegArgs | Out-Host
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $outputPath)) { throw 'Le rendu vidéo a échoué.' }

Copy-Item (Join-Path $renderDir 'scene-1.png') $posterPath -Force
Write-Output "Vidéo générée : $outputPath"
