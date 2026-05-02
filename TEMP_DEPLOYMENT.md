# Temporary Deployment For Recovery

This project is ready for a quick GitHub Pages deployment.

Repository:
- `https://github.com/20254754-sam/VIOLENTBEAR-ClassSync-IDA3`

Expected GitHub Pages URL after deploy:
- `https://20254754-sam.github.io/VIOLENTBEAR-ClassSync-IDA3/`

Recovery scanner URL to send to users:
- `https://20254754-sam.github.io/VIOLENTBEAR-ClassSync-IDA3/#/recovery`

## One-time GitHub Pages setup

1. Push your latest code to the GitHub repository default branch.
2. In GitHub, open:
   `Settings -> Pages`
3. If Pages is not enabled yet, set the source to:
   `Deploy from a branch`
4. When you run the deploy command below, the `gh-pages` branch will be created automatically.
5. In GitHub Pages settings, choose:
   `Branch: gh-pages`
   `Folder: / (root)`

## Deploy command

Run this from the project folder:

```powershell
npm run deploy
```

That command will:
- build the Vite app
- publish the `dist` folder to the `gh-pages` branch

## What to send to old users

Send them this exact link:

`https://20254754-sam.github.io/VIOLENTBEAR-ClassSync-IDA3/#/recovery`

Tell them:
- open the link using the same device and same browser they used before
- tap `Scan this browser`
- send you the values for `Extra local accounts` and `Extra local posts`
- only press `Restore this browser data to Supabase` if we confirm that browser has the missing data

## Important note

Recovery only works if the old app data still exists in that exact browser profile.

Examples:
- Old data was in Chrome on Android: scan Chrome on that Android phone
- Old data was in Edge on Windows: scan Edge on that same PC account
- A different browser or incognito window will usually not contain the old data
