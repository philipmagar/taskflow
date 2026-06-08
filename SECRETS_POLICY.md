# Secrets Management & Rotation Policy

## Overview
This document outlines the strategy, storage, usage, and rotation policies for secrets within the TaskFlow API project. Adhering to these guidelines ensures we do not leak sensitive credentials, API keys, or database passwords in our source code.

## 1. Local Development
- **No hardcoded secrets**: Never commit real database passwords, JWT keys, or API tokens to version control.
- **`.env.example`**: Always keep the `.env.example` file updated with any new variables your features require. Use dummy/placeholder values.
- **`.env` files**: `.env`, `.env.development`, `.env.production`, and `.env.test` are properly ignored by `.gitignore` to prevent accidental commits.

## 2. CI/CD Pipeline (GitHub Actions)
Our Continuous Integration (CI) and Continuous Deployment (CD) pipelines use GitHub Actions.
- In `ci.yml`, local test secrets are defined directly in the workflow file. These secrets are exclusively for the isolated GitHub Actions runner environment and do not grant access to external or production services.
- In `cd.yml`, sensitive credentials required for deployment to the VPS are stored securely in **GitHub Secrets**. These include:
  - `VPS_HOST`: The IP address or hostname of the target VPS.
  - `VPS_USER`: The SSH username for the VPS.
  - `VPS_SSH_KEY`: The private SSH key allowing access to the VPS.

These production secrets must never be exported, printed in pipeline logs, or sent over unencrypted channels.

## 3. Secret Rotation Process
Regular rotation of secrets limits the impact of potential exposure.

### 3.1. Database Passwords
1. **Generate** a new strong password using a secure password generator (at least 20 characters with mixed case, numbers, and symbols).
2. **Apply** the new password to the database user in the production database.
3. **Update** the `DB_PASSWORD` (and `MYSQL_ROOT_PASSWORD` if applicable) in the `.env.production` file on the VPS.
4. **Restart** the PM2 application or Docker containers to apply the new credentials.
5. **Frequency**: Rotate every 90 days or immediately if a compromise is suspected.

### 3.2. JWT Secret (`JWT_SECRET`)
1. **Generate** a new 64-character hexadecimal string or a long, cryptographically secure random value.
2. **Update** the `JWT_SECRET` in the `.env.production` file on the VPS.
3. **Restart** the backend application. *Note: Rotating the JWT secret will invalidate all current user sessions, requiring all users to log in again. Schedule this during a maintenance window if possible.*
4. **Frequency**: Rotate every 180 days or immediately if a compromise is suspected.

### 3.3. CI/CD SSH Keys (`VPS_SSH_KEY`)
1. **Generate** a new SSH key pair on a secure, trusted machine: `ssh-keygen -t ed25519 -C "github-actions-deploy"`
2. **Add** the new public key to `~/.ssh/authorized_keys` on the VPS.
3. **Update** the `VPS_SSH_KEY` in the repository's GitHub Secrets with the new private key.
4. **Verify** the deployment pipeline works using the new key.
5. **Remove** the old public key from the VPS `authorized_keys` file.
6. **Frequency**: Rotate every 180 days, or immediately if a developer with access leaves the project or if a compromise is suspected.

## 4. Incident Response
If a secret is ever accidentally committed or exposed:
1. **Consider it compromised immediately.**
2. Rotate the compromised secret across all affected environments as outlined above without delay.
3. If committed to Git, use tools like BFG Repo-Cleaner or `git filter-repo` to scrub the secret from the commit history, and force-push the changes (coordinate with the team).
4. Review application and database logs to verify if the compromised secret was abused.
