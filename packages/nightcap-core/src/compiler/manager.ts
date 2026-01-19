/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, readdirSync } from 'node:fs';
import { mkdir, chmod, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir, platform, arch } from 'node:os';
import { spawnSync, spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { logger } from '../utils/logger.js';

/**
 * Platform identifiers for new compact releases (compact-v0.x.0)
 */
type NewReleasePlatform = 'aarch64-apple-darwin' | 'x86_64-apple-darwin' | 'x86_64-unknown-linux-musl';

/**
 * Platform identifiers for old compactc releases (compactc-v0.x.0)
 */
type OldReleasePlatform = 'aarch64-darwin' | 'x86_64-darwin' | 'x86_64-unknown-linux-musl';

/**
 * Compiler version info
 */
export interface CompilerVersion {
  version: string;
  path: string;
  isDefault: boolean;
}

/**
 * Compilation result
 */
export interface CompilationResult {
  success: boolean;
  contractName: string;
  sourcePath: string;
  artifactPath?: string;
  errors?: string[];
  warnings?: string[];
}

/**
 * Get the current platform identifier for new releases
 */
function getNewReleasePlatform(): NewReleasePlatform | null {
  const os = platform();
  const cpu = arch();

  if (os === 'darwin' && cpu === 'arm64') return 'aarch64-apple-darwin';
  if (os === 'darwin' && cpu === 'x64') return 'x86_64-apple-darwin';
  if (os === 'linux' && cpu === 'x64') return 'x86_64-unknown-linux-musl';

  return null;
}

/**
 * Get the current platform identifier for old releases
 */
function getOldReleasePlatform(): OldReleasePlatform | null {
  const os = platform();
  const cpu = arch();

  if (os === 'darwin' && cpu === 'arm64') return 'aarch64-darwin';
  if (os === 'darwin' && cpu === 'x64') return 'x86_64-darwin';
  if (os === 'linux' && cpu === 'x64') return 'x86_64-unknown-linux-musl';

  return null;
}

/**
 * Get the Nightcap home directory
 */
function getNightcapHome(): string {
  return join(homedir(), '.nightcap');
}

/**
 * Get the compilers directory
 */
function getCompilersDir(): string {
  return join(getNightcapHome(), 'compilers');
}

/**
 * Extract a .tar.xz archive
 */
async function extractTarXz(archivePath: string, destDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('tar', ['xf', archivePath, '-C', destDir], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Failed to extract archive: ${stderr}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to run tar: ${err.message}`));
    });
  });
}

/**
 * Extract a .zip archive
 */
async function extractZip(archivePath: string, destDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('unzip', ['-q', '-o', archivePath, '-d', destDir], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Failed to extract archive: ${stderr}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to run unzip: ${err.message}`));
    });
  });
}

/**
 * Manages the Compact compiler
 */
export class CompilerManager {
  private compilersDir: string;

  constructor() {
    this.compilersDir = getCompilersDir();
  }

  /**
   * Find compact/compactc in PATH
   */
  findInPath(): string | null {
    // Try compactc first (our managed name), then compact (official name)
    for (const name of ['compactc', 'compact']) {
      // Use spawnSync with array args to avoid command injection
      const result = spawnSync('which', [name], { encoding: 'utf8' });
      if (result.status === 0 && result.stdout.trim()) {
        return result.stdout.trim();
      }
    }
    return null;
  }

  /**
   * Get version of a compiler binary
   */
  getVersion(compilerPath: string): string | null {
    // Use spawnSync with array args to avoid command injection
    const result = spawnSync(compilerPath, ['--version'], { encoding: 'utf8' });
    if (result.status !== 0 || result.error) {
      return null;
    }
    const output = result.stdout.trim();
    // Extract version number (e.g., "compact 0.3.0" -> "0.3.0")
    const match = /(\d+\.\d+\.\d+(?:-[\w.]+)?)/.exec(output);
    return match ? match[1] ?? null : null;
  }

  /**
   * List installed compiler versions
   */
  listInstalled(): CompilerVersion[] {
    const versions: CompilerVersion[] = [];

    // Check PATH
    const pathCompiler = this.findInPath();
    if (pathCompiler) {
      const version = this.getVersion(pathCompiler);
      if (version) {
        versions.push({
          version,
          path: pathCompiler,
          isDefault: true,
        });
      }
    }

    // Check managed compilers
    if (existsSync(this.compilersDir)) {
      const entries = readdirSync(this.compilersDir);
      for (const entry of entries) {
        if (entry.startsWith('compactc-')) {
          const version = entry.replace('compactc-', '');
          const compilerPath = join(this.compilersDir, entry, 'compactc');
          if (existsSync(compilerPath)) {
            // Avoid duplicates if PATH points to a managed version
            const alreadyListed = versions.some(v => v.version === version);
            if (!alreadyListed) {
              versions.push({
                version,
                path: compilerPath,
                isDefault: false,
              });
            }
          }
        }
      }
    }

    return versions;
  }

