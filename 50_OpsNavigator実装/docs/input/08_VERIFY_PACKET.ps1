[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$packetRoot = $PSScriptRoot
$failures = [System.Collections.Generic.List[string]]::new()
$checks = [System.Collections.Generic.List[string]]::new()

function Add-Failure {
    param([string]$Message)
    $failures.Add($Message)
}

function Add-Check {
    param([string]$Message)
    $checks.Add($Message)
}

function Test-UniqueIds {
    param(
        [object[]]$Items,
        [string]$CollectionName
    )
    $ids = @($Items | ForEach-Object { $_.id })
    $uniqueIds = @($ids | Sort-Object -Unique)
    if ($ids.Count -ne $uniqueIds.Count) {
        Add-Failure "$CollectionName contains duplicate ids"
    } else {
        Add-Check "$CollectionName ids are unique: $($ids.Count)"
    }
}

$hashPath = Join-Path $packetRoot '07_SHA256SUMS.txt'
if (-not (Test-Path -LiteralPath $hashPath)) {
    Add-Failure '07_SHA256SUMS.txt is missing'
} else {
    foreach ($hashLine in Get-Content -LiteralPath $hashPath -Encoding UTF8) {
        if ([string]::IsNullOrWhiteSpace($hashLine) -or $hashLine.StartsWith('#')) {
            continue
        }
        if ($hashLine -notmatch '^([a-fA-F0-9]{64})\s+\*?(.+)$') {
            Add-Failure "Invalid hash line: $hashLine"
            continue
        }
        $expectedHash = $Matches[1].ToUpperInvariant()
        $relativePath = $Matches[2].Trim()
        $targetPath = Join-Path $packetRoot $relativePath
        if (-not (Test-Path -LiteralPath $targetPath)) {
            Add-Failure "Hashed file is missing: $relativePath"
            continue
        }
        $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $targetPath).Hash
        if ($actualHash -ne $expectedHash) {
            Add-Failure "SHA-256 mismatch: $relativePath"
        } else {
            Add-Check "SHA-256 OK: $relativePath"
        }
    }
}

$manifestPath = Join-Path $packetRoot '01_MANIFEST.json'
$seedPath = Join-Path $packetRoot '04_SEED_BUNDLE.json'
$schemaPath = Join-Path $packetRoot '05_SEED_SCHEMA.json'

try {
    $manifest = Get-Content -Raw -LiteralPath $manifestPath -Encoding UTF8 | ConvertFrom-Json -Depth 100
    Add-Check '01_MANIFEST.json parsed'
} catch {
    Add-Failure "Manifest parse failed: $($_.Exception.Message)"
}

try {
    $seedRaw = Get-Content -Raw -LiteralPath $seedPath -Encoding UTF8
    $seed = $seedRaw | ConvertFrom-Json -Depth 100
    Add-Check '04_SEED_BUNDLE.json parsed'
} catch {
    Add-Failure "Seed parse failed: $($_.Exception.Message)"
}

try {
    $null = Get-Content -Raw -LiteralPath $schemaPath -Encoding UTF8 | ConvertFrom-Json -Depth 100
    Add-Check '05_SEED_SCHEMA.json parsed'
} catch {
    Add-Failure "Schema parse failed: $($_.Exception.Message)"
}

if ($null -ne $manifest) {
    foreach ($inputFile in $manifest.inputFiles) {
        $inputPath = Join-Path $packetRoot $inputFile.path
        if ($inputFile.required -and -not (Test-Path -LiteralPath $inputPath)) {
            Add-Failure "Required input missing: $($inputFile.path)"
        }
    }
    if ($manifest.executionContract.maximumAuthorizedGate -ne 'G2') {
        Add-Failure 'maximumAuthorizedGate must be G2'
    }
    if ($manifest.executionContract.productionWritesAllowed -or $manifest.executionContract.productionDeploymentAllowed -or $manifest.executionContract.productionConnectionsAllowed) {
        Add-Failure 'Production flags must all be false'
    }
}

