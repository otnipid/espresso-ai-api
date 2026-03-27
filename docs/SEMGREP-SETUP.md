# 🔍 Semgrep Security Scanning Setup Guide

This guide explains how to configure Semgrep for automated security scanning in the CI/CD pipeline.

## 📋 What is Semgrep?

Semgrep is a static analysis tool for finding bugs, security vulnerabilities, and anti-patterns in your code. It's designed to be fast, easy to use, and produce actionable results.

## 🚀 Benefits of Semgrep over Snyk

| Feature | Semgrep | Snyk |
|----------|-----------|--------|
| **Open Source** | ✅ Full open source | ❌ Limited free tier |
| **Custom Rules** | ✅ Easy to write custom rules | ❌ Limited customization |
| **Performance** | ✅ Fast scanning | ⚠️ Slower scans |
| **Integration** | ✅ Native GitHub Actions | ⚠️ External service |
| **Cost** | ✅ Free for open source | 💰 Paid for full features |
| **False Positives** | ✅ Lower rate | ⚠️ Higher rate |

## 🔧 Semgrep Configuration

### Rules Configured in CI/CD

The workflows use these Semgrep rule sets:

```yaml
config: >-
  p/security-audit      # Security audit findings
  p/owasp-top-ten     # OWASP Top 10 vulnerabilities
  p/cwe-top-25        # CWE Top 25 weaknesses
  p/secrets             # Hardcoded secrets detection
  p/nodejs              # Node.js specific issues
  p/typescript           # TypeScript specific issues
```

### Rule Categories Explained

1. **`p/security-audit`**
   - Detects common security issues
   - SQL injection, XSS, CSRF patterns
   - Authentication and authorization flaws

2. **`p/owasp-top-ten`**
   - OWASP Top 10 security risks
   - Injection, broken authentication, sensitive data exposure

3. **`p/cwe-top-25`**
   - CWE/SANS Top 25 dangerous programming errors
   - Buffer overflows, race conditions, improper input validation

4. **`p/secrets`**
   - Hardcoded secrets and credentials
   - API keys, passwords, tokens in code

5. **`p/nodejs`**
   - Node.js specific security issues
   - Unsafe eval, prototype pollution, dependency issues

6. **`p/typescript`**
   - TypeScript specific issues
   - Type safety, unsafe any usage

## 🔑 Setup Instructions

### 1. Create Semgrep Account

