# Build 5.1: GitHub Setup + Your First Module Repo

This build is intentionally simple.

You are not building an AI app yet.
You are building the system you will use for every future module project.

By the end of this lesson, you will have:

- a GitHub account
- Git installed on your computer
- VS Code installed
- one practice repo on GitHub
- one local project folder on your computer
- your first commit pushed online

## Why this matters

For this course, the cleanest workflow is:

- one GitHub repo per module project
- one clear README per repo
- regular commits as checkpoints

That gives you three advantages:

1. Your work is backed up.
2. Your projects stay organized.
3. You build a portfolio while you learn.

## Repo naming pattern for the course

Use a simple naming pattern like this:

- `ai-course-module-02-finance`
- `ai-course-module-03-startup`
- `ai-course-module-04-small-business`
- `ai-course-module-05-real-estate`
- `ai-course-module-06-executive`
- `ai-course-module-07-creative`

For this lesson, you will make one practice repo called:

- `ai-course-starter`

Later, each real module build should get its own repo.

## Part 1: Create your GitHub account

1. Go to `https://github.com/signup`
2. Create your account.
3. Verify your email.
4. Turn on two-factor authentication if GitHub asks. Do it.
5. Sign in and make sure you can see the GitHub dashboard.

## Part 2: Create your practice repo

1. In GitHub, click `New repository`.
2. Repository name: `ai-course-starter`
3. Visibility: `Public` or `Private`
4. Check `Add a README file`
5. Click `Create repository`

When the repo is created, leave that browser tab open.

## Part 3: Choose your setup path

Pick one path only:

- Windows
- macOS
- Linux

## Windows Setup

### 1. Install Git

Open PowerShell and run:

```powershell
winget install --id Git.Git -e
```

Check that Git works:

```powershell
git --version
```

### 2. Install VS Code

In PowerShell:

```powershell
winget install --id Microsoft.VisualStudioCode -e
```

If `code` does not work later, close PowerShell and open it again.

### 3. Clone your repo

In PowerShell:

```powershell
cd $HOME\Desktop
git clone https://github.com/YOUR_USERNAME/ai-course-starter.git
cd ai-course-starter
code .
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### 4. Add one simple project note

Create a notes folder and a progress file:

```powershell
New-Item -ItemType Directory -Path notes -Force | Out-Null
"GitHub setup complete. Ready for future module repos." | Set-Content notes\progress.txt
```

### 5. Update README

Replace the README with this:

```powershell
@"
# AI Course Starter

This repo is my practice repo for the AI Integration Course.

## What I completed
- GitHub account created
- Git installed
- VS Code installed
- Local repo cloned
- First commit pushed

## Repo rule for this course
Each module project gets its own GitHub repo.
"@ | Set-Content README.md
```

### 6. Make your first commit

If Git asks who you are, run this first:

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Then commit and push:

```powershell
git add .
git commit -m "Set up starter repo"
git push origin main
```

## macOS Setup

### 1. Install Git

Open Terminal and run:

```bash
xcode-select --install
```

Then check Git:

```bash
git --version
```

### 2. Install VS Code

If you use Homebrew:

```bash
brew install --cask visual-studio-code
```

If you do not use Homebrew, install VS Code from `https://code.visualstudio.com/`.

### 3. Clone your repo

In Terminal:

```bash
cd ~/Desktop
git clone https://github.com/YOUR_USERNAME/ai-course-starter.git
cd ai-course-starter
code .
```

If `code` is not found, open VS Code once and install the shell command from VS Code's Command Palette.

### 4. Add one simple project note

```bash
mkdir -p notes
echo "GitHub setup complete. Ready for future module repos." > notes/progress.txt
```

### 5. Update README

```bash
cat > README.md <<'EOF'
# AI Course Starter

This repo is my practice repo for the AI Integration Course.

## What I completed
- GitHub account created
- Git installed
- VS Code installed
- Local repo cloned
- First commit pushed

## Repo rule for this course
Each module project gets its own GitHub repo.
EOF
```

### 6. Make your first commit

If Git asks who you are, run this first:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Then commit and push:

```bash
git add .
git commit -m "Set up starter repo"
git push origin main
```

## Linux Setup

Use the package manager that matches your distribution.

### 1. Install Git

Ubuntu or Debian:

```bash
sudo apt update
sudo apt install -y git
```

Fedora:

```bash
sudo dnf install -y git
```

Arch:

```bash
sudo pacman -S git
```

Check Git:

```bash
git --version
```

### 2. Install VS Code

Install VS Code from `https://code.visualstudio.com/` or your distro package manager.

If you use Ubuntu with Snap:

```bash
sudo snap install code --classic
```

### 3. Clone your repo

```bash
cd ~/Desktop
git clone https://github.com/YOUR_USERNAME/ai-course-starter.git
cd ai-course-starter
code .
```

If your system does not have a `Desktop` folder, use any folder you like, such as `~/projects`.

### 4. Add one simple project note

```bash
mkdir -p notes
echo "GitHub setup complete. Ready for future module repos." > notes/progress.txt
```

### 5. Update README

```bash
cat > README.md <<'EOF'
# AI Course Starter

This repo is my practice repo for the AI Integration Course.

## What I completed
- GitHub account created
- Git installed
- VS Code installed
- Local repo cloned
- First commit pushed

## Repo rule for this course
Each module project gets its own GitHub repo.
EOF
```

### 6. Make your first commit

If Git asks who you are, run this first:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Then commit and push:

```bash
git add .
git commit -m "Set up starter repo"
git push origin main
```

## Part 4: Verify that it worked

You are done when all of these are true:

- your GitHub repo shows the updated `README.md`
- your repo has a `notes/progress.txt` file
- you can see your latest commit on GitHub
- you know where the local repo folder lives on your computer

## Part 5: How to use this in future modules

From Module 2 onward, repeat the same flow:

1. Create a new GitHub repo for that module.
2. Clone it to your computer.
3. Build the project inside that repo.
4. Commit after each working milestone.
5. Push at the end of each session.

Example future repo names:

- `ai-course-module-02-finance`
- `ai-course-module-03-startup`
- `ai-course-module-04-small-business`

## Part 6: Use an LLM when you get stuck

If you hit an error, do not guess.
Paste the exact command and the exact error into an LLM.

Good prompt:

```text
I am on Windows/macOS/Linux.
I am following a GitHub setup lesson.
I ran this command:

[paste command]

And got this error:

[paste full error]

Explain what it means in plain English and tell me the exact next step.
```

Good prompt for Git issues:

```text
I am new to Git.
I want one GitHub repo per course module.
Suggest a clean repo name, a short README, and the next 3 commands I should run.
```

Rule:

- include your operating system
- include the exact command
- include the full error message

## Common fixes

If `git push origin main` fails because there is no `main` branch yet, run:

```bash
git branch -M main
git push -u origin main
```

If Git says `Author identity unknown`, run:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

If `code` does not work:

- reopen your terminal
- or open the folder directly in VS Code using the app

## Build Complete

Once this lesson is done, you are ready for the real project builds.

The goal here was not complexity.
The goal was to give you a repeatable workflow:

- create repo
- clone repo
- make changes
- commit
- push

You will use that pattern for the rest of the course.
