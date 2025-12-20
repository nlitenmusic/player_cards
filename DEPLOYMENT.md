Vercel staging deployment
=========================

Quick setup to deploy this project to Vercel (staging):

1. Push your repository to GitHub.
2. In Vercel (https://vercel.com) create a new project and import the GitHub repo.
   - Vercel will auto-detect this as a Next.js app and use `npm run build`.
3. In the Vercel project settings → Environment Variables, add these variables:
   - `NEXT_PUBLIC_SUPABASE_URL` -> your Supabase URL
   - `SUPABASE_SERVICE_ROLE` -> your Supabase service role key (keep this secret)

4. Deploy. Vercel will run `npm install` and `npm run build` (build script is defined in `package.json`).

Notes:
- The repo includes `vercel.json` with a minimal Next.js builder config and references to secrets (`@supabase_url`, `@supabase_service_role`). In the Vercel UI you must set the corresponding environment variables or project secrets.
- For local testing, run `npm run dev`.
- If you need the MCP / server components to run as part of the same deployment, we can either embed them into the Next.js app or run them as a separate service — tell me if you want the latter.
