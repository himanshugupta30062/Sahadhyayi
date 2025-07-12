import os
import subprocess
from pathlib import Path

from ruamel.yaml import YAML
from github import Github


KEYWORDS = ["sonar-scanner", "SonarQube", "SonarCloud"]


def remove_sonar_properties():
    path = Path("sonar-project.properties")
    if path.exists():
        path.unlink()
        print(f"Deleted {path}")
    else:
        print(f"{path} not found, skipping")


def update_readme():
    path = Path("README.md")
    if not path.exists():
        print("README.md not found, skipping")
        return
    lines = path.read_text().splitlines()
    start = end = None
    for i, line in enumerate(lines):
        if "SonarQube" in line or "sonar-project.properties" in line:
            if start is None:
                start = i
            end = i
    if start is None:
        print("No SonarQube section found in README.md")
        return
    # move start to the previous header or beginning
    while start > 0 and not lines[start].startswith("##"):
        start -= 1
    # move end to the next header or end of file
    end += 1
    while end < len(lines) and not lines[end].startswith("##"):
        end += 1
    removed = lines[start:end]
    new_lines = lines[:start] + lines[end:]
    path.write_text("\n".join(new_lines) + "\n")
    print("Removed SonarQube section from README.md:")
    for line in removed:
        print(line)


def clean_workflows():
    workflows = Path(".github/workflows")
    if not workflows.exists():
        print("No workflows directory found")
        return
    yaml = YAML()
    for wf_path in workflows.glob("*.y*ml"):
        data = yaml.load(wf_path.read_text())
        if not isinstance(data, dict) or "jobs" not in data:
            continue
        jobs = data.get("jobs", {})
        modified = False
        for job_name in list(jobs.keys()):
            job = jobs[job_name]
            job_str = str(job)
            if any(k in job_str for k in KEYWORDS) or any(k in job_name for k in KEYWORDS):
                del jobs[job_name]
                modified = True
                print(f"Removed job '{job_name}' from {wf_path}")
                continue
            steps = job.get("steps", [])
            new_steps = []
            for step in steps:
                step_str = str(step)
                if any(k in step_str for k in KEYWORDS):
                    modified = True
                    print(f"Removed step from job '{job_name}' in {wf_path}")
                else:
                    new_steps.append(step)
            if new_steps:
                job["steps"] = new_steps
            else:
                del jobs[job_name]
                modified = True
                print(f"Removed job '{job_name}' from {wf_path} (no steps left)")
        if not jobs:
            wf_path.unlink()
            print(f"Removed entire workflow {wf_path}")
        elif modified:
            yaml.dump(data, wf_path.open("w"))
            print(f"Updated workflow {wf_path}")


def list_sonar_secrets():
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("GITHUB_TOKEN not provided; cannot list secrets")
        return
    repo_name = os.getenv("GITHUB_REPOSITORY")
    if not repo_name:
        try:
            url = subprocess.run(["git", "config", "--get", "remote.origin.url"], capture_output=True, text=True).stdout.strip()
            if url.endswith(".git"):
                url = url[:-4]
            if url.startswith("https://github.com/"):
                repo_name = url.split("https://github.com/")[1]
            elif url.startswith("git@github.com:"):
                repo_name = url.split("git@github.com:")[1]
        except Exception:
            repo_name = None
    if not repo_name:
        print("Could not determine repository name; skipping secret check")
        return
    try:
        gh = Github(token)
        repo = gh.get_repo(repo_name)
        sonar_secrets = [s.name for s in repo.get_secrets() if "SONAR" in s.name.upper()]
        if sonar_secrets:
            print("Secrets containing 'SONAR':")
            for name in sonar_secrets:
                print(f" - {name}")
        else:
            print("No secrets containing 'SONAR' found")
    except Exception as exc:
        print(f"Error fetching secrets: {exc}")


if __name__ == "__main__":
    remove_sonar_properties()
    update_readme()
    clean_workflows()
    list_sonar_secrets()