if ($null -ne $seed) {
    $expectedCounts = @{flows = 11; operations = 43; eventTemplates = 15}
    foreach ($collectionName in $expectedCounts.Keys) {
        $actualCount = @($seed.$collectionName).Count
        if ($actualCount -ne $expectedCounts[$collectionName]) {
            Add-Failure "$collectionName count is $actualCount; expected $($expectedCounts[$collectionName])"
        } else {
            Add-Check "$collectionName count OK: $actualCount"
        }
        Test-UniqueIds -Items @($seed.$collectionName) -CollectionName $collectionName
    }

    foreach ($otherCollection in @('roles', 'mockUsers', 'demoCases', 'sourceAssets', 'knowledgeDocuments', 'scheduleOccurrences', 'approvals', 'evidence', 'exceptions', 'aiMockResponses')) {
        Test-UniqueIds -Items @($seed.$otherCollection) -CollectionName $otherCollection
    }

    $flowIds = @($seed.flows | ForEach-Object { $_.id })
    $operationIds = @($seed.operations | ForEach-Object { $_.id })
    $eventIds = @($seed.eventTemplates | ForEach-Object { $_.id })
    $roleIds = @($seed.roles | ForEach-Object { $_.id })
    $userIds = @($seed.mockUsers | ForEach-Object { $_.id })
    $caseIds = @($seed.demoCases | ForEach-Object { $_.id })
    $sourceIds = @($seed.sourceAssets | ForEach-Object { $_.id })

    foreach ($operation in $seed.operations) {
        if ($flowIds -notcontains $operation.flowId) {
            Add-Failure "Unknown flowId on operation $($operation.id): $($operation.flowId)"
        }
        if ($null -ne $operation.operationalPriority) {
            Add-Failure "Operation priority must remain null: $($operation.id)"
        }
        if ($operation.priorityFactStatus -ne 'NEEDS_CONFIRMATION') {
            Add-Failure "Operation priorityFactStatus must be NEEDS_CONFIRMATION: $($operation.id)"
        }
    }

    foreach ($eventTemplate in $seed.eventTemplates) {
        if ($eventTemplate.mappingFactStatus -ne 'PROPOSED') {
            Add-Failure "Event mapping must remain PROPOSED: $($eventTemplate.id)"
        }
        foreach ($operationId in $eventTemplate.operationIds) {
            if ($operationIds -notcontains $operationId) {
                Add-Failure "Unknown operation reference on $($eventTemplate.id): $operationId"
            }
        }
    }

    foreach ($mockUser in $seed.mockUsers) {
        foreach ($roleId in $mockUser.roleIds) {
            if ($roleIds -notcontains $roleId) {
                Add-Failure "Unknown role reference on $($mockUser.id): $roleId"
            }
        }
    }

    foreach ($demoCase in $seed.demoCases) {
        if ($eventIds -notcontains $demoCase.eventTemplateId) {
            Add-Failure "Unknown event reference on $($demoCase.id): $($demoCase.eventTemplateId)"
        }
        if ($userIds -notcontains $demoCase.assigneeUserId) {
            Add-Failure "Unknown user reference on $($demoCase.id): $($demoCase.assigneeUserId)"
        }
        foreach ($operationId in $demoCase.operationIds) {
            if ($operationIds -notcontains $operationId) {
                Add-Failure "Unknown operation reference on $($demoCase.id): $operationId"
            }
        }
    }

    foreach ($knowledgeDocument in $seed.knowledgeDocuments) {
        if ($sourceIds -notcontains $knowledgeDocument.sourceAssetId) {
            Add-Failure "Unknown source reference on $($knowledgeDocument.id): $($knowledgeDocument.sourceAssetId)"
        }
    }

    foreach ($approval in $seed.approvals) {
        if ($caseIds -notcontains $approval.caseId -or $userIds -notcontains $approval.requestedFromUserId) {
            Add-Failure "Broken approval reference: $($approval.id)"
        }
    }

    foreach ($emailMatch in [regex]::Matches($seedRaw, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+')) {
        if (-not $emailMatch.Value.EndsWith('@example.invalid')) {
            Add-Failure "Non-placeholder email found: $($emailMatch.Value)"
        }
    }

    foreach ($urlMatch in [regex]::Matches($seedRaw, 'https://[^"\s]+')) {
        try {
            $uri = [uri]$urlMatch.Value
            if (-not $uri.Host.EndsWith('example.invalid')) {
                Add-Failure "Non-placeholder URL found: $($urlMatch.Value)"
            }
        } catch {
            Add-Failure "Invalid URL found: $($urlMatch.Value)"
        }
    }

    foreach ($secretPattern in @('AKIA[0-9A-Z]{16}', 'AIza[0-9A-Za-z_-]{20,}', 'xox[baprs]-[0-9A-Za-z-]+', 'ghp_[0-9A-Za-z]{20,}', '-----BEGIN [A-Z ]*PRIVATE KEY-----')) {
        if ($seedRaw -match $secretPattern) {
            Add-Failure "Secret-like value matches pattern: $secretPattern"
        }
    }
}

$result = [pscustomobject]@{
    Status = if ($failures.Count -eq 0) { 'PASS' } else { 'FAIL' }
    Checks = $checks.Count
    Failures = $failures.Count
    FailureMessages = @($failures)
}

$result | ConvertTo-Json -Depth 10
if ($failures.Count -gt 0) {
    exit 1
}
exit 0
