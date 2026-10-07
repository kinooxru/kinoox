$baseDir = "D:\KINOOX\apps\api\src"
$pattern = [regex]::new("from\s+['"'"'""](\.\.?/[^'"'"'""]+?)['"'"'""]")

$modifiedFiles = @()
$totalChanges = 0

$tsFiles = Get-ChildItem -Path $baseDir -Filter "*.ts" -Recurse -File
$tsxFiles = Get-ChildItem -Path $baseDir -Filter "*.tsx" -Recurse -File
$allFiles = $tsFiles + $tsxFiles

Write-Host "Found $($allFiles.Count) TypeScript files to process..."

foreach ($file in $allFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    $content = $content -replace $pattern, {
        param($match)
        $importPath = $match.Groups[1].Value
        if (-not $importPath.EndsWith(".js")) {
            $script:totalChanges++
            return "from '" + $importPath + ".js'"
        }
        return $match.Value
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $modifiedFiles += $file.FullName
    }
}

Write-Host ""
Write-Host "=" * 60
Write-Host "SUMMARY"
Write-Host "=" * 60
Write-Host "Total .ts/.tsx files scanned: $($allFiles.Count)"
Write-Host "Files modified: $($modifiedFiles.Count)"
Write-Host "Total import replacements made: $totalChanges"
Write-Host ""
if ($modifiedFiles.Count -gt 0) {
    Write-Host "Modified files:"
    foreach ($f in $modifiedFiles) {
        Write-Host "  $f"
    }
}
