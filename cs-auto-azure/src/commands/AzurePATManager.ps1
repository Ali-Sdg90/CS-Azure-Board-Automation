$Org = "cs-internship"
$Pat = ""

$base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$Pat"))
$headers = @{ Authorization = "Basic $base64AuthInfo" }

$response = Invoke-RestMethod -Uri "https://vsaex.dev.azure.com/$Org/_apis/tokenadministration/pats?api-version=7.1-preview.1" -Headers $headers -Method Get

$response.value | ForEach-Object {
    Write-Output "DisplayName: $($_.displayName)"
    Write-Output "TokenId: $($_.tokenId)"
    Write-Output "ValidTo: $($_.validTo)"
    Write-Output "---------------------------"
}
