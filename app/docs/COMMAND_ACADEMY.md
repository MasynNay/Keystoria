# Field Academy — command reference

This reference accompanies **PANIC PROTOCOL v0.9**. All examples in the browser are simulated; no commands are executed. Files and log names are illustrative and may not exist on your machine.

## LINUX TERMINAL (14 commands)

A remote research server has gone offline. You're the newest systems operator. Work through an incident-response checklist and learn the commands you'd use to inspect files and diagnose the machine.

**Note:** Bash is a common Linux shell. Filenames are usually case-sensitive. Example files and folders in this simulation are hypothetical.

| Command | What it does |
| --- | --- |
| `pwd` | pwd stands for print working directory. It tells you which folder your shell is currently using. |
| `ls -la` | -l shows permissions, ownership, and timestamps; -a includes names beginning with a dot. |
| `cd ..` | .. means the folder above your current one. cd changes the shell's working directory. |
| `mkdir projects` | mkdir creates a directory. If projects already exists, the command normally reports an error. |
| `touch notes.txt` | touch creates notes.txt if it does not exist. If it does, touch updates its timestamp. |
| `cp notes.txt backup.txt` | cp copies a source file to a destination. A real run could overwrite backup.txt, so verify the destination first. |
| `mv backup.txt archive.txt` | mv renames backup.txt to archive.txt in this example. It can also move files between directories. |
| `cat notes.txt` | cat outputs the file's contents. For long files, less is usually easier to navigate. |
| `grep "error" app.log` | grep searches for a matching pattern in a file. By default, matching is case-sensitive. |
| `find . -name "*.log"` | find traverses directories. The dot means start here; -name matches a filename pattern. |
| `ps aux` | ps lists processes; aux is a commonly used BSD-style option set on Linux. |
| `df -h` | df reports filesystem usage. -h requests human-readable size units such as GiB. |
| `chmod u+x script.sh` | chmod changes permissions. u+x adds the executable bit for the file owner; it does not run the script. |
| `man ls` | man lets you research command flags directly from installed documentation. Press q to exit the pager. |

## WINDOWS POWERSHELL (14 commands)

A workstation is behaving strangely after a software rollout. You're at the PowerShell console, collecting evidence and checking services. Learn practical administrative inspection commands without touching your real PC.

**Note:** This course uses PowerShell, not cmd.exe. Cmdlets use Verb-Noun names; parameters often have full descriptive names.

| Command | What it does |
| --- | --- |
| `Get-Location` | Get-Location returns the current directory or provider location, similar to pwd on Unix. |
| `Get-ChildItem` | Get-ChildItem is the PowerShell equivalent of listing directory contents. Its common alias is dir. |
| `Set-Location ..` | Set-Location changes where commands operate. The common alias is cd. |
| `New-Item -ItemType Directory -Name Projects` | New-Item creates filesystem objects. -ItemType Directory specifies a folder. |
| `New-Item -ItemType File -Name notes.txt` | New-Item creates notes.txt in the current folder. A real command may fail if the item already exists. |
| `Copy-Item notes.txt backup.txt` | Copy-Item makes another copy of an item. Verify paths and existing files before running on a real system. |
| `Move-Item backup.txt archive.txt` | Move-Item can rename or relocate an item; this example renames the file in the same directory. |
| `Get-Content notes.txt` | Get-Content reads lines from a file, making them available to the PowerShell pipeline. |
| `Select-String -Path app.log -Pattern "error"` | Select-String searches text and returns matching lines, often including line numbers. |
| `Get-Process` | Get-Process returns structured process objects that can be filtered or sorted. |
| `Get-Service` | Get-Service shows information such as Running and Stopped. It does not alter services. |
| `Test-Path notes.txt` | Test-Path checks a path without opening the file. |
| `Get-Help Get-ChildItem` | Get-Help explains parameters and usage. Some help files may need to be updated separately. |
| `Clear-Host` | Clear-Host cleans up the terminal screen. It does not delete files or shell history. |

## MACOS TERMINAL (14 commands)

A studio Mac needs a quick diagnostic pass before a production deadline. You're at the built-in Terminal using zsh, macOS's default interactive shell on modern releases. Learn Unix basics and Mac-specific shortcuts.

**Note:** Many macOS commands look like Linux, but Apple includes BSD-style utilities and its own tools. These example files are simulated.

