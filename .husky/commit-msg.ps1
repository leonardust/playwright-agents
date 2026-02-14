#!/usr/bin/env pwsh

# Verify commit message format
$commitMsg = Get-Content $args[0] -Raw

# Conventional commits pattern
$pattern = "^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .{1,}"

if ($commitMsg -notmatch $pattern) {
    Write-Host "❌ Commit message format error!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Format: type(scope): message" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Types:" -ForegroundColor Cyan
    Write-Host "  feat     - nowa funkcjonalność"
    Write-Host "  fix      - naprawa błędu"
    Write-Host "  docs     - dokumentacja"
    Write-Host "  style    - formatowanie kodu"
    Write-Host "  refactor - refaktoryzacja"
    Write-Host "  test     - testy"
    Write-Host "  chore    - maintanance"
    Write-Host "  perf     - optymalizacja"
    Write-Host "  ci       - CI/CD"
    Write-Host "  build    - build system"
    Write-Host ""
    Write-Host "Example: feat(tests): add shopping cart test" -ForegroundColor Green
    exit 1
}
