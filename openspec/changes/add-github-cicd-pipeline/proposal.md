# Change: Add GitHub CI/CD Pipeline for Backend Deployment

## Why
The backend currently lacks automated CI/CD infrastructure. According to Dokploy best practices, building Docker images directly on the production server consumes significant resources, potentially causing timeouts and application downtime. A GitHub Actions-based pipeline enables:
- Building Docker images in CI (offloads work from production)
- Automated testing before deployment
- Consistent, reproducible deployments
- Zero-downtime rollouts with health check validation

## What Changes
- Add GitHub Actions workflow for CI/CD (`build.yml`)
- Configure Docker image builds with multi-platform support
- Implement automated tests and linting in pipeline
- Add Docker Hub (or GHCR) integration for image publishing
- Configure automatic deployment triggers to Dokploy via webhook
- Fix Dockerfile issues:
  - Remove redundant `npm ci --only=production` in production stage (already has node_modules from builder)
  - Use Alpine-slim variant for smaller production image
  - Optimize layer caching

## Impact
- Affected specs: New `deployment` capability
- Affected code:
  - `infinite-stories-backend/Dockerfile` (optimizations)
  - `.github/workflows/backend-build.yml` (new)
  - `.github/workflows/backend-deploy.yml` (new)
