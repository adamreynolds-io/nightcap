# Troubleshooting

This guide covers common issues and their solutions when using Nightcap.

## Running Diagnostics

Before troubleshooting specific issues, run the built-in diagnostics:

```bash
nightcap doctor
```

This checks:
- Node.js version
- Docker installation and status
- Required Docker images
- System memory and disk space
- Network connectivity
- Configuration validity

Run with `--verbose` for additional details:

```bash
nightcap doctor --verbose
```

## Docker Issues

### Docker daemon not running

**Symptom:**
```
[ERROR] Docker: Docker is installed but daemon is not running
```

**Solutions:**

1. **macOS/Windows:** Start Docker Desktop from your applications
2. **Linux:** Start the Docker service:
   ```bash
   sudo systemctl start docker
   ```
3. **Verify Docker is running:**
   ```bash
   docker info
   ```

### Docker images not found

**Symptom:**
```
[WARN] Docker Images: 3 of 3 images missing
```

**Solution:**

Pull the required images:

```bash
nightcap node --pull
```

Or pull manually:

```bash
docker pull midnightntwrk/midnight-node:latest
docker pull midnightntwrk/midnight-indexer:latest
docker pull midnightntwrk/midnight-proof-server:latest
```

### Port already in use

**Symptom:**
```
Error: Port 9944 is already in use
```

**Solutions:**

1. **Stop the conflicting service:**
   ```bash
   # Find what's using the port
   lsof -i :9944

   # Stop the process
   kill <PID>
   ```

2. **Use different ports in config:**
   ```typescript
   // nightcap.config.ts
   export default defineConfig({
     docker: {
       ports: {
         nodeRpc: 19944,
         nodeWs: 19945,
         indexer: 18088,
         proofServer: 16300,
       },
     },
   });
   ```

### Docker containers won't start

**Symptom:**
```
Failed to start stack: Container exited with code 1
```

**Solutions:**

1. **Check logs:**
   ```bash
   docker logs nightcap-node-1
   docker logs nightcap-indexer-1
   ```

2. **Reset and try again:**
   ```bash
   nightcap node:reset
   nightcap node
   ```

3. **Check available memory:**
   The Midnight stack requires at least 8GB RAM. Close other applications if needed.

### Permission denied on Docker socket

**Symptom:**
```
Got permission denied while trying to connect to the Docker daemon socket
```

**Solution (Linux):**

Add your user to the docker group:

```bash
sudo usermod -aG docker $USER
# Log out and back in, or:
newgrp docker
```

## Compilation Issues

### Compiler not found

**Symptom:**
```
Compact compiler (compactc) not found
```

**Solutions:**

1. **Install via Nightcap:**
   ```bash
   nightcap compiler:install --compiler-version 0.26.0
   ```

2. **Install manually:**
   ```bash
   curl --proto '=https' --tlsv1.2 -LsSf \
     https://github.com/midnightntwrk/compact/releases/download/compact-v0.3.0/compact-installer.sh | sh
   ```

3. **Specify version in config:**
   ```typescript
   export default defineConfig({
     compact: {
       version: '0.26.0',
     },
   });
   ```

### Compilation errors

**Symptom:**
```
Failed to compile MyContract:
  contracts/MyContract.compact:15:10
  error: expected ';' but found 'return'
```

**Solutions:**

1. **Check syntax:** Review the error location and fix the syntax
2. **Use VS Code format:** For better IDE integration:
   ```bash
   nightcap compile --error-format vscode
   ```

### Contract dependencies not found

**Symptom:**
```
error: Cannot find import 'BaseContract'
```

**Solutions:**

1. **Check import path:** Ensure the imported file exists and the path is correct
2. **Use relative imports:**
   ```compact
   import "./lib/BaseContract.compact";
   ```

### Cache issues

**Symptom:**
Changes to contracts aren't being compiled.

**Solution:**

Force recompilation:

```bash
nightcap compile --force
```

Or clean and recompile:

```bash
nightcap clean --force
nightcap compile
```

