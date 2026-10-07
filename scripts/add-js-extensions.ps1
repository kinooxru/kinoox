# Add .js to all relative imports in apps/api/src

$files = Get-ChildItem -Path "D:/KINOOX/apps/api/src" -Filter "*.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $original = $content
    
    # Replace relative imports without .js extension
    # Pattern: from './path' or from '../path' (not already ending with .js)
    $content = $content -replace "from\s+['`\"](\.[^'\`]+)['`\"]", {
        param($match)
        $import = $match.Groups[1].Value
        if ($import -notmatch '\.(js|ts|mjs|json)$') {
            "from '$($import).js'"
        } else {
            $match.Value
        }
    }
    
    if ($content -ne $original) {
        Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Done!"
