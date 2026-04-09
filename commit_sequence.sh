#!/bin/bash
set -e

git add .gitignore frontend/package.json frontend/package-lock.json frontend/tsconfig.json frontend/eslint.config.mjs frontend/next-env.d.ts frontend/public || true
git commit -m "feat: initialize ReliefMesh project" || true

git add contracts/victim-registry || true
git commit -m "feat: victim registry contract with ZK identity" || true

git add contracts/shopkeeper-registry || true
git commit -m "feat: shopkeeper registry with daily limits" || true

git add contracts/clawback-controller || true
git commit -m "feat: clawback controller for corruption prevention" || true

git add contracts/relief-pool contracts/Cargo.toml || true
git commit -m "feat: relief pool with batch distribution" || true

git add .github/workflows || true
git commit -m "feat: CI/CD pipeline with GitHub Actions" || true

git add frontend/context/WalletContext.tsx frontend/app/layout.tsx || true
git commit -m "feat: wallet connection Freighter and Albedo" || true

git add frontend/app/page.tsx || true
git commit -m "feat: luxury dark landing page with neural visual" || true

git add frontend/components/ui/WalletConnect.tsx || true
git commit -m "feat: wallet connect modal premium design" || true

git add frontend/app/dashboard/page.tsx frontend/app/dashboard/layout.tsx || true
git commit -m "feat: charity dashboard with live feed" || true

git add frontend/app/dashboard/distribute/page.tsx || true
git commit -m "feat: aid distribution single and batch" || true

git add frontend/app/dashboard/victims/page.tsx || true
git commit -m "feat: victim registry page ZK privacy" || true

git add frontend/app/dashboard/shopkeepers/page.tsx || true
git commit -m "feat: shopkeeper network management" || true

git add frontend/app/dashboard/clawback/page.tsx || true
git commit -m "feat: clawback controller page" || true

git add frontend/app/globals.css || true
git commit -m "feat: mobile responsive all pages" || true

git add docs/architecture.md || true
git commit -m "docs: architecture documentation" || true

git add frontend/.env.local frontend/vercel.json frontend/next.config.ts || true
git commit -m "chore: env config and production setup" || true

git add . || true
git commit --amend --no-edit || true

git push origin main || echo "Failed to push to origin main"
