## Context
The InfiniteStories backend is a Next.js 16 application deployed on Dokploy. Currently, there is no CI/CD pipeline, and the Dockerfile has some inefficiencies. Dokploy documentation recommends building images in CI/CD rather than on production servers to prevent resource exhaustion.

Key stakeholders:
- Development team (push-to-deploy workflow)
- Dokploy infrastructure (receives pre-built images)

## Goals / Non-Goals

**Goals:**
- Automated Docker image builds on every push to main
- Automated tests and linting in CI before deployment
- Zero-downtime deployments with health check validation
- Image caching for faster builds
- Multi-environment support (staging/production)

**Non-Goals:**
- Blue-green deployment (use Dokploy's built-in rollback instead)
- Self-hosted runners (use GitHub-hosted for simplicity)
- Kubernetes orchestration (Dokploy handles container orchestration)

## Decisions

### Decision 1: Use GitHub Actions (not GitLab CI, CircleCI, etc.)
**Rationale:** Repository is on GitHub, native integration, generous free tier for public repos, excellent Docker/container support.

### Decision 2: Use GitHub Container Registry (GHCR) instead of Docker Hub
**Rationale:**
- Native GitHub integration (no additional credentials)
- Package visibility linked to repository permissions
- No rate limiting concerns for authenticated pulls
- Free for public repositories

### Decision 3: Two-workflow approach (build vs deploy)
**Rationale:**
- `backend-build.yml`: Runs on every PR/push - builds, tests, lints
- `backend-deploy.yml`: Runs on main branch only - deploys to Dokploy
- Separation allows faster PR feedback (no deploy steps)

### Decision 4: Use Dokploy webhook for deployment trigger
**Rationale:** Per Dokploy documentation, external registries should trigger deployment via API call. This provides:
- Atomic deployment triggers
- Audit trail in GitHub Actions logs
- Retry capability on failure

### Decision 5: Optimize Dockerfile for CI builds
**Rationale:** Current Dockerfile has redundant steps:
- Line 50: `npm ci --only=production` is redundant since node_modules is copied from builder (line 56)
- Use buildx for multi-platform builds (arm64 + amd64)
- Enable BuildKit cache mounts for faster npm installs

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   GitHub Repo    │────▶│  GitHub Actions  │────▶│      GHCR        │
│   (push/PR)      │     │  (build/test)    │     │  (image store)   │
└──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                           │
                                                           ▼
                         ┌──────────────────┐     ┌──────────────────┐
                         │     Dokploy      │◀────│  Webhook/API     │
                         │  (deployment)    │     │  (deploy trigger)│
                         └──────────────────┘     └──────────────────┘
```

## Workflow Details

### backend-build.yml (CI)
- **Trigger:** Push to any branch, PR to main
- **Steps:**
  1. Checkout code
  2. Setup Node.js (from .nvmrc)
  3. Install dependencies (cached)
  4. Run linter (`npm run lint`)
  5. Run type check (`npx tsc --noEmit`)
  6. Build Docker image (for validation)
  7. Push to GHCR (only on main branch)

### backend-deploy.yml (CD)
- **Trigger:** Push to main (after build completes)
- **Steps:**
  1. Wait for build workflow to complete
  2. Call Dokploy webhook/API to trigger deployment
  3. Wait for health check to pass
  4. Post deployment status to commit

## Secrets Required
- `DOKPLOY_WEBHOOK_URL` - Dokploy webhook endpoint
- `DOKPLOY_API_KEY` - API authentication (if required)

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| GitHub Actions outage blocks deploys | Can manually trigger Dokploy redeploy from dashboard |
| GHCR rate limiting | Authenticated pulls have high limits; add caching |
| Long build times | BuildKit caching, layer optimization |
| Dockerfile issues blocking builds | CI runs on PR before merge, catches issues early |

## Migration Plan

1. Create `.github/workflows/` directory structure
2. Add `backend-build.yml` workflow
3. Add `backend-deploy.yml` workflow
4. Configure GitHub repository secrets
5. Configure Dokploy to pull from GHCR
6. Update Dokploy webhook settings
7. Test end-to-end with a non-critical change
8. Enable branch protection requiring CI pass

## Rollback
- Dokploy maintains deployment history
- Previous images tagged in GHCR
- `workflow_dispatch` allows manual redeploy of specific tag

## Open Questions
- [ ] Confirm Dokploy API endpoint format for deployment trigger
- [ ] Determine if staging environment is needed
