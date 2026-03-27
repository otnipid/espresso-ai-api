# 📧 Email Notification Setup Guide

This guide explains how to configure email notifications for the CI/CD pipeline using Gmail SMTP.

## 📋 Prerequisites

- Gmail account for sending notifications
- Recipient email address for receiving notifications
- GitHub repository with admin access

## 🔧 Gmail Configuration

### Option 1: Use App Password (Recommended)

1. **Enable 2-Factor Authentication**
   - Go to [Google Account settings](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" for app
   - Select "Other (Custom name)" for device
   - Enter "GitHub Actions" as the name
   - Click "Generate"
   - Copy the 16-character password

3. **Store App Password Securely**
   - Save the password in your password manager
   - This password will be used as `EMAIL_PASSWORD`

### Option 2: Use Google Workspace SMTP

If using Google Workspace:
- Use your workspace email address
- Generate app password through workspace admin settings
- Configure SMTP settings accordingly

## 🔑 GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

### Required Secrets

| Secret Name | Secret | Description | Required For |
|-------------|--------|-------------|--------------|
| `GITHUB_TOKEN` | GitHub access token | All workflows | 
| `EMAIL_USERNAME` | Email address for notifications | All workflows | 
| `EMAIL_PASSWORD` | Email password or app password | All workflows | 
| `NOTIFICATION_EMAIL` | Recipient email address | All workflows | 
| `DOCKER_USERNAME` | Docker Hub username | Release | 
| `DOCKER_PASSWORD` | Docker Hub password | Release | 
| `SEMGREP_APP_TOKEN` | Semgrep security scanning token | CI, Dependencies | 
| `DEPLOYMENT_API_TOKEN` | Deployment API access | Deploy | 
| `METRICS_API_TOKEN` | Metrics dashboard access | Quality | 

### Setup Steps

1. **Navigate to Repository Settings**
   - Go to your GitHub repository
   - Click "Settings" tab
   - Click "Secrets and variables" → "Actions"

2. **Add Repository Secrets**
   - Click "New repository secret"
   - Add each secret from the table above

3. **Example Values**
   ```
   EMAIL_USERNAME: your-email@gmail.com
   EMAIL_PASSWORD: xxxx xxxx xxxx xxxx  (16-char app password)
   NOTIFICATION_EMAIL: dev-team@yourcompany.com
   ```

## 📧 Email Templates

The workflows send different types of notifications:

### 1. **CI Pipeline Notifications**
- **Subject**: ✅ CI Pipeline passed / ❌ CI Pipeline failed
- **Content**: Test results, coverage, build status
- **Trigger**: Push to main/develop, Pull requests

### 2. **Deployment Notifications**
- **Subject**: 🚀 Staging Deployment / 🚀 PRODUCTION DEPLOYMENT
- **Content**: Deployment status, environment URL, commit info
- **Trigger**: Successful deployments

### 3. **Quality Gate Notifications**
- **Subject**: ✅ Quality Gates / ❌ Quality Gates
- **Content**: Coverage, performance, security results
- **Trigger**: Quality gate evaluations

### 4. **Release Notifications**
- **Subject**: 🎉 Release Deployed / ✅ Release Complete
- **Content**: Version info, release notes, deployment status
- **Trigger**: Tag-based releases

### 5. **Rollback Notifications**
- **Subject**: 🔄 ROLLBACK
- **Content**: Rollback reason, environment affected
- **Trigger**: Deployment failures

## 🛠️ Alternative Email Providers

If you prefer not to use Gmail, you can configure other SMTP providers:

### Outlook/Office 365
```yaml
server_address: smtp.office365.com
server_port: 587
username: ${{ secrets.EMAIL_USERNAME }}
password: ${{ secrets.EMAIL_PASSWORD }}
```

### SendGrid
```yaml
server_address: smtp.sendgrid.net
server_port: 587
username: apikey
password: ${{ secrets.SENDGRID_API_KEY }}
```

### Amazon SES
```yaml
server_address: email-smtp.us-east-1.amazonaws.com
server_port: 587
username: ${{ secrets.AWS_SES_USERNAME }}
password: ${{ secrets.AWS_SES_PASSWORD }}
```

## 🔍 Testing Email Configuration

### Test with Manual Workflow Run

1. **Trigger Workflow Manually**
   - Go to "Actions" tab
   - Select any workflow
   - Click "Run workflow"

2. **Check Email Receipt**
   - Verify email arrives at `NOTIFICATION_EMAIL`
   - Check spam folder if not received
   - Verify email content and formatting

### Test with Debug Workflow

Create a test workflow to verify email setup:

```yaml
name: Test Email Notifications

on:
  workflow_dispatch:

jobs:
  test-email:
    runs-on: ubuntu-latest
    steps:
      - name: Send test email
        uses: dawidd6/action-send-mail@v3
        with:
          server_address: smtp.gmail.com
          server_port: 587
          username: ${{ secrets.EMAIL_USERNAME }}
          password: ${{ secrets.EMAIL_PASSWORD }}
          subject: "🧪 Test Email: GitHub Actions"
          to: ${{ secrets.NOTIFICATION_EMAIL }}
          from: "GitHub Actions <${{ secrets.EMAIL_USERNAME }}>"
          body: |
            🧪 **Test Email**
            
            This is a test email from GitHub Actions.
            
            If you receive this, email notifications are working correctly!
            
            Repository: ${{ github.repository }}
            Workflow: Test Email Notifications
            Timestamp: ${{ github.event.head_commit.timestamp }}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. **Authentication Failed**
**Error**: "535-5.7.8 Username and Password not accepted"
**Solution**: 
- Enable 2-factor authentication on Gmail
- Generate new app password
- Ensure no spaces in app password

#### 2. **Email Not Received**
**Solution**:
- Check spam/junk folder
- Verify recipient email address
- Check GitHub Actions logs for errors
- Ensure SMTP settings are correct

#### 3. **Rate Limiting**
**Error**: "Too many login attempts"
**Solution**:
- Wait a few minutes before retrying
- Use app password instead of regular password
- Check for suspicious activity in Gmail

#### 4. **SSL/TLS Issues**
**Solution**:
- Use port 587 with STARTTLS
- Ensure firewall allows SMTP traffic
- Check DNS resolution for SMTP server

### Debug Steps

1. **Check Workflow Logs**
   - Go to Actions tab
   - Click on failed workflow run
   - Review email notification step logs

2. **Verify Secrets**
   - Ensure all secrets are correctly named
   - Check for typos in secret values
   - Verify no extra spaces or characters

3. **Test SMTP Connection**
   ```bash
   # Test SMTP connection manually
   telnet smtp.gmail.com 587
   # Should connect successfully
   ```

## 📊 Email Notification Examples

### Success Notification Example
```
Subject: 🚀 PRODUCTION DEPLOYMENT: espresso-ml/backend

🚀 **PRODUCTION DEPLOYMENT SUCCESSFUL**

Repository: your-org/espresso-ml
Commit: abc123def456
Branch: main
Environment: Production
URL: https://api.espresso-ml.com

Production deployment completed successfully and all smoke tests passed.

View details: https://github.com/your-org/espresso-ml/actions/runs/123456789
```

### Failure Notification Example
```
Subject: ❌ Quality Gates: espresso-ml/backend

❌ **Quality Gates Results**

Repository: your-org/espresso-ml
Commit: abc123def456
Branch: main
Overall Status: FAIL

Quality Gate Results:
- Code Coverage: FAIL
- Performance: PASS
- Code Style: PASS
- Documentation: PASS

View details: https://github.com/your-org/espresso-ml/actions/runs/123456789
```

## 🔒 Security Considerations

### Best Practices

1. **Use App Passwords**
   - Never use your main Gmail password
   - Generate unique app passwords for each service
   - Rotate app passwords regularly

2. **Secure Secret Management**
   - Use GitHub repository secrets
   - Never commit credentials to code
   - Limit secret access to necessary workflows

3. **Monitor Email Access**
   - Check Gmail security dashboard regularly
   - Review connected apps and devices
   - Enable security alerts

4. **Email Filtering**
   - Set up filters for GitHub notifications
   - Create dedicated folders for CI/CD emails
   - Configure auto-forwarding if needed

## 📱 Mobile Notifications

### Forward to Mobile
- Set up email forwarding to mobile
- Use Gmail app with notifications enabled
- Configure filters for urgent notifications

### Integration with Other Tools
- Forward to Slack using email integration
- Use Zapier or IFTTT for custom workflows
- Integrate with project management tools

## 📞 Support

For email notification issues:

1. **Check Documentation**: Review this guide thoroughly
2. **Test Configuration**: Use the test workflow provided
3. **Review Logs**: Check GitHub Actions logs for errors
4. **Contact Team**: Create issue with detailed information

### Required Information for Support

- GitHub repository name
- Workflow name and run ID
- Error messages from logs
- Email provider and settings
- Steps already tried

---

**Last Updated**: $(date +%Y-%m-%d)
**Version**: 1.0.0
**Maintainers**: DevOps Team