| Command | What it does |
| --- | --- |
| `pwd` | Shows the current folder used by the shell. |
| `ls -la` | -l provides details and -a shows dotfiles such as .zshrc. |
| `cd ..` | The two dots refer to the parent directory; cd changes the current directory. |
| `mkdir projects` | mkdir creates the directory in your current location. |
| `touch notes.txt` | touch does not open a text editor; it creates a file if needed. |
| `cp notes.txt backup.txt` | cp duplicates the source; a real run can overwrite an existing destination. |
| `mv backup.txt archive.txt` | mv can move files between folders or give them a new name. |
| `cat notes.txt` | cat works well for short files, while less is useful for larger ones. |
| `grep "error" app.log` | grep searches text using patterns and is case-sensitive by default. |
| `find . -name "*.log"` | find walks subdirectories recursively; quoted patterns prevent the shell from expanding them early. |
| `open .` | open is a macOS command that launches files, folders, or URLs using their default applications. |
| `sw_vers` | sw_vers is a macOS-specific system version command. |
| `screencapture -i screenshot.png` | -i activates interactive capture. Running it for real opens the selection interface. |
| `man open` | Manual pages explain system flags; use q to leave the manual viewer. |

## Practice tips

Try a command in the fictional lesson first, then read the explanation and check the tool's built-in help (`man`, `Get-Help`) before using it on your own computer. Some filesystem commands can overwrite files or change permissions when run in a real shell. The Field Academy will not change your system.


## New reference workflow in v0.7

The command list in the right-hand sidebar is clickable throughout the lesson and after completion. It changes only the reference card, never the active command or course progress. Each entry offers a practical usage situation, the benefit of using the command, a caution about running it on a real computer, and example terminal output.

**Press Enter to validate, then Enter again to continue.** This keeps the command feedback on screen long enough to read the sample output. All terminal responses are simulated. No browser input is sent to your OS shell.


## GIT FUNDAMENTALS (10 commands)

A team is preparing a release in a shared project. Inspect the repository, understand its changes and review its history before deciding what to do next.

**Note:** Git must be installed and most commands run inside a repository. Each simulated step is independent; nothing is committed, pushed or executed.

| Command | What it does |
| --- | --- |
| `git --version` | Use this command to confirm Git is installed and identify the version before troubleshooting. |
| `git status --short` | Two status columns distinguish index changes from working-tree changes; ?? marks an untracked path. |
| `git branch --show-current` | The output is empty when HEAD is detached; this command does not switch branches. |
| `git branch -a` | The asterisk identifies the current local branch; remote-tracking refs reflect the last fetched state. |
| `git log --oneline -5` | Each line includes an abbreviated commit identifier and the commit subject. |
| `git diff` | By default git diff compares the working tree with the index; it excludes untracked files. |
| `git diff --staged` | This compares the index with HEAD in a repository with existing commits. |
| `git remote -v` | This reads local configuration; it does not connect to a server. |
| `git ls-files` | The command lists tracked paths even when a working-tree file has been deleted. |
| `git show --stat HEAD` | The --stat option summarizes changed paths and line counts instead of a full patch. |

## NETWORK DIAGNOSTICS (10 commands)

A fictional office reports a connectivity issue. Compare local interface, routing, name resolution and connection checks across platforms without contacting a real device.

**Note:** Some utilities are platform-specific or optional. The addresses are documentation examples and domains are illustrative. Every step is simulated, independent and never sends traffic.

| Command | What it does |
| --- | --- |
| `ip addr show` | The ip tool is part of iproute2; this view lists addresses and interface state. |
| `ip route show` | A default route identifies the usual next hop for destinations without a more specific route. |
| `ipconfig /all` | Shows adapter addresses, gateways, DNS servers and DHCP details when available. |
| `Get-NetIPConfiguration` | Returns structured interface, IP, gateway and DNS information. |
| `ifconfig` | The command without modification arguments reports interface state and addresses. |
| `route -n get default` | The get subcommand requests information about a route; -n avoids name resolution. |
| `nslookup example.com` | A real lookup sends a DNS query; this lesson shows fictional response data. |
| `ping -c 4 192.0.2.1` | The -c option limits the number of requests; the address is reserved for documentation. |
| `ping -n 4 192.0.2.1` | Windows ping uses -n for a request count instead of the Unix-style -c flag. |
| `Test-NetConnection example.com -Port 443` | The cmdlet can report DNS, remote address and whether the TCP connection succeeded. |