  /**
   * Get the best available compiler (prefer specific version if provided)
   */
  async getCompiler(requestedVersion?: string): Promise<string | null> {
    // If specific version requested, look for it
    if (requestedVersion) {
      const managedPath = join(this.compilersDir, `compactc-${requestedVersion}`, 'compactc');
      if (existsSync(managedPath)) {
        return managedPath;
      }

      // Check if PATH version matches
      const pathCompiler = this.findInPath();
      if (pathCompiler) {
        const version = this.getVersion(pathCompiler);
        if (version === requestedVersion) {
          return pathCompiler;
        }
      }

      return null;
    }

    // Otherwise, prefer PATH, then any managed version
    const pathCompiler = this.findInPath();
    if (pathCompiler) {
      return pathCompiler;
    }

    const installed = this.listInstalled();
    if (installed.length > 0) {
      return installed[0]?.path ?? null;
    }

    return null;
  }

  /**
   * Get the latest version from GitHub releases
   */
  async getLatestVersion(): Promise<string> {
    const response = await fetch(
      'https://api.github.com/repos/midnightntwrk/compact/releases/latest'
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch latest version: ${response.status}`);
    }
    const data = await response.json() as { tag_name: string };
    // tag_name is like "compact-v0.3.0", extract version
    const match = /compact-v(.+)/.exec(data.tag_name);
    if (!match) {
      throw new Error(`Unexpected tag format: ${data.tag_name}`);
    }
    return match[1] ?? data.tag_name;
  }

  /**
   * List available prerelease versions from GitHub
   */
  async listPrereleaseVersions(): Promise<string[]> {
    const response = await fetch(
      'https://api.github.com/repos/midnightntwrk/compact/contents/prerelease'
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch prerelease versions: ${response.status}`);
    }
    const data = await response.json() as Array<{ name: string; type: string }>;
    return data
      .filter(item => item.type === 'dir' && item.name.startsWith('compactc-'))
      .map(item => item.name.replace('compactc-', ''));
  }

  /**
   * Get the latest prerelease version for a given base version
   */
  async getLatestPrerelease(baseVersion: string): Promise<{ version: string; url: string } | null> {
    const plat = getOldReleasePlatform();
    if (!plat) {
      throw new Error(`Unsupported platform: ${platform()} ${arch()}`);
    }

    const response = await fetch(
      `https://api.github.com/repos/midnightntwrk/compact/contents/prerelease/compactc-${baseVersion}`
    );
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch prerelease files: ${response.status}`);
    }

    const data = await response.json() as Array<{ name: string; download_url: string }>;

    // Find the latest rc for this platform
    // Files are named: compactc_v0.27.0-rc.1_aarch64-darwin.zip
    const platformFiles = data
      .filter(f => f.name.endsWith(`_${plat}.zip`))
      .map(f => {
        const match = /compactc_v([\d.]+-rc\.\d+)_/.exec(f.name);
        return match ? { version: match[1] ?? '', url: f.download_url, name: f.name } : null;
      })
      .filter((f): f is { version: string; url: string; name: string } => f !== null)
      .sort((a, b) => {
        // Sort by rc number descending to get latest
        const rcA = parseInt(/rc\.(\d+)/.exec(a.version)?.[1] ?? '0');
        const rcB = parseInt(/rc\.(\d+)/.exec(b.version)?.[1] ?? '0');
        return rcB - rcA;
      });

    if (platformFiles.length === 0) {
      return null;
    }

    return { version: platformFiles[0]!.version, url: platformFiles[0]!.url };
  }

  /**
   * Download and install a compiler version
   */
  async install(version: string, prerelease = false): Promise<string> {
    const newPlat = getNewReleasePlatform();
    const oldPlat = getOldReleasePlatform();
    if (!newPlat || !oldPlat) {
      throw new Error(`Unsupported platform: ${platform()} ${arch()}`);
    }

    // Handle "latest" version
    let actualVersion = version;
    if (version === 'latest') {
      logger.info('Fetching latest version...');
      actualVersion = await this.getLatestVersion();
      logger.info(`Latest version: ${actualVersion}`);
    }

    const installDir = join(this.compilersDir, `compactc-${actualVersion}`);
    const compilerPath = join(installDir, 'compactc');

    // Check if already installed
    if (existsSync(compilerPath)) {
      logger.info(`Compiler ${actualVersion} is already installed`);
      return compilerPath;
    }

    // Create directories
    await mkdir(installDir, { recursive: true });

    if (prerelease) {
      // Handle prerelease download
      const prereleaseInfo = await this.getLatestPrerelease(actualVersion);
      if (!prereleaseInfo) {
        const available = await this.listPrereleaseVersions();
        if (available.length > 0) {
          logger.error(`No prerelease found for version ${actualVersion}`);
          logger.info(`Available prerelease versions: ${available.join(', ')}`);
        } else {
          logger.error('No prerelease versions available');
        }
        throw new Error(`Prerelease not found for ${actualVersion}`);
      }

      logger.info(`Downloading prerelease ${prereleaseInfo.version}...`);
      logger.debug(`URL: ${prereleaseInfo.url}`);

      const response = await fetch(prereleaseInfo.url);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const archivePath = join(installDir, 'compactc.zip');
      const fileStream = createWriteStream(archivePath);
      await pipeline(response.body as unknown as NodeJS.ReadableStream, fileStream);

      logger.info('Extracting...');
      await extractZip(archivePath, installDir);

      // Prerelease extracts to compactc binary directly
      if (!existsSync(compilerPath)) {
        throw new Error(`Binary not found after extraction: ${compilerPath}`);
      }

      await chmod(compilerPath, 0o755);
      await rm(archivePath, { force: true });

      // Verify it works
      const installedVersion = this.getVersion(compilerPath);
      if (!installedVersion) {
        throw new Error('Downloaded compiler failed version check');
      }

      logger.success(`Installed compact ${installedVersion} (prerelease)`);
      return compilerPath;
    }

    // Try new format first (compact-v0.x.0 with tar.xz)
    const newFormatUrl = `https://github.com/midnightntwrk/compact/releases/download/compact-v${actualVersion}/compact-${newPlat}.tar.xz`;
    // Old format (compactc-v0.x.0 with zip)
    const oldFormatUrl = `https://github.com/midnightntwrk/compact/releases/download/compactc-v${actualVersion}/compactc_v${actualVersion}_${oldPlat}.zip`;

    try {
      // Try new format first
      logger.info(`Downloading compact ${actualVersion} for ${newPlat}...`);
      logger.debug(`URL: ${newFormatUrl}`);

      let response = await fetch(newFormatUrl);

      if (response.ok) {
        // New format: tar.xz archive
        const archivePath = join(installDir, 'compact.tar.xz');
        const fileStream = createWriteStream(archivePath);
        await pipeline(response.body as unknown as NodeJS.ReadableStream, fileStream);

        logger.info('Extracting...');
        await extractTarXz(archivePath, installDir);

        const extractedDir = join(installDir, `compact-${newPlat}`);
        const extractedBinary = join(extractedDir, 'compact');

        if (!existsSync(extractedBinary)) {
          throw new Error(`Binary not found after extraction: ${extractedBinary}`);
        }

        await rename(extractedBinary, compilerPath);
        await chmod(compilerPath, 0o755);
        await rm(archivePath, { force: true });
        await rm(extractedDir, { recursive: true, force: true });
      } else if (response.status === 404) {
        // Try old format
        logger.debug('New format not found, trying old format...');
        logger.info(`Downloading compactc ${actualVersion} for ${oldPlat}...`);
        logger.debug(`URL: ${oldFormatUrl}`);

        response = await fetch(oldFormatUrl);
        if (!response.ok) {
          throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }

        // Old format: zip archive
        const archivePath = join(installDir, 'compactc.zip');
        const fileStream = createWriteStream(archivePath);
        await pipeline(response.body as unknown as NodeJS.ReadableStream, fileStream);

        logger.info('Extracting...');
        await extractZip(archivePath, installDir);

        // Old format extracts directly to compactc binary
        const extractedBinary = join(installDir, 'compactc');

        if (!existsSync(extractedBinary)) {
          throw new Error(`Binary not found after extraction: ${extractedBinary}`);
        }

        await chmod(compilerPath, 0o755);
        await rm(archivePath, { force: true });
      } else {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Verify it works
      const installedVersion = this.getVersion(compilerPath);
      if (!installedVersion) {
        throw new Error('Downloaded compiler failed version check');
      }

      logger.success(`Installed compact ${installedVersion}`);
      return compilerPath;
    } catch (error) {
      // Clean up on failure
      try {
        await rm(installDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Detect if this is the new-style compiler (with subcommands) or old-style
   */
  private isNewStyleCompiler(compilerPath: string): boolean {
    // Use spawnSync with array args to avoid command injection
    const result = spawnSync(compilerPath, ['--help'], { encoding: 'utf8' });
    if (result.status !== 0 || result.error) {
      return false;
    }
    const output = result.stdout;
    // New compiler has "Commands:" section, old one has "Usage: compactc.bin"
    return output.includes('Commands:') && output.includes('compile');
  }

  /**
   * Compile a Compact contract
   */
  async compile(
    sourcePath: string,
    outputDir: string,
    compilerPath: string
  ): Promise<CompilationResult> {
    const contractName = sourcePath.split('/').pop()?.replace('.compact', '') ?? 'Unknown';

    return new Promise((resolve) => {
      // Detect compiler type and use appropriate syntax
      const isNewStyle = this.isNewStyleCompiler(compilerPath);

      // New style: compact compile <source> <output>
      // Old style: compactc <source> <output>
      const args = isNewStyle
        ? ['compile', sourcePath, outputDir]
        : [sourcePath, outputDir];

      const proc = spawn(compilerPath, args);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            contractName,
            sourcePath,
            artifactPath: outputDir,
            warnings: stderr ? [stderr] : undefined,
          });
        } else {
          resolve({
            success: false,
            contractName,
            sourcePath,
            errors: [stderr || stdout || `Compilation failed with code ${code}`],
          });
        }
      });

      proc.on('error', (err) => {
        resolve({
          success: false,
          contractName,
          sourcePath,
          errors: [err.message],
        });
      });
    });
  }
}
