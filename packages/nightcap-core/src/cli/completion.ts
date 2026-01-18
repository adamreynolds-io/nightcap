/**
 * Copyright 2025 Midnight Network
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TaskDefinition } from '../tasks/types.js';

export type ShellType = 'bash' | 'zsh' | 'fish';

/**
 * Generate bash completion script
 */
function generateBashCompletion(tasks: TaskDefinition[]): string {
  const taskNames = tasks.map((t) => t.name).join(' ');
  const globalOptions = '--network --verbose --quiet --config --help --version';

  return `# Nightcap bash completion script
# Add to ~/.bashrc or ~/.bash_profile:
#   eval "$(nightcap completion bash)"

_nightcap_completions() {
    local cur prev words cword
    _init_completion || return

    local commands="${taskNames}"
    local global_opts="${globalOptions}"

    # If completing the first argument (command)
    if [[ \${cword} -eq 1 ]]; then
        COMPREPLY=($(compgen -W "\${commands} \${global_opts}" -- "\${cur}"))
        return
    fi

    # Get the command (first non-option argument)
    local cmd=""
    for ((i=1; i < cword; i++)); do
        if [[ "\${words[i]}" != -* ]]; then
            cmd="\${words[i]}"
            break
        fi
    done

    # Complete based on previous word
    case "\${prev}" in
        --network)
            COMPREPLY=($(compgen -W "localnet devnet testnet" -- "\${cur}"))
            return
            ;;
        --config)
            _filedir
            return
            ;;
    esac

    # Command-specific completions
    case "\${cmd}" in
${tasks
  .map((task) => {
    const opts = task.params
      ? Object.keys(task.params)
          .map((p) => `--${p}`)
          .join(' ')
      : '';
    return `        ${task.name})
            COMPREPLY=($(compgen -W "${opts} \${global_opts}" -- "\${cur}"))
            ;;`;
  })
  .join('\n')}
        *)
            COMPREPLY=($(compgen -W "\${global_opts}" -- "\${cur}"))
            ;;
    esac
}

complete -F _nightcap_completions nightcap
`;
}

/**
 * Generate zsh completion script
 */
function generateZshCompletion(tasks: TaskDefinition[]): string {
  const commandDescriptions = tasks.map((t) => `'${t.name}:${t.description.replace(/'/g, "''")}'`).join('\n        ');

  const commandCases = tasks
    .map((task) => {
      if (!task.params || Object.keys(task.params).length === 0) {
        return '';
      }
      const opts = Object.entries(task.params)
        .map(([name, def]) => {
          const desc = def.description?.replace(/'/g, "''") ?? '';
          return `'--${name}[${desc}]'`;
        })
        .join(' \\\n                ');
      return `            ${task.name})
                _arguments -s \\
                ${opts}
                ;;`;
    })
    .filter(Boolean)
    .join('\n');

  return `#compdef nightcap
# Nightcap zsh completion script
# Add to ~/.zshrc:
#   eval "$(nightcap completion zsh)"

_nightcap() {
    local -a commands
    commands=(
        ${commandDescriptions}
    )

    _arguments -s \\
        '--network[Network to use]:network:(localnet devnet testnet)' \\
        '--verbose[Enable verbose output]' \\
        '--quiet[Suppress non-essential output]' \\
        '--config[Path to config file]:file:_files' \\
        '(-h --help)'{-h,--help}'[Show help]' \\
        '(-v --version)'{-v,--version}'[Show version]' \\
        '1:command:->command' \\
        '*::arg:->args'

    case "\$state" in
        command)
            _describe -t commands 'nightcap commands' commands
            ;;
        args)
            case "\$words[1]" in
${commandCases}
            esac
            ;;
    esac
}

_nightcap "\$@"
`;
}

/**
 * Generate fish completion script
 */
function generateFishCompletion(tasks: TaskDefinition[]): string {
  const commandCompletions = tasks
    .map((t) => `complete -c nightcap -n __fish_use_subcommand -a '${t.name}' -d '${t.description.replace(/'/g, "\\'")}'`)
    .join('\n');

  const optionCompletions = tasks
    .map((task) => {
      if (!task.params) return '';
      return Object.entries(task.params)
        .map(([name, def]) => {
          const desc = def.description?.replace(/'/g, "\\'") ?? '';
          return `complete -c nightcap -n "__fish_seen_subcommand_from ${task.name}" -l ${name} -d '${desc}'`;
        })
        .join('\n');
    })
    .filter(Boolean)
    .join('\n');

  return `# Nightcap fish completion script
# Add to ~/.config/fish/config.fish:
#   nightcap completion fish | source

# Disable file completion by default
complete -c nightcap -f

# Global options
complete -c nightcap -l network -d 'Network to use' -xa 'localnet devnet testnet'
complete -c nightcap -l verbose -d 'Enable verbose output'
complete -c nightcap -l quiet -d 'Suppress non-essential output'
complete -c nightcap -l config -d 'Path to config file' -r
complete -c nightcap -s h -l help -d 'Show help'
complete -c nightcap -s v -l version -d 'Show version'

# Commands
${commandCompletions}

# Command-specific options
${optionCompletions}
`;
}

/**
 * Generate shell completion script for the specified shell
 */
export function generateCompletion(shell: ShellType, tasks: TaskDefinition[]): string {
  switch (shell) {
    case 'bash':
      return generateBashCompletion(tasks);
    case 'zsh':
      return generateZshCompletion(tasks);
    case 'fish':
      return generateFishCompletion(tasks);
    default:
      throw new Error(`Unsupported shell: ${shell}`);
  }
}

/**
 * Get supported shells
 */
export function getSupportedShells(): ShellType[] {
  return ['bash', 'zsh', 'fish'];
}
