/** Curated, safe command-reference lessons. These commands are displayed, never executed. */
const command = (text, title, summary, detail) => ({ text, title, summary, detail });

export const LESSONS = {
  linux: {
    name: "LINUX TERMINAL", label: "LINUX / BASH", icon: ">_", number: "01",
    story: "A remote research server has gone offline. You're the newest systems operator. Work through an incident-response checklist and learn the commands you'd use to inspect files and diagnose the machine.",
    objective: "Explore files, inspect logs, and understand the system without changing a live machine.",
    note: "Bash is a common Linux shell. Filenames are usually case-sensitive. Example files and folders in this simulation are hypothetical.",
    commands: [
      command("pwd", "Where am I?", "Print the current directory.", "pwd stands for print working directory. It tells you which folder your shell is currently using."),
      command("ls -la", "See what's here", "List files, including hidden entries and details.", "-l shows permissions, ownership, and timestamps; -a includes names beginning with a dot."),
      command("cd ..", "Go up one level", "Move to the parent directory.", ".. means the folder above your current one. cd changes the shell's working directory."),
      command("mkdir projects", "Make a folder", "Create a directory named projects.", "mkdir creates a directory. If projects already exists, the command normally reports an error."),
      command("touch notes.txt", "Create a file", "Create an empty file or update its modification time.", "touch creates notes.txt if it does not exist. If it does, touch updates its timestamp."),
      command("cp notes.txt backup.txt", "Copy safely", "Copy a file to a second name.", "cp copies a source file to a destination. A real run could overwrite backup.txt, so verify the destination first."),
      command("mv backup.txt archive.txt", "Rename a file", "Move or rename an existing file.", "mv renames backup.txt to archive.txt in this example. It can also move files between directories."),
      command("cat notes.txt", "Read file contents", "Print a text file to the terminal.", "cat outputs the file's contents. For long files, less is usually easier to navigate."),
      command('grep "error" app.log', "Find an error", "Search text lines containing error.", "grep searches for a matching pattern in a file. By default, matching is case-sensitive."),
      command('find . -name "*.log"', "Locate log files", "Search below the current folder for .log files.", "find traverses directories. The dot means start here; -name matches a filename pattern."),
      command("ps aux", "Inspect processes", "Show a broad list of running processes.", "ps lists processes; aux is a commonly used BSD-style option set on Linux."),
      command("df -h", "Check disk space", "Display mounted filesystem capacity in readable units.", "df reports filesystem usage. -h requests human-readable size units such as GiB."),
      command("chmod u+x script.sh", "Mark executable", "Give the file owner execute permission.", "chmod changes permissions. u+x adds the executable bit for the file owner; it does not run the script."),
      command("man ls", "Use the manual", "Open the manual page for ls.", "man lets you research command flags directly from installed documentation. Press q to exit the pager."),
    ],
  },
  windows: {
    name: "WINDOWS POWERSHELL", label: "WINDOWS / POWERSHELL", icon: "PS", number: "02",
    story: "A workstation is behaving strangely after a software rollout. You're at the PowerShell console, collecting evidence and checking services. Learn practical administrative inspection commands without touching your real PC.",
    objective: "Navigate folders, inspect files and processes, and learn how PowerShell differs from Command Prompt.",
    note: "This course uses PowerShell, not cmd.exe. Cmdlets use Verb-Noun names; parameters often have full descriptive names.",
    commands: [
      command("Get-Location", "Where am I?", "Print the current PowerShell location.", "Get-Location returns the current directory or provider location, similar to pwd on Unix."),
      command("Get-ChildItem", "List files", "List items in the current directory.", "Get-ChildItem is the PowerShell equivalent of listing directory contents. Its common alias is dir."),
      command("Set-Location ..", "Go up a folder", "Change to the parent directory.", "Set-Location changes where commands operate. The common alias is cd."),
      command("New-Item -ItemType Directory -Name Projects", "Create a folder", "Create a directory called Projects.", "New-Item creates filesystem objects. -ItemType Directory specifies a folder."),
      command("New-Item -ItemType File -Name notes.txt", "Create a file", "Create an empty text file.", "New-Item creates notes.txt in the current folder. A real command may fail if the item already exists."),
      command("Copy-Item notes.txt backup.txt", "Back up a file", "Copy notes.txt to backup.txt.", "Copy-Item makes another copy of an item. Verify paths and existing files before running on a real system."),
      command("Move-Item backup.txt archive.txt", "Rename a file", "Move or rename an item.", "Move-Item can rename or relocate an item; this example renames the file in the same directory."),
      command("Get-Content notes.txt", "Read text", "Show a file's text contents.", "Get-Content reads lines from a file, making them available to the PowerShell pipeline."),
      command('Select-String -Path app.log -Pattern "error"', "Search logs", "Find matching text inside a log file.", "Select-String searches text and returns matching lines, often including line numbers."),
      command("Get-Process", "Inspect applications", "List running processes.", "Get-Process returns structured process objects that can be filtered or sorted."),
      command("Get-Service", "Inspect services", "List installed Windows services and their states.", "Get-Service shows information such as Running and Stopped. It does not alter services."),
      command("Test-Path notes.txt", "Does it exist?", "Return True or False based on whether the path exists.", "Test-Path checks a path without opening the file."),
      command("Get-Help Get-ChildItem", "Find documentation", "Show local help for a PowerShell command.", "Get-Help explains parameters and usage. Some help files may need to be updated separately."),
      command("Clear-Host", "Clear the screen", "Clear the visible terminal display.", "Clear-Host cleans up the terminal screen. It does not delete files or shell history."),
    ],
  },
  macos: {
    name: "MACOS TERMINAL", label: "MACOS / ZSH", icon: "⌘", number: "03",
    story: "A studio Mac needs a quick diagnostic pass before a production deadline. You're at the built-in Terminal using zsh, macOS's default interactive shell on modern releases. Learn Unix basics and Mac-specific shortcuts.",
    objective: "Explore folders, inspect files, and use macOS-specific utilities safely.",
    note: "Many macOS commands look like Linux, but Apple includes BSD-style utilities and its own tools. These example files are simulated.",
    commands: [
      command("pwd", "Locate yourself", "Print the current working directory.", "Shows the current folder used by the shell."),
      command("ls -la", "Inspect a folder", "List entries including hidden files and permissions.", "-l provides details and -a shows dotfiles such as .zshrc."),
      command("cd ..", "Go to parent", "Move one directory upward.", "The two dots refer to the parent directory; cd changes the current directory."),
      command("mkdir projects", "Create a workspace", "Create a new projects folder.", "mkdir creates the directory in your current location."),
      command("touch notes.txt", "Make a note file", "Create an empty file or refresh its timestamp.", "touch does not open a text editor; it creates a file if needed."),
      command("cp notes.txt backup.txt", "Duplicate a file", "Copy notes.txt as backup.txt.", "cp duplicates the source; a real run can overwrite an existing destination."),
      command("mv backup.txt archive.txt", "Rename a file", "Rename or move a file.", "mv can move files between folders or give them a new name."),
      command("cat notes.txt", "Display text", "Print the contents of a text file.", "cat works well for short files, while less is useful for larger ones."),
      command('grep "error" app.log', "Inspect logs", "Show log lines containing the word error.", "grep searches text using patterns and is case-sensitive by default."),
      command('find . -name "*.log"', "Find diagnostics", "Find .log files inside the current directory tree.", "find walks subdirectories recursively; quoted patterns prevent the shell from expanding them early."),
      command("open .", "Open Finder", "Open the current folder in Finder.", "open is a macOS command that launches files, folders, or URLs using their default applications."),
      command("sw_vers", "Identify macOS", "Show the installed macOS product name and version.", "sw_vers is a macOS-specific system version command."),
      command("screencapture -i screenshot.png", "Capture a region", "Interactively choose a screen region to save as an image.", "-i activates interactive capture. Running it for real opens the selection interface."),
      command("man open", "Read native help", "Open the manual page for the open command.", "Manual pages explain system flags; use q to leave the manual viewer."),
    ],
  },
  git: {
    name: "GIT FUNDAMENTALS", label: "VERSION CONTROL / GIT", icon: "GIT", number: "04",
    story: "A team is preparing a release in a shared project. Inspect the repository, understand its changes and review its history before deciding what to do next.",
    objective: "Learn to inspect branches, changes, commits and tracked files without changing project history.",
    note: "Git must be installed and most commands run inside a repository. Each simulated step is independent; nothing is committed, pushed or executed.",
    commands: [
      command("git --version", "Check Git version", "Display the installed Git version.", "Use this command to confirm Git is installed and identify the version before troubleshooting."),
      command("git status --short", "Inspect working changes", "Show a compact summary of changed and untracked files.", "Two status columns distinguish index changes from working-tree changes; ?? marks an untracked path."),
      command("git branch --show-current", "Identify the branch", "Print the currently checked-out branch name.", "The output is empty when HEAD is detached; this command does not switch branches."),
      command("git branch -a", "List branches", "List local and remote-tracking branches.", "The asterisk identifies the current local branch; remote-tracking refs reflect the last fetched state."),
      command("git log --oneline -5", "Review recent commits", "Show up to five recent commits in condensed form.", "Each line includes an abbreviated commit identifier and the commit subject."),
      command("git diff", "Review unstaged edits", "Display unstaged changes to tracked files.", "By default git diff compares the working tree with the index; it excludes untracked files."),
      command("git diff --staged", "Review staged edits", "Show changes staged for the next commit.", "This compares the index with HEAD in a repository with existing commits."),
      command("git remote -v", "Inspect remote addresses", "List configured remotes and their fetch/push URLs.", "This reads local configuration; it does not connect to a server."),
      command("git ls-files", "List tracked files", "List paths tracked in the Git index.", "The command lists tracked paths even when a working-tree file has been deleted."),
      command("git show --stat HEAD", "Inspect latest commit", "Display the current commit and a summary of affected files.", "The --stat option summarizes changed paths and line counts instead of a full patch."),
    ],
  },
  network: {
    name: "NETWORK DIAGNOSTICS", label: "CONNECTIVITY / MIXED PLATFORMS", icon: "NET", number: "05",
    story: "A fictional office reports a connectivity issue. Compare local interface, routing, name resolution and connection checks across platforms without contacting a real device.",
    objective: "Learn safe, platform-specific network inspection and interpret the limits of connectivity checks.",
    note: "Some utilities are platform-specific or optional. The addresses are documentation examples and domains are illustrative. Every step is simulated, independent and never sends traffic.",
    commands: [
      command("ip addr show", "Linux interface addresses", "Show network interfaces and assigned addresses on Linux.", "The ip tool is part of iproute2; this view lists addresses and interface state."),
      command("ip route show", "Linux routing table", "Display the Linux routing table.", "A default route identifies the usual next hop for destinations without a more specific route."),
      command("ipconfig /all", "Windows interface configuration", "Display detailed Windows IP configuration.", "Shows adapter addresses, gateways, DNS servers and DHCP details when available."),
      command("Get-NetIPConfiguration", "PowerShell network summary", "Inspect network IP configuration on supported Windows systems.", "Returns structured interface, IP, gateway and DNS information."),
      command("ifconfig", "macOS interface overview", "Display interface configuration on macOS and systems with ifconfig.", "The command without modification arguments reports interface state and addresses."),
      command("route -n get default", "macOS default route", "Inspect the default route on macOS.", "The get subcommand requests information about a route; -n avoids name resolution."),
      command("nslookup example.com", "Check DNS resolution", "Request address information using the configured DNS service.", "A real lookup sends a DNS query; this lesson shows fictional response data."),
      command("ping -c 4 192.0.2.1", "Linux/macOS reachability", "Send four ICMP echo requests on Linux or macOS.", "The -c option limits the number of requests; the address is reserved for documentation."),
      command("ping -n 4 192.0.2.1", "Windows reachability", "Send four ICMP echo requests on Windows.", "Windows ping uses -n for a request count instead of the Unix-style -c flag."),
      command("Test-NetConnection example.com -Port 443", "Windows TCP connectivity", "Check connectivity to a specified TCP port using PowerShell.", "The cmdlet can report DNS, remote address and whether the TCP connection succeeded."),
    ],
  },
};

