param([string]$ProjectRoot=(Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Speech
$speechRoot=[IO.Path]::GetFullPath($ProjectRoot)
$speechEntries=Get-Content -LiteralPath (Join-Path $speechRoot 'audio/prompts/manifest.json') -Raw | ConvertFrom-Json
$speechFormat=New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000,[System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,[System.Speech.AudioFormat.AudioChannel]::Mono)
$speechWriter=New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  foreach($speechLanguage in @('zh','en')) {
    $speechWriter.SelectVoice($(if($speechLanguage -eq 'zh'){'Microsoft Huihui Desktop'}else{'Microsoft Zira Desktop'}))
    $speechWriter.Rate=-1
    $speechIndex=0
    foreach($speechEntry in @($speechEntries | Where-Object { $_.lang -eq $speechLanguage })) {
      $speechPath=[IO.Path]::GetFullPath((Join-Path $speechRoot $speechEntry.file))
      if(-not $speechPath.StartsWith((Join-Path $speechRoot 'audio\prompts\'),[StringComparison]::OrdinalIgnoreCase)){throw 'Invalid audio output path'}
      if(-not (Test-Path -LiteralPath $speechPath) -and -not (Test-Path -LiteralPath ([IO.Path]::ChangeExtension($speechPath,'.mp3')))) {
        $speechWriter.SetOutputToWaveFile($speechPath,$speechFormat)
        $speechWriter.Speak($speechEntry.text)
        $speechWriter.SetOutputToNull()
      }
      $speechIndex++
      if($speechIndex % 50 -eq 0){Write-Output "$speechLanguage recordings checked: $speechIndex"}
    }
  }
} finally {$speechWriter.Dispose()}
Write-Output 'Bundled speech generation finished.'
