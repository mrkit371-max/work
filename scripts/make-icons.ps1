# Генерация иконок PWA (оранжевый фон + белая гантель)
Add-Type -AssemblyName System.Drawing

function Add-RoundRect([System.Drawing.Drawing2D.GraphicsPath]$p, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $r = [Math]::Max($r, 0.5)
  $p.AddArc($x, $y, $r, $r, 180, 90)          | Out-Null
  $p.AddArc($x + $w - $r, $y, $r, $r, 270, 90) | Out-Null
  $p.AddArc($x + $w - $r, $y + $h - $r, $r, $r, 0, 90) | Out-Null
  $p.AddArc($x, $y + $h - $r, $r, $r, 90, 90)  | Out-Null
  $p.CloseFigure() | Out-Null
}

function New-Icon([int]$s, [string]$out, [bool]$maskable) {
  $bmp = New-Object System.Drawing.Bitmap $s, $s
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)

  # фон: скруглённый квадрат (для maskable — квадрат с внутр. отступом)
  $orange = [System.Drawing.Color]::FromArgb(255, 249, 115, 22)
  $deep   = [System.Drawing.Color]::FromArgb(255, 234, 88, 12)
  $bg     = New-Object System.Drawing.Drawing2D.GraphicsPath
  $pad = if ($maskable) { 0 } else { [int]($s * 0.06) }
  $round  = if ($maskable) { 0 } else { [int]($s * 0.22) }
  Add-RoundRect $bg $pad $pad ($s - 2 * $pad) ($s - 2 * $pad) $round
  $g.FillPath((New-Object System.Drawing.SolidBrush $orange), $bg) | Out-Null

  # мягкое «свечение» сверху
  if (-not $maskable) {
    $glow = New-Object System.Drawing.Drawing2D.GraphicsPath
    Add-RoundRect $glow $pad $pad ($s - 2 * $pad) ($s * 0.55 - $pad) $round
    $p1 = New-Object System.Drawing.Point -ArgumentList 0, 0
    $p2 = New-Object System.Drawing.Point -ArgumentList 0, $s
    $c1 = [System.Drawing.Color]::FromArgb(90, 255, 255, 255)
    $c2 = [System.Drawing.Color]::FromArgb(0, 255, 255, 255)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush -ArgumentList $p1, $p2, $c1, $c2
    $g.FillPath($brush, $glow) | Out-Null
  }

  # гантель (горизонтальная), рисуем в центральных координатах
  $g.TranslateTransform($s / 2.0, $s / 2.0)
  $g.RotateTransform(-30.0)
  $u = $s / 100.0   # базовая единица
  $white = [System.Drawing.Brushes]::White

  # гриф
  $bar = New-Object System.Drawing.Drawing2D.GraphicsPath
  Add-RoundRect $bar (-34 * $u) (-4 * $u) (68 * $u) (8 * $u) (4 * $u)
  $g.FillPath($white, $bar) | Out-Null

  # блины: две пары, ближе к краям
  foreach ($cx in @(-26, 26)) {
    $w1 = New-Object System.Drawing.Drawing2D.GraphicsPath
    Add-RoundRect $w1 ($cx * $u - 7 * $u) (-16 * $u) (14 * $u) (32 * $u) (6 * $u)
    $g.FillPath($white, $w1) | Out-Null
  }
  foreach ($cx in @(-36, 36)) {
    $w2 = New-Object System.Drawing.Drawing2D.GraphicsPath
    Add-RoundRect $w2 ($cx * $u - 6 * $u) (-11 * $u) (12 * $u) (22 * $u) (5 * $u)
    $g.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 255, 255, 255))), $w2) | Out-Null
  }

  $g.ResetTransform()
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Host "OK $out"
}

$dir = Join-Path $PSScriptRoot '..\public\icons'
New-Item -ItemType Directory -Force $dir | Out-Null
New-Icon 512 (Join-Path $dir 'icon-512.png') $false
New-Icon 192 (Join-Path $dir 'icon-192.png') $false
New-Icon 512 (Join-Path $dir 'icon-512-maskable.png') $true
