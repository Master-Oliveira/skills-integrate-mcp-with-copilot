import os
import requests
import glob
import re

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
REPO = os.environ.get("GITHUB_REPO")  # Format: owner/repo
ISSUES_DIR = os.path.join(os.path.dirname(__file__), "../.github/ISSUES")

ISSUE_HEADER_RE = re.compile(r"---(.*?)---", re.DOTALL)


def parse_issue_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    header_match = ISSUE_HEADER_RE.search(content)
    header = {}
    if header_match:
        header_lines = header_match.group(1).strip().split("\n")
        for line in header_lines:
            if ":" in line:
                k, v = line.split(":", 1)
                header[k.strip()] = v.strip().strip('"')
    body = content[header_match.end():].strip() if header_match else content
    return header, body


def create_github_issue(title, body, labels=None):
    url = f"https://api.github.com/repos/{REPO}/issues"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }
    data = {
        "title": title,
        "body": body,
    }
    if labels:
        data["labels"] = labels
    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 201:
        print(f"Created issue: {title}")
    else:
        print(f"Failed to create issue: {title}\n{response.status_code}: {response.text}")


def main():
    if not GITHUB_TOKEN or not REPO:
        print("Set GITHUB_TOKEN and GITHUB_REPO environment variables.")
        return
    issue_files = sorted(glob.glob(os.path.join(ISSUES_DIR, "*.md")))
    for filepath in issue_files:
        header, body = parse_issue_file(filepath)
        title = header.get("title") or os.path.basename(filepath)
        labels = []
        if "labels" in header:
            labels = [l.strip() for l in header["labels"].strip('[]').split(',') if l.strip()]
        create_github_issue(title, body, labels)

if __name__ == "__main__":
    main()
