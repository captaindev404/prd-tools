# Tasks: Add GitHub CI/CD Pipeline

## 1. Fix Dockerfile Issues
- [ ] 1.1 Remove redundant `npm ci --only=production` in production stage (line 50-51)
- [ ] 1.2 Keep optimized node_modules copy from builder stage
- [ ] 1.3 Verify health check endpoint path (`/api/health`)
- [ ] 1.4 Test local Docker build works correctly

## 2. Create GitHub Actions CI Workflow
- [ ] 2.1 Create `.github/workflows/backend-build.yml`
- [ ] 2.2 Configure triggers (push, pull_request for main branch)
- [ ] 2.3 Add Node.js setup step with caching
- [ ] 2.4 Add lint step (`npm run lint`)
- [ ] 2.5 Add type check step (`npx tsc --noEmit`)
- [ ] 2.6 Add Docker buildx setup
- [ ] 2.7 Add GHCR authentication
- [ ] 2.8 Add Docker build and push step (main branch only)
- [ ] 2.9 Configure image tagging (sha, latest, version)

## 3. Create GitHub Actions CD Workflow
- [ ] 3.1 Create `.github/workflows/backend-deploy.yml`
- [ ] 3.2 Configure trigger (workflow_run after build succeeds on main)
- [ ] 3.3 Add Dokploy webhook trigger step
- [ ] 3.4 Add health check verification step
- [ ] 3.5 Add deployment status notification

## 4. Configure Repository Settings
- [ ] 4.1 Document required secrets (`DOKPLOY_WEBHOOK_URL`)
- [ ] 4.2 Update DOKPLOY_DEPLOYMENT.md with CI/CD section
- [ ] 4.3 Add workflow status badges to README

## 5. Validation
- [ ] 5.1 Test CI workflow on feature branch
- [ ] 5.2 Verify Docker image pushed to GHCR
- [ ] 5.3 Test deployment trigger to Dokploy
- [ ] 5.4 Verify health check passes post-deployment
