# Remove Hardcoded Firebase API Key

Replace this file:
- src/firebase.ts

Commit message:
Remove hardcoded Firebase API key

What changed:
- Removes the hardcoded Firebase web API key from source code.
- Uses only Vercel VITE_FIREBASE_* environment variables.
- Keeps Firebase auth behavior.
- Adds a clearer console warning if environment variables are missing.

After replacing this file:
1. Commit and push.
2. Let Vercel redeploy.
3. In Google Cloud/Firebase, restrict or rotate the API key.
4. Close the GitHub secret scanning alert only after the hardcoded key is removed and the key is restricted or rotated.