1. **Sign up** at [semgrep.dev](https://semgrep.dev)
2. **Choose plan**: Free tier is sufficient for most projects
3. **Verify email** to activate account

### 2. Generate API Token

1. **Login** to Semgrep dashboard
2. **Go to Settings** → API Tokens
3. **Create new token**:
   - Name: `GitHub Actions CI/CD`
   - Permissions: Read access
   - Scope: Repository scanning
4. **Copy token** securely

### 3. Configure GitHub Secret

Add the token to your GitHub repository:

1. **Navigate** to repository → Settings → Secrets and variables → Actions
2. **Click** "New repository secret"
3. **Add secret**:
   ```
   Name: SEMGREP_APP_TOKEN
   Value: your-semgrep-token-here
   ```

### 4. Verify Setup

Test the configuration by running the CI workflow:

```bash
# Push a change to trigger CI
git commit --allow-empty -m "test: trigger CI for semgrep setup"
git push origin main
```

## 📊 Semgrep Results

### Finding Categories

| Severity | Description | Example |
|-----------|-------------|---------|
| **ERROR** | Critical security issues | SQL injection, hardcoded secrets |
| **WARNING** | Potential issues | Unsafe eval, weak crypto |
| **INFO** | Best practice violations | Missing input validation |

### Result Format

Semgrep outputs findings in this format:

```json
{
  "results": [
    {
      "check_id": "insecure-random",
      "path": "src/utils/crypto.ts",
      "start": {"line": 15, "col": 5},
      "end": {"line": 15, "col": 25},
      "message": "Use of insecure random number generator",
      "severity": "ERROR",
      "metadata": {
        "owasp": ["A02:2021"],
        "cwe": ["CWE-338"]
      }
    }
  ]
}
```

## 🛠️ Custom Rules

### Creating Custom Rules

Create `.semgrep/rules` directory for custom rules:

```yaml
# .semgrep/rules/espresso-ml.yml
rules:
  - id: espresso-ml-sql-injection
    pattern: |
      $QUERY.$METHOD($INPUT)
    languages: [typescript, javascript]
    message: Possible SQL injection vulnerability
    severity: ERROR
    metadata:
      owasp: ["A03:2021 - Injection"]
      cwe: ["CWE-89"]
```

### Testing Custom Rules

```bash
# Test rules locally
semgrep --config=.semgrep/rules/espresso-ml.yml src/

# Test on specific file
semgrep --config=.semgrep/rules/espresso-ml.yml src/database/query.ts
```

## 🔧 Advanced Configuration

### Ignore Files and Patterns

Create `.semgrepignore` file:

```
# Ignore test files
**/*.test.ts
**/*.spec.ts

# Ignore generated files
dist/
node_modules/

# Ignore specific patterns
*.min.js
*.bundle.js
```

### Configuration File

Create `.semgrep.yml` for project-specific settings:

```yaml
# .semgrep.yml
rules:
  - id: no-hardcoded-secrets
    pattern: |
      $KEY = "$SECRET"
    languages: [typescript, javascript]
    message: Hardcoded secret detected
    severity: ERROR
    metadata:
      category: security

paths:
  include:
    - "src/**/*.ts"
    - "src/**/*.js"
  exclude:
    - "src/**/*.test.ts"
    - "src/**/*.spec.ts"
    - "dist/**"
```

## 📈 Integration with CI/CD

### Workflow Integration

The CI workflow automatically:

1. **Runs Semgrep** on every push and PR
2. **Uploads results** as workflow artifacts
3. **Fails build** on ERROR severity findings
4. **Reports findings** in workflow logs

### Artifact Locations

Semgrep results are saved as:
- `semgrep-results.json` - Machine-readable results
- `semgrep-report.sarif` - GitHub Security tab format
- `semgrep-findings.txt` - Human-readable summary

### GitHub Security Tab Integration

Results automatically appear in:
- **Security** tab of your GitHub repository
- **Pull Request** security checks
- **Code scanning alerts**

## 🔍 Troubleshooting

### Common Issues

#### 1. **Authentication Failed**
**Error**: `SEMGREP_APP_TOKEN not valid`
**Solution**:
- Verify token is correctly copied
- Check token hasn't expired
- Ensure secret name is exactly `SEMGREP_APP_TOKEN`

#### 2. **No Results Found**
**Issue**: Semgrep runs but finds no issues
**Solutions**:
- Check if rules are appropriate for your codebase
- Verify file paths are included
- Test with broader rule sets

#### 3. **Too Many False Positives**
**Issue**: Many irrelevant findings
**Solutions**:
- Add patterns to `.semgrepignore`
- Create custom rules for your specific patterns
- Adjust rule severity levels

#### 4. **Performance Issues**
**Issue**: Scanning is too slow
**Solutions**:
- Exclude large directories (node_modules, dist)
- Use more specific patterns
- Limit file types scanned

### Debug Mode

Run Semgrep locally with debug output:

```bash
# Debug mode with verbose output
semgrep --config=auto --verbose --debug src/

# Test specific rule
semgrep --config=p/security-audit --verbose src/

# Dry run to see what would be scanned
semgrep --config=auto --dry-run src/
```

## 📊 Best Practices

### 1. **Rule Management**
- Start with built-in rules before creating custom ones
- Test custom rules thoroughly before adding to CI
- Keep rules focused and actionable

### 2. **Performance Optimization**
- Use `.semgrepignore` to exclude irrelevant files
- Limit scans to source code directories
- Consider incremental scanning for large codebases

### 3. **Integration**
- Monitor results regularly
- Set up alerts for high-severity findings
- Integrate with your security workflow

### 4. **Team Collaboration**
- Share custom rules across projects
- Document rule decisions and rationale
- Review findings in team meetings

## 🔄 Migration from Snyk

### Export Snyk Findings
If you have existing Snyk findings:

```bash
# Export Snyk results (if available)
snyk monitor --json > snyk-findings.json
```

### Compare Results
Compare Snyk and Semgrep findings:

| Aspect | Snyk | Semgrep |
|---------|--------|----------|
| **Dependency Scanning** | ✅ Strong | ❌ Limited |
| **Code Analysis** | ⚠️ Basic | ✅ Comprehensive |
| **Custom Rules** | ❌ Limited | ✅ Full control |
| **False Positives** | ⚠️ Higher | ✅ Lower |
| **Speed** | ⚠️ Slower | ✅ Faster |

### Gradual Migration
1. **Run both tools** in parallel for comparison
2. **Analyze differences** in findings
3. **Adjust rules** based on your needs
4. **Phase out Snyk** once confident in Semgrep

## 📞 Support and Resources

### Documentation
- [Semgrep Documentation](https://semgrep.dev/docs)
- [Rule Writing Guide](https://semgrep.dev/docs/writing-rules)
- [GitHub Actions Integration](https://semgrep.dev/docs/integrations/github-actions)

### Community
- [Semgrep Slack Community](https://join.slack.com/t/semgrep)
- [GitHub Discussions](https://github.com/returntocorp/semgrep/discussions)
- [Rule Registry](https://semgrep.dev/explore)

### Getting Help

For Semgrep setup issues:

1. **Check Documentation**: Review this guide and Semgrep docs
2. **Test Locally**: Run Semgrep locally before CI
3. **Review Logs**: Check GitHub Actions logs for errors
4. **Community Support**: Ask for help in discussions

---

**Last Updated**: $(date +%Y-%m-%d)
**Version**: 1.0.0
**Maintainers**: DevOps Team
