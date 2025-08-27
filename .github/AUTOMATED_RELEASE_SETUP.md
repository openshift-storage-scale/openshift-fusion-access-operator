# Automated Release Workflow Setup

This document describes the setup required for the automated release GitHub Action workflow (`automated-release.yaml`).

## Overview

The workflow automates steps 4, 5, and 6 of the release process:
- **Step 4**: Run `konflux-release.sh` to build and push images
- **Step 5**: Create and push git tag for the release
- **Step 6**: Create a PR for the released bundle

## Triggers

The workflow triggers automatically when:
1. A push to the `v1` branch modifies `VERSION.txt`
2. Manual dispatch via GitHub UI with optional commit SHA

## Required GitHub Secrets

The following secrets must be configured in the repository settings:

### Konflux/OpenShift Access
- **`KONFLUX_TOKEN`**: OpenShift authentication token for Konflux cluster
  - Obtain from: https://oauth-openshift.apps.stone-prd-rh01.pg1f.p1.openshiftapps.com/oauth/token/display
  - Must have access to the `storage-scale-releng-tenant` project
  
- **`KONFLUX_SERVER`**: OpenShift server URL for Konflux
  - Default: `https://api.stone-prd-rh01.pg1f.p1.openshiftapps.com:6443`

### Container Registry Access
- **`QUAY_USERNAME`**: Quay.io username with push access to `quay.io/openshift-storage-scale`
- **`QUAY_PASSWORD`**: Quay.io password or robot token

### GitHub Access
- **`GITHUB_TOKEN`**: Automatically provided by GitHub Actions (no setup needed)
  - Used for creating PRs and managing git operations

## Required Permissions

### Repository Permissions
The workflow needs the following repository permissions:
- **Contents**: `write` (for creating tags and commits)
- **Pull Requests**: `write` (for creating PRs)
- **Actions**: `write` (for workflow execution)

### External Access Requirements
1. **Konflux Cluster Access**: 
   - Valid service account or user token
   - Access to `storage-scale-releng-tenant` project
   - Read access to snapshots and components

2. **Quay.io Registry Access**:
   - Push permissions to `quay.io/openshift-storage-scale/*` repositories
   - Access to the following image repositories:
     - `openshift-fusion-access-bundle`
     - `openshift-fusion-access-catalog`
     - `console-plugin-rhel9`
     - `controller-rhel9-operator`
     - `devicefinder-rhel9`

## Setup Instructions

### 1. Configure GitHub Secrets

In your repository settings:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the required secrets listed above
3. Ensure the `GITHUB_TOKEN` has appropriate permissions (usually automatic)

### 2. Konflux Authentication Setup

1. Log in to Konflux cluster:
   ```bash
   oc login https://oauth-openshift.apps.stone-prd-rh01.pg1f.p1.openshiftapps.com/oauth/token/display
   ```

2. Get your token:
   ```bash
   oc whoami -t
   ```

3. Add this token as `KONFLUX_TOKEN` secret in GitHub

### 3. Quay.io Setup

1. Create a robot account or use personal credentials
2. Ensure push access to `quay.io/openshift-storage-scale`
3. Add credentials as `QUAY_USERNAME` and `QUAY_PASSWORD` secrets

### 4. Test the Workflow

1. **Manual Test**: Use the workflow dispatch with a known good commit SHA
2. **Automatic Test**: Make a change to `VERSION.txt` on the `v1` branch

## Workflow Behavior

### Automatic Execution
- Triggers when `VERSION.txt` changes on `v1` branch
- Attempts to auto-detect the latest Konflux commit
- Creates tag, builds images, and generates PR

### Manual Execution
- Allows specifying exact commit SHA
- Can force execution even without `VERSION.txt` changes
- Useful for re-running failed releases or testing

### Error Handling
- Validates all prerequisites before starting
- Provides clear error messages and manual fallback commands
- Creates detailed summary of completed and remaining steps

## Troubleshooting

### Common Issues

1. **Konflux Authentication Failure**
   - Verify `KONFLUX_TOKEN` is valid and not expired
   - Check project access: `oc project storage-scale-releng-tenant`

2. **Quay.io Push Failures**
   - Verify credentials and repository permissions
   - Check if repositories exist and are accessible

3. **Missing Snapshots**
   - Ensure the specified commit SHA has corresponding Konflux snapshots
   - Check that the commit is from a merged Konflux PR

4. **Bundle Generation Failures**
   - Verify all required images are available
   - Check that the Makefile targets work locally

### Manual Fallback
If the workflow fails, you can run the release manually:
```bash
./scripts/konflux-release.sh <commit-sha>
git tag v<version> <commit-sha>
git push origin v<version>
# Then create PR manually for released-bundles/<version>/
```

## Security Considerations

1. **Token Management**: Rotate tokens regularly and use robot accounts where possible
2. **Access Control**: Limit workflow permissions to minimum required
3. **Secret Visibility**: Secrets are masked in logs but avoid logging sensitive data
4. **Branch Protection**: Consider requiring PR reviews even for automated bundle PRs

## Future Improvements

- Add slack notifications for release status
- Implement automatic testing before promoting to stable
- Add rollback capabilities for failed releases
- Integrate with existing CI/CD pipelines