/** Generate an independent course order for each attempt. Reference materials keep
 * their canonical indexes, so descriptions and simulated output never mismatch.
 * Pass a deterministic generator from tests when reproducibility is needed.
 */
export function randomizedCourseOrder(os, random = Math.random) {
  if (!LESSONS[os]) throw new RangeError("Unknown Academy course");
  const order = LESSONS[os].commands.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.max(0, Math.min(i, Math.floor(random() * (i + 1))));
    [order[i], order[j]] = [order[j], order[i]];
  }
  // A very unlikely identity shuffle shouldn't make a replay seem unchanged.
  if (order.length > 1 && order.every((index, position) => index === position)) {
    [order[0], order[1]] = [order[1], order[0]];
  }
  return order;
}

/** Look up the canonical command index for the active step. */
export function activeCommandIndex(session) {
  return session?.order?.[session.index] ?? session.index;
}

export function savedLessons(storage = localStorage) {
  try {
    const value = JSON.parse(storage.getItem("panic.lessons.v1") || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

export function saveLesson(os, storage = localStorage) {
  if (!LESSONS[os]) return;
  try {
    const next = { ...savedLessons(storage), [os]: true };
    storage.setItem("panic.lessons.v1", JSON.stringify(next));
  } catch { /* Optional per-browser progress must never interrupt play. */ }
}

/** Spaces are normalized but command case is preserved for accurate shell practice. */
export function matchesCommand(input, expected) {
  return typeof input === "string" && input.trim().replace(/\s+/g, " ") === expected.trim().replace(/\s+/g, " ");
}
