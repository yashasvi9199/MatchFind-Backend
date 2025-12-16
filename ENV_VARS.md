### Vercel Environment Variables

The following environment variables must be configured in your Vercel project settings for the backend to function correctly.

| Variable Name               | Description                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_URL`              | The URL of your Supabase project (e.g., https://xyz.supabase.co)                                                      |
| `SUPABASE_SERVICE_ROLE_KEY` | The Service Role API key (secret) for backend admin access. find this in Supabase Dashboard > Project Settings > API. |
| `ALLOWED_ORIGIN`            | (Optional) The frontend URL to allow CORS (e.g., https://your-frontend.vercel.app). Defaults to '\*' if not set.      |
