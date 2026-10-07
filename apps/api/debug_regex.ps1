$file = "D:\KINOOX\apps\api\src\core\logger.ts"
$content = Get-Content $file -Raw

Write-Host "Content preview:"
Write-Host $content.Substring(0, 200)
Write-Host ""

# Test pattern with single quotes
$sq = [char]39
$pattern1 = "from\s+${sq}(\.\.?/[^${sq}]+?)(?<!\.js)${sq}"
Write-Host "Pattern1: $pattern1"
$matches1 = [regex]::Matches($content, $pattern1)
Write-Host "Single-quote matches: $($matches1.Count)"
foreach ($m in $matches1) {
    Write-Host "  Match: '$($m.Value)' -> Group1: '$($m.Groups[1].Value)'"
}

# Test pattern with double quotes
$dq = [char]34
$pattern2 = "from\s+${dq}(\.\.?/[^${dq}]+?)(?<!\.js)${dq}"
Write-Host "Pattern2: $pattern2"
$matches2 = [regex]::Matches($content, $pattern2)
Write-Host "Double-quote matches: $($matches2.Count)"
foreach ($m in $matches2) {
    Write-Host "  Match: '$($m.Value)' -> Group1: '$($m.Groups[1].Value)'"
}

# Also test a simpler pattern
$simplePattern = "from\s+['"'"'"](\.\.?/[^'"'"'"]+?)['"'"'"]"
Write-Host ""
Write-Host "Testing simple pattern..."
$matchesSimple = [regex]::Matches($content, $simplePattern)
Write-Host "Simple matches: $($matchesSimple.Count)"
foreach ($m in $matchesSimple) {
    Write-Host "  Match: '$($m.Value)' -> Group1: '$($m.Groups[1].Value)'"
}
