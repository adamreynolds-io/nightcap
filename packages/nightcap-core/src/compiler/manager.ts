/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, readdirSync } from 'node:fs';
import { mkdir, chmod, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir, platform, arch } from 'node:os';
import { execSync, spawn } from 'node:child_process';
import { logger } from '../utils/logger.js';

/**
 * Supported platforms for compactc
 */
type Platform = 'darwin-arm64' | 'darwin-x86_64' | 'linux-x86_64';

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
 * Get the current platform identifier
 */
function getPlatform(): Platform | null {
  const os = platform();
  const cpu = arch();

  if (os === 'darwin' && cpu === 'arm64') return 'darwin-arm64';
  if (os === 'darwin' && cpu === 'x64') return 'darwin-x86_64';
  if (os === 'linux' && cpu === 'x64') return 'linux-x86_64';

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
 * Manages the Compact compiler (compactc)
 */
export class CompilerManager {
  private compilersDir: string;

  constructor() {
    this.compilersDir = getCompilersDir();
  }

  /**
   * Find compactc in PATH
   */
  findInPath(): string | null {
    try {
      const result = execSync('which compactc', { encoding: 'utf8' }).trim();
      return result || null;
    } catch {
      return null;
    }
  }

  /**
   * Get version of a compactc binary
   */
  getVersion(compilerPath: string): string | null {
    try {
      const result = execSync(`"${compilerPath}" --version`, { encoding: 'utf8' }).trim();
      // Extract version number (e.g., "compactc 0.26.0" -> "0.26.0")
      const match = /(\d+\.\d+\.\d+(?:-[\w.]+)?)/.exec(result);
      return match ? match[1] ?? null : null;
    } catch {
      return null;
    }
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
            versions.push({
              version,
              path: compilerPath,
              isDefault: false,
            });
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
   * Download and install a compiler version
   */
  async install(version: string, prerelease = false): Promise<string> {
    const plat = getPlatform();
    if (!plat) {
      throw new Error(`Unsupported platform: ${platform()} ${arch()}`);
    }

    const installDir = join(this.compilersDir, `compactc-${version}`);
    const compilerPath = join(installDir, 'compactc');

    // Check if already installed
    if (existsSync(compilerPath)) {
      logger.info(`Compiler ${version} is already installed`);
      return compilerPath;
    }

    // Create directories
    await mkdir(installDir, { recursive: true });

    // Determine download URL
    let url: string;
    if (prerelease) {
      // Prerelease from main branch
      url = `https://raw.githubusercontent.com/midnightntwrk/compact/main/prerelease/compactc-${plat}`;
    } else {
      // Stable from GitHub releases
      url = `https://github.com/midnightntwrk/compact/releases/download/compact-v${version}/compactc-${plat}`;
    }

    logger.info(`Downloading compactc ${version} for ${plat}...`);
    logger.debug(`URL: ${url}`);

    try {
      // Download using fetch
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      await writeFile(compilerPath, Buffer.from(buffer));
      await chmod(compilerPath, 0o755);

      // Verify it works
      const installedVersion = this.getVersion(compilerPath);
      if (!installedVersion) {
        throw new Error('Downloaded compiler failed version check');
      }

      logger.success(`Installed compactc ${installedVersion}`);
      return compilerPath;
    } catch (error) {
      // Clean up on failure
      try {
        const { rm } = await import('node:fs/promises');
        await rm(installDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
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
      const args = [sourcePath, '-o', outputDir];
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
