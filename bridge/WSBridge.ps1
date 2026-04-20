param([string]$Command = "currentTrack")

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,
         Windows.Media.Control, ContentType=WindowsRuntime]

function Await($task) { $task.AsTask().GetAwaiter().GetResult() }

function Get-PlaybackState([int]$status) {
    switch ($status) { 5 { return "Playing" } 6 { return "Paused" } default { return "Stopped" } }
}

try {
    $manager  = Await([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync())
    $sessions = $manager.GetSessions()

    $session = $null
    foreach ($s in $sessions) {
        if ($s.SourceAppUserModelId -match "AppleMusic|iTunes") { $session = $s; break }
    }
    if (-not $session -and $sessions.Count -gt 0) { $session = $sessions[0] }
    if (-not $session) { Write-Output '{"state":"Stopped"}'; exit 0 }

    $stateStr = Get-PlaybackState([int]$session.GetPlaybackInfo().PlaybackStatus)

    if ($Command -match "^(playerState|playerstate|state)$") {
        Write-Output $stateStr; exit 0
    }

    $props    = Await($session.TryGetMediaPropertiesAsync())
    $timeline = $session.GetTimelineProperties()

    $data = [ordered]@{
        name     = $props.Title
        artist   = $props.Artist
        album    = $props.AlbumTitle
        duration = [math]::Round($timeline.EndTime.TotalSeconds)
        elapsed  = [math]::Round($timeline.Position.TotalSeconds)
        state    = $stateStr
    }
    Write-Output ($data | ConvertTo-Json -Compress)
} catch {
    Write-Output '{"state":"Stopped"}'
}
exit 0
