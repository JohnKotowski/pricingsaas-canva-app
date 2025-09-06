# Claude Command: git-push

## Goal
Automate the process of preparing and pushing code changes while ensuring no debug statements remain.

## Instructions
1. Inspect the current Git working directory to see which files have changed and need to be committed.  
   - Use `git status` and `git diff` to review staged/unstaged changes.

2. For **all changed files**:  
   - Remove any debugging code such as:
     - `console.log(...)`
     - `print(...)`
     - `debugger;`
     - Any other debug-only statements.  
   - Ensure only meaningful production-ready code remains.

3. Write a **clear commit message** that summarizes the changes:  
   - Be concise (one sentence if possible).  
   - Describe the essence of what was changed, added, or fixed.  

4. Stage all relevant files with `git add .`.

5. Commit the changes with the generated summary message.

6. Push the commit to the current branch’s remote with `git push`.

---
✅ End result: The repository should be updated on the remote with all current changes, no debug statements left behind, and a clean commit message describing the update.

Print final commit comment to chat for user to see.