## Network Connectivity Issues

### Cannot connect to network

**Symptom:**
```
Error: ECONNREFUSED 127.0.0.1:9944
```

**Solutions:**

1. **Check if local network is running:**
   ```bash
   nightcap node:status
   ```

2. **Wait for services to start:**
   After `nightcap node`, services may take a moment to become ready.

3. **Check firewall settings:**
   Ensure the ports aren't blocked by a firewall.

### Indexer queries failing

**Symptom:**
```
GraphQL error: Cannot query field "xyz"
```

**Solutions:**

1. **Check indexer logs:**
   ```bash
   nightcap node:logs --service indexer
   ```

2. **Wait for sync:** The indexer may still be synchronizing.

3. **Reset network:** If data is corrupted:
   ```bash
   nightcap node:reset
   nightcap node
   ```

## Deployment Issues

### Deployment failing

**Symptom:**
```
Failed to deploy MyContract: timeout
```

**Solutions:**

1. **Check network status:**
   ```bash
   nightcap node:status
   ```

2. **Check proof server:**
   The proof server must be running for deployments:
   ```bash
   nightcap node:logs --service proof-server
   ```

3. **Try dry run first:**
   ```bash
   nightcap deploy --dry-run
   ```

### Artifacts not found

**Symptom:**
```
No artifacts directory found. Run "nightcap compile" first.
```

**Solution:**

Compile your contracts:

```bash
nightcap compile
```

### Already deployed error

**Symptom:**
Contract isn't being redeployed after changes.

**Solution:**

The deployment system tracks deployed contracts. To redeploy:

```bash
nightcap deploy --reset
```

## Configuration Issues

### Config file not found

**Symptom:**
```
Could not find nightcap.config.ts
```

**Solutions:**

1. **Create a config file:**
   ```bash
   nightcap init
   ```

2. **Specify config path:**
   ```bash
   nightcap --config ./custom-config.ts <command>
   ```

### Invalid configuration

**Symptom:**
```
Configuration validation failed:
  - [plugin-x] networkUrl is required
```

**Solutions:**

1. **Check error messages:** They indicate which fields are invalid
2. **Review config file:** Ensure all required fields are present
3. **Check plugin requirements:** Some plugins require specific config

### Network not found

**Symptom:**
```
Unknown network: mynet
Available networks: localnet, devnet, preview, preprod, mainnet
```

**Solution:**

Add the network to your config:

```typescript
export default defineConfig({
  networks: {
    mynet: {
      name: 'mynet',
      nodeUrl: 'https://node.mynet.example.com',
      indexerUrl: 'https://indexer.mynet.example.com/api/v1/graphql',
      proofServerUrl: 'https://proof.mynet.example.com',
    },
  },
});
```

## Performance Issues

### Slow compilation

**Solutions:**

1. **Use caching:** Don't use `--force` unless needed
2. **Exclude test files:**
   ```typescript
   export default defineConfig({
     compact: {
       exclude: ['**/test/**', '**/*.test.compact'],
     },
   });
   ```

### High memory usage

**Solutions:**

1. **Close unused services:**
   ```bash
   nightcap node:stop
   ```

2. **Reduce Docker memory limits:** Configure in Docker Desktop settings

3. **Use detached mode:**
   ```bash
   nightcap node --detach
   ```

## Getting More Help

### Enable verbose output

```bash
nightcap --verbose <command>
```

### View logs

```bash
# All services
nightcap node:logs

# Specific service with follow
nightcap node:logs --service node --follow
```

### Check versions

```bash
nightcap --version
node --version
docker --version
```

### Report issues

If you can't resolve an issue:

1. Gather diagnostic info:
   ```bash
   nightcap doctor --verbose
   nightcap --version
   ```

2. Check existing issues: https://github.com/midnightntwrk/nightcap/issues

3. Create a new issue with:
   - Nightcap version
   - Node.js version
   - Operating system
   - Docker version
   - Steps to reproduce
   - Error messages and logs
