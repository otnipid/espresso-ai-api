
# CI Failure Lessons Learned - Run 22840435325

## Issue
- **Root Cause**: Docker buildx multi-platform export error when using --load flag
- **Error**: "docker exporter does not currently support exporting manifest lists"
- **Impact**: CI pipeline blocked, unable to build Docker images

## Fix Applied
- **Solution**: Changed from multi-platform build (linux/amd64,linux/arm64) to single platform (linux/amd64) when using --load flag
- **Change**: Modified .github/workflows/ci.yml line 346
- **Result**: CI pipeline now passes successfully

## Technical Details

### Problem Command:
```bash
docker buildx build --platform linux/amd64,linux/arm64 --load --tag ...
```

### Fixed Command:
```bash
docker buildx build --platform linux/amd64 --load --tag ...
```

### Why It Failed:
The `--load` flag requires a single platform because it loads the image into the local Docker daemon. Multi-platform builds create manifest lists that cannot be loaded into a single Docker daemon.

## Prevention

### Process Improvements
1. **Local Testing**: Always test Docker buildx commands locally before CI changes
2. **Platform Awareness**: Understand Docker buildx limitations with multi-platform builds
3. **Documentation**: Document build configuration requirements and limitations

### Technical Improvements
1. **Separate Strategies**: Use different build strategies for different purposes:
   - Single platform with `--load` for local testing
   - Multi-platform with `--push` for registry deployment
2. **Conditional Builds**: Consider conditional logic based on event type (PR vs. push)
3. **Build Validation**: Add local Docker build validation to pre-commit hooks

### Future Considerations
1. **Multi-platform Registry**: For true multi-platform support, use registry push instead of local load
2. **Build Matrix**: Consider separate jobs for different platforms if needed
3. **Documentation**: Update developer documentation with Docker build requirements

## Troubleshooting Matrix

| Failure Type | Debug Command | Common Fix | Prevention |
|--------------|---------------|-------------|------------|
| Docker Buildx Multi-platform | `docker buildx build --platform` | Use single platform with --load | Local build testing |
| Manifest List Export | `docker buildx build --load` | Remove --load for multi-platform | Understand buildx limitations |
| Platform Mismatch | `docker run --platform` | Match build and run platforms | Consistent platform specification |

## Best Practices

### Do
- Test Docker build commands locally before CI changes
- Understand Docker buildx limitations and capabilities
- Use appropriate build strategies for different use cases
- Document build configuration requirements

### Avoid
- Mixing multi-platform builds with local loading
- Assuming all Docker features work together
- Skipping local testing of build changes
- Ignoring buildx error messages

## Verification
- ✅ CI run 22846228243 passed successfully
- ✅ Docker build now works with single platform
- ✅ All other CI jobs continue to pass
- ✅ No regressions introduced

