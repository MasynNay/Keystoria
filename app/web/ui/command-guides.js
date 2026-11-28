/** Practical, reviewed examples for the Field Academy. Same sequence as LESSONS.
 * These are teaching explanations, not executable commands. */
export const COMMAND_GUIDES = {
  "linux": [
    {
      "use": "You SSH into a server and cannot remember which folder you are in. Run pwd before reading or changing files.",
      "benefit": "It keeps relative paths predictable. A mistaken working directory can make a safe command operate on the wrong files.",
      "caution": "pwd only reports location; it will not move you or change anything."
    },
    {
      "use": "A web application suddenly fails and you suspect a hidden .env file or wrong permissions in the deployment directory.",
      "benefit": "ls -la reveals hidden configuration files, ownership, access bits, file sizes, and modification timestamps in one view.",
      "caution": "It lists the selected directory, not every nested folder. Hidden files may contain credentials; do not share them."
    },
    {
      "use": "You are deep inside /var/log/nginx and need to return to /var/log before inspecting another service.",
      "benefit": "cd .. changes context by exactly one directory, so following relative commands run from the right place.",
      "caution": "cd changes state only in your current shell. Use pwd afterward if you are unsure where you landed."
    },
    {
      "use": "You are starting a small deployment and need a dedicated directory for code or logs.",
      "benefit": "mkdir projects makes a container for related work, reducing clutter and making backups easier to organize.",
      "caution": "Without -p, the parent must exist and an existing projects folder usually causes an error."
    },
    {
      "use": "You need an empty marker file or want to test whether a directory is writable.",
      "benefit": "touch can create an empty file quickly or refresh timestamps without opening an editor.",
      "caution": "On existing files, it updates the modification time; this may affect tools that watch file timestamps."
    },
    {
      "use": "Before editing notes.txt, create a second copy to preserve the original.",
      "benefit": "cp lets you experiment on backup.txt while leaving the original notes intact.",
      "caution": "The command can overwrite an existing destination. Check paths first; it is not a versioned backup system."
    },
    {
      "use": "You want to rename a completed log or move it into an archive directory.",
      "benefit": "mv changes the name or path without manually copying and deleting files.",
      "caution": "Moving across filesystems may take time and overwrite targets; verify where the source and destination point."
    },
    {
      "use": "A configuration file is small and you want to see its entire contents at once.",
      "benefit": "cat quickly prints text to stdout, so you can inspect a file without modifying it.",
      "caution": "Large files can flood the terminal, and sensitive data may appear in your scrollback."
    },
    {
      "use": "An application reports an error and you need to find matching log messages.",
      "benefit": "grep filters lines using a pattern, reducing thousands of log messages to the relevant lines.",
      "caution": "Basic matching is case-sensitive and a literal quoted word is not the same as a full-text search engine."
    },
    {
      "use": "You do not know where an application is saving its .log files within your project.",
      "benefit": "find recursively searches paths, helping you discover relevant diagnostics before opening individual files.",
      "caution": "Large directory trees can make the search slow. Quoted globs prevent premature shell expansion."
    },
    {
      "use": "A server is using too much CPU and you want to know which processes are running.",
      "benefit": "ps aux lists processes and resource columns that help spot unexpected workloads.",
      "caution": "It is a snapshot, not a continuous monitor; prefer top for ongoing observation."
    },
    {
      "use": "A service cannot write files and you suspect the disk has filled up.",
      "benefit": "df -h shows filesystem capacity and free space, helping you separate storage exhaustion from app bugs.",
      "caution": "It reports mounted filesystem space, not the size of an individual folder; use du for that."
    },
    {
      "use": "A trusted script in your project is marked as non-executable and you want to run it directly later.",
      "benefit": "chmod u+x grants execute permission to the owner without making the script executable for everyone.",
      "caution": "Permission changes affect security. Inspect any script before deciding to execute it."
    },
    {
      "use": "You inherited an unfamiliar ls flag from a teammate and need an authoritative explanation.",
      "benefit": "man ls opens installed system documentation and lists options without needing a browser.",
      "caution": "Manual pages vary by OS and installed version; press q to exit the pager."
    }
  ],
  "windows": [
    {
      "use": "You open PowerShell as an administrator and want to verify which directory your commands will affect.",
      "benefit": "Get-Location prints the active provider path so you can avoid accidentally changing files in the wrong location.",
      "caution": "It reports a location rather than changing it; other PowerShell providers can also have locations."
    },
    {
      "use": "You are checking whether a software installer left files behind after an upgrade.",
      "benefit": "Get-ChildItem lists files and folders as structured objects, enabling filters and pipelines later.",
      "caution": "Without -Force it may omit hidden items; listing a path does not tell you whether you have permission to modify it."
    },
    {
      "use": "You are inside a nested folder and need to return to its parent before examining other directories.",
      "benefit": "Set-Location .. moves the shell context up one folder, equivalent to using cd .. in many shells.",
      "caution": "Relative paths in your next command are based on this new location."
    },
    {
      "use": "You need a directory to stage installation logs before troubleshooting a workstation.",
      "benefit": "New-Item creates the requested Directory object and gives scripts a predictable output location.",
      "caution": "The command may fail if the folder already exists; check before writing into a shared location."
    },
    {
      "use": "You want a placeholder notes.txt file for documenting an investigation.",
      "benefit": "New-Item creates the new item so subsequent commands can read or append to it.",
      "caution": "Creating files can fail on read-only paths and may conflict with an existing file."
    },
    {
      "use": "You plan to modify a configuration file and want a safety copy first.",
      "benefit": "Copy-Item retains a second version that can be compared or restored after a change.",
      "caution": "An existing destination may require confirmation or be overwritten depending on options; review paths."
    },
    {
      "use": "You want to rename an exported report after a successful run.",
      "benefit": "Move-Item can rename or relocate files while keeping your automation organized.",
      "caution": "Destination permissions and collisions matter. Use -WhatIf in scripts when supported."
    },
    {
      "use": "An application log contains errors and you want to inspect the raw lines in PowerShell.",
      "benefit": "Get-Content streams file contents into the pipeline, where other cmdlets can search or filter them.",
      "caution": "Large files can produce huge output. Consider -Tail for recent log lines."
    },
    {
      "use": "You need to find repeated failures in a specific Windows application log file.",
      "benefit": "Select-String locates text matches and reports line context that can be used in incident reports.",
      "caution": "It searches the provided files, not the Windows Event Log unless you export its contents."
    },
    {
      "use": "A workstation feels slow and you want to see running programs before deciding on a fix.",
      "benefit": "Get-Process returns real objects with process names and memory information rather than raw text.",
      "caution": "Merely listing processes is safe; stopping them requires a different command and can disrupt users."
    },
    {
      "use": "A service-backed app is not working and you want to check whether its service is running.",
      "benefit": "Get-Service shows states of installed services, helping distinguish stopped services from broken apps.",
      "caution": "It does not itself tell you why the service stopped. Check Event Viewer or logs for the cause."
    },
    {
      "use": "A setup script should only attempt to read a configuration file if it exists.",
      "benefit": "Test-Path returns a Boolean that prevents unnecessary failures in scripts and repair routines.",
      "caution": "A true result does not guarantee that you have permission to read or modify the file."
    },
    {
      "use": "You are unfamiliar with a cmdlet and want to see supported parameters on the computer you manage.",
      "benefit": "Get-Help provides local reference information so scripts use the correct syntax for that PowerShell version.",
      "caution": "Help may be incomplete until Update-Help is run; online help can be newer."
    },
    {
      "use": "Your terminal is cluttered with earlier commands and you want a clean working display.",
      "benefit": "Clear-Host clears the visible console so it is easier to concentrate on the current diagnostic step.",
      "caution": "This does not delete files, processes, transcript logs, or shell history."
    }
  ],
  "macos": [
    {
      "use": "You open Terminal on a Mac and want to know whether you are inside Downloads or your project directory.",
      "benefit": "pwd identifies your current folder so relative commands act on the intended location.",
      "caution": "It only prints a path and does not navigate for you."
    },
    {
      "use": "You suspect a hidden .zshrc or ownership problem is affecting Terminal configuration.",
      "benefit": "ls -la makes dotfiles and permission information visible when normal Finder views may not.",
      "caution": "It can reveal sensitive dotfiles. Avoid pasting configuration with secrets into public chats."
    },
    {
      "use": "You were working in a nested project directory and need to move back to its parent.",
      "benefit": "cd .. keeps navigation quick when moving around local files from a terminal.",
      "caution": "Verify with pwd before a command that changes or deletes files."
    },
    {
      "use": "You are organizing a new Mac development workspace and need a projects folder.",
      "benefit": "mkdir projects makes a predictable place for repositories and experiment files.",
      "caution": "An existing folder or missing parent directory can cause an error."
    },
    {
      "use": "You need an empty notes file for a short development checklist.",
      "benefit": "touch creates a file without launching TextEdit or another GUI application.",
      "caution": "It also updates timestamps on existing files, which can matter for build systems."
    },
    {
      "use": "Before adjusting a plist or another text file, you want a spare copy.",
      "benefit": "cp preserves an independent file that can be opened and compared after making changes.",
      "caution": "Be careful not to overwrite a destination copy you intended to preserve."
    },
    {
      "use": "You want to rename an old export from backup.txt to archive.txt.",
      "benefit": "mv renames or moves files directly in Terminal, making automation and cleanup straightforward.",
      "caution": "A wrong destination path can move something unexpectedly; check both arguments."
    },
    {
      "use": "You want to quickly see a short script or note from the terminal.",
      "benefit": "cat displays its contents without opening a new application window.",
      "caution": "Avoid printing secret-bearing configuration files when recording your screen."
    },
    {
      "use": "A Mac app logs recurring errors and you need to narrow down matching lines in a text log.",
      "benefit": "grep helps find failure patterns without reading the entire file manually.",
      "caution": "By default, matches are case-sensitive; use proper flags only after checking their meaning."
    },
    {
      "use": "A project created diagnostic .log files somewhere below the current folder.",
      "benefit": "find searches its directory tree, which saves time when you cannot remember file locations.",
      "caution": "Large searches can be slow and may encounter folders you cannot access."
    },
    {
      "use": "You want to open a terminal project directory in Finder to drag a file into it.",
      "benefit": "open . bridges the command line and Finder, opening the current directory in a graphical window.",
      "caution": "The dot means the current location, so check pwd if the wrong folder opens."
    },
    {
      "use": "You are checking whether a Mac meets a software installer’s minimum supported OS version.",
      "benefit": "sw_vers prints the system product name, product version, and build, useful for compatibility checks.",
      "caution": "It reports the installed OS, not whether every app or driver is compatible."
    },
    {
      "use": "You need to document a bug with a screenshot and want to choose the exact region.",
      "benefit": "screencapture -i saves a selected screen area without requiring a separate screenshot utility.",
      "caution": "Screenshots can contain private information; review them before sharing."
    },
    {
      "use": "You are writing a script that opens an app and need to understand options for the macOS open utility.",
      "benefit": "man open displays the local documentation for the exact command installed on your Mac.",
      "caution": "macOS tools may have flags that differ from Linux. Press q to leave the manual."
    }
  ],
  git: [
  {
    "use": "Before following Git documentation, check the installed version.",
    "benefit": "Helps identify compatibility with command options.",
    "caution": "A version number does not confirm a repository is initialized."
  },
  {
    "use": "Before a commit, inspect what has changed.",
    "benefit": "Quickly identifies work that needs review.",
    "caution": "This does not show the actual edits or stage anything."
  },
  {
    "use": "Before editing a shared project, verify your branch.",
    "benefit": "Reduces confusion about where changes will land.",
    "caution": "An empty result may mean detached HEAD."
  },
  {
    "use": "Inspect existing branch names before starting a task.",
    "benefit": "Shows local and known remote-tracking branches.",
    "caution": "It does not fetch the latest remote state."
  },
  {
    "use": "Find a recent change relevant to a bug.",
    "benefit": "Provides a quick history overview.",
    "caution": "Short hashes are abbreviations, not full commit IDs."
  },
  {
    "use": "Review your unstaged edits before deciding what to stage.",
    "benefit": "Shows exact changed lines in tracked files.",
    "caution": "Untracked content and already staged changes are not shown by default."
  },
  {
    "use": "Double-check the content of a planned commit.",
    "benefit": "Helps catch accidental staged changes.",
    "caution": "Do not assume the staging area includes every working-tree change."
  },
  {
    "use": "Confirm a project's configured remote before network operations.",
    "benefit": "Distinguishes similarly named repositories.",
    "caution": "Remote URLs can contain credentials; do not share them unreviewed."
  },
  {
    "use": "Check whether a file is tracked by Git.",
    "benefit": "Separates tracked paths from ignored or untracked content.",
    "caution": "It does not show every file on disk."
  },
  {
    "use": "Review the scope of the latest commit.",
    "benefit": "Useful for quickly understanding a change.",
    "caution": "A stat summary does not reveal the full diff."
  }
],
  network: [
  {
    "use": "On Linux, check which address is assigned to an interface.",
    "benefit": "Helps distinguish local configuration problems.",
    "caution": "Requires iproute2; an assigned address does not guarantee connectivity."
  },
  {
    "use": "Check whether a Linux machine has a default gateway.",
    "benefit": "Shows the route selection context.",
    "caution": "A listed gateway may still be unreachable."
  },
  {
    "use": "Review the configuration of a Windows workstation.",
    "benefit": "Helps compare expected DHCP and DNS settings.",
    "caution": "This can reveal local network details; review before sharing."
  },
  {
    "use": "Inspect adapter settings from PowerShell.",
    "benefit": "Provides structured configuration information.",
    "caution": "This Windows cmdlet is not generally available on Linux or macOS."
  },
  {
    "use": "Inspect the active interface on a Mac.",
    "benefit": "Helps identify address and link state.",
    "caution": "Linux may use ip instead; this example uses macOS-style output."
  },
  {
    "use": "Find the default gateway on a Mac.",
    "benefit": "Clarifies which interface carries ordinary traffic.",
    "caution": "This syntax is macOS/BSD-specific, not Linux ip route."
  },
  {
    "use": "Check whether a hostname can be resolved.",
    "benefit": "Helps separate DNS problems from other connection failures.",
    "caution": "DNS results may vary; a resolved address does not prove service availability."
  },
  {
    "use": "For an authorized network, check basic reachability.",
    "benefit": "Provides a simple latency and packet-loss indication.",
    "caution": "ICMP may be blocked; failure alone does not establish that a host is offline."
  },
  {
    "use": "Compare the Windows syntax with Linux/macOS.",
    "benefit": "Prevents using the wrong platform-specific flag.",
    "caution": "Only test devices you are authorized to contact."
  },
  {
    "use": "On Windows, distinguish TCP connection issues from basic ping results.",
    "benefit": "Tests a specific service port rather than only ICMP.",
    "caution": "A successful TCP connection does not verify application behavior, authentication or TLS trust."
  }
],
  docker: [
  {
    "use": "When diagnosing an installation, compare the client and engine versions.",
    "benefit": "Distinguishes CLI availability from engine availability.",
    "caution": "Access to the Docker daemon can be highly privileged."
  },
  {
    "use": "Look for a service that exited unexpectedly.",
    "benefit": "Reveals status and container names before further inspection.",
    "caution": "An exited container may be an intentionally completed job."
  },
  {
    "use": "Review which application images are present locally.",
    "benefit": "Useful for inventory and checking expected image tags.",
    "caution": "This list does not check remote registry updates."
  },
  {
    "use": "Investigate startup or application problems.",
    "benefit": "Limits initial output to a manageable sample.",
    "caution": "Logs can contain sensitive data; review before sharing."
  },
  {
    "use": "Check the current state without printing the entire inspection document.",
    "benefit": "A focused field reduces clutter and exposure of unrelated details.",
    "caution": "A running process does not guarantee a healthy application."
  },
  {
    "use": "Investigate whether containers appear resource constrained.",
    "benefit": "Offers a quick CPU and memory snapshot.",
    "caution": "A single sample does not represent sustained utilization."
  },
  {
    "use": "Identify the network objects available to containers.",
    "benefit": "Helps plan further connectivity inspection.",
    "caution": "It does not prove two particular containers can communicate."
  },
  {
    "use": "Identify persistent storage attached to a deployment.",
    "benefit": "Separates volume inventory from container lifecycle.",
    "caution": "A listed volume is not evidence of a working backup."
  },
  {
    "use": "Review a multi-container application from its project directory.",
    "benefit": "Shows the relationship between services and their containers.",
    "caution": "Use the correct project context; this does not list every engine container."
  },
  {
    "use": "Assess disk use before considering cleanup.",
    "benefit": "Identifies which classes of objects consume storage.",
    "caution": "Reclaimable does not mean safe to delete; verify dependencies and backups first."
  }
],
  sql: [
  {
    "use": "Create a simple inventory view without displaying unnecessary columns.",
    "benefit": "Returns only fields relevant to the report.",
    "caution": "Without ORDER BY, row order is not guaranteed."
  },
  {
    "use": "Identify items that may require replenishment.",
    "benefit": "Filters the report to a specific condition.",
    "caution": "A quantity of exactly ten is excluded."
  },
  {
    "use": "Review the most expensive inventory items first.",
    "benefit": "Provides an understandable ranking.",
    "caution": "Add a second sort column for deterministic ordering of ties."
  },
  {
    "use": "Preview a small table before examining more rows.",
    "benefit": "Keeps sample results compact.",
    "caution": "LIMIT is not a random sample and syntax differs across database engines."
  },
  {
    "use": "Discover which categories exist in an inventory table.",
    "benefit": "Avoids repeated values in a simple category list.",
    "caution": "It does not count items per category."
  },
  {
    "use": "Check the number of inventory records.",
    "benefit": "Useful as a quick report baseline.",
    "caution": "The row count is not the number of physical units."
  },
  {
    "use": "Calculate the total number of units represented by the records.",
    "benefit": "Aggregates numeric values instead of counting records.",
    "caution": "Missing quantities can make the total incomplete."
  },
  {
    "use": "Compare inventory record counts across categories.",
    "benefit": "Produces compact summaries rather than individual rows.",
    "caution": "Groups are not guaranteed to appear in a particular order."
  },
  {
    "use": "Find inventory names with a common prefix.",
    "benefit": "Useful when a full exact value is unknown.",
    "caution": "Case behavior varies by database and settings; wildcards are not regular expressions."
  },
  {
    "use": "Combine stored category labels with inventory names.",
    "benefit": "Retrieves related information without duplicating labels in every item record.",
    "caution": "Non-unique matching keys can multiply result rows."
  }
],
  python: [
  {
    "use": "Check the interpreter before reproducing an issue.",
    "benefit": "Distinguishes environments with different language versions.",
    "caution": "The command name may select a different interpreter on another machine."
  },
  {
    "use": "Check which environment owns pip.",
    "benefit": "Helps avoid inspecting the wrong environment.",
    "caution": "pip may not be installed for every interpreter."
  },
  {
    "use": "Inventory dependencies before debugging.",
    "benefit": "Shows the environment's installed package versions.",
    "caution": "It is not a list of all available packages."
  },
  {
    "use": "Find which installed release provides a dependency.",
    "benefit": "Links the version to the environment location.",
    "caution": "Metadata does not establish that importing the package succeeds."
  },
  {
    "use": "Investigate dependency conflicts after an environment change.",
    "benefit": "Identifies declared dependency inconsistencies.",
    "caution": "A clean result cannot guarantee runtime compatibility."
  },
  {
    "use": "Review versions when comparing environments.",
    "benefit": "Produces a compact dependency snapshot.",
    "caution": "Output may contain local paths or private URLs; review before sharing."
  },
  {
    "use": "Investigate why an import resolves unexpectedly.",
    "benefit": "Shows where Python looks for modules.",
    "caution": "Paths can contain private account or project names."
  },
  {
    "use": "Look up path handling APIs without opening a browser.",
    "benefit": "Connects documentation to the installed Python version.",
    "caution": "Only inspect trusted modules; pydoc may import them."
  },
  {
    "use": "Learn options before creating a virtual environment.",
    "benefit": "Explains supported flags without creating an environment.",
    "caution": "Do not confuse the help invocation with a real environment creation."
  },
  {
    "use": "Review how to select tests before executing them.",
    "benefit": "Helps distinguish test discovery from an explicit selection.",
    "caution": "A real test run can execute project code."
  }
],
  services: [
  {
    "use": "Check compatibility before following a troubleshooting guide.",
    "benefit": "Identifies the installed tool version.",
    "caution": "Not every Linux distribution uses systemd."
  },
  {
    "use": "Start with a broad health check.",
    "benefit": "Indicates whether further failed-unit investigation is useful.",
    "caution": "Degraded does not identify the cause or severity."
  },
  {
    "use": "Identify failures before inspecting individual units.",
    "benefit": "Narrows investigation to failed units.",
    "caution": "A failed unit may be unrelated to the reported symptom."
  },
  {
    "use": "Review a failing service before making changes.",
    "benefit": "Provides a quick summary of state and failure result.",
    "caution": "Status can contain sensitive command arguments or logs."
  },
  {
    "use": "Check whether a unit currently runs.",
    "benefit": "Offers a compact runtime state indication.",
    "caution": "An active service is not necessarily healthy."
  },
  {
    "use": "Determine whether startup configuration is expected.",
    "benefit": "Separates boot configuration from current failure.",
    "caution": "Enabled does not guarantee a successful startup."
  },
  {
    "use": "Look for errors near a service failure.",
    "benefit": "Connects application events to systemd state.",
    "caution": "Logs may contain secrets; review before sharing."
  },
  {
    "use": "Check for broader warnings during an incident.",
    "benefit": "Provides context beyond one service.",
    "caution": "Warnings are not always actionable or related."
  },
  {
    "use": "Determine whether a prior boot can be investigated.",
    "benefit": "Shows the boot IDs available in retained logs.",
    "caution": "Retention and permissions can limit history."
  },
  {
    "use": "Confirm the recorded failure before deciding next steps.",
    "benefit": "Provides a focused, reproducible state summary.",
    "caution": "An exit status alone does not explain the underlying application error."
  }
],
};
