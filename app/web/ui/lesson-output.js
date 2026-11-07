/** Illustrative outputs for the Academy's scripted lessons.
 *
 * Every line here is authored example content. Nothing is executed, even when
 * the learner enters a command that would have side effects in a real shell.
 * Items correspond to the ordered steps in lessons.js and are regression-tested.
 */
export const LESSON_OUTPUTS = {
  linux: [
    '/home/operator',
    'drwxr-xr-x  operator  operator  4096  projects\n-rw-r--r--  operator  operator   128  notes.txt\ndrwxr-xr-x  operator  operator  4096  .config',
    '(no output — working directory is now /home)',
    '(no output — projects/ directory created)',
    '(no output — notes.txt created or timestamp updated)',
    '(no output — backup.txt now contains a copy)',
    '(no output — backup.txt renamed to archive.txt)',
    'Diagnostics checklist\n- Inspect incident log\n- Check process state',
    'app.log: ERROR Failed to reach monitoring service\napp.log: ERROR Retry limit reached',
    './logs/app.log\n./logs/system.log',
    'USER     PID  %CPU  %MEM  COMMAND\noperator  731   0.4   0.2  bash\nroot        1   0.1   0.1  systemd',
    'Filesystem      Size  Used  Avail  Use%\n/dev/sda2       80G   31G    45G   41%',
    '(no output — owner execute bit enabled on script.sh)',
    'LS(1)                 User Commands\nNAME\n    ls - list directory contents',
  ],
  windows: [
    'Path\n----\nC:\\Training',
    'Directory: C:\\Training\nMode      Name\nd-----    Projects\n-a----    notes.txt',
    '(no output — current directory changed)',
    'Directory: C:\\Training\nName        ItemType\nProjects    Directory',
    'Directory: C:\\Training\nName        ItemType\nnotes.txt   File',
    '(no output — backup.txt created)',
    '(no output — backup.txt renamed to archive.txt)',
    'Diagnostics checklist: check services and logs',
    'app.log:21: ERROR Deployment check failed\napp.log:37: ERROR Service unavailable',
    'Handles  NPM(K)  CPU(s)  Id    ProcessName\n    164      12    0.7  3812   explorer',
    'Status   Name            DisplayName\nRunning  EventLog        Windows Event Log\nStopped  Spooler         Print Spooler',
    'True',
    'NAME\n    Get-ChildItem\nSYNOPSIS\n    Gets items in one or more locations.',
    '(no output — terminal display cleared)',
  ],
  macos: [
    '/Users/operator',
    'drwxr-xr-x  operator  staff  128  projects\n-rw-r--r--  operator  staff   64  notes.txt\n-rw-------  operator  staff  419  .zshrc',
    '(no output — current directory changed)',
    '(no output — projects/ created)',
    '(no output — notes.txt created or timestamp updated)',
    '(no output — backup.txt now exists)',
    '(no output — backup.txt renamed to archive.txt)',
    'Studio checklist\n- Inspect launch log\n- Confirm OS build',
    'app.log: ERROR Missing configuration key',
    './Logs/studio.log\n./Logs/app.log',
    '(Finder opens to the current directory)',
    'ProductName:    macOS\nProductVersion: 26.0\nBuildVersion:   24A335',
    '(interactive region selector appears; a screenshot is saved)',
    'OPEN(1)                 General Commands\nNAME\n    open - open files and directories',
  ],
};
