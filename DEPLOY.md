# How to Deploy "Antigravity" 🚀

This guide will help you connect your app to a real backend (Supabase) and publish it online (Vercel).

## Step 1: Set up the Backend (Supabase)

1.  **Create an Account**: Go to [supabase.com](https://supabase.com/) and sign up (it's free).
2.  **New Project**: Click "New Project". Give it a name (e.g., `Antigravity App`) and a database password.
3.  **Get API Keys**:
    -   Once the project is created, go to **Settings** (cog icon) -> **API**.
    -   Copy the `Project URL` and `anon` / `public` Key. You will need these for Step 3.
4.  **Create Tables**:
    -   Go to the **SQL Editor** (icon with `>_` on the left sidebar).
    -   Click "New Query".
    -   Open the file `supabase_schema.sql` from your project folder.
    -   Copy **ALL** the text from that file and paste it into the Supabase SQL Editor.
    -   Click **Run**.
    -   *Success! Your database is now ready.*

## Step 2: Push Code to GitHub

*(Skip if you already have this on GitHub)*

1.  Create a new repository on [GitHub](https://github.com/).
2.  Run these commands in your terminal (inside the project folder):
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    git push -u origin main
    ```

## Step 3: Deploy Frontend (Vercel)

1.  **Create an Account**: Go to [vercel.com](https://vercel.com/) and sign up with GitHub.
2.  **Import Project**: Click "Add New..." -> "Project". Select your `Antigravity` repository.
3.  **Configure Environment Variables**:
    -   In the "Environment Variables" section, add these two (using the values from Step 1):
        -   `VITE_SUPABASE_URL`: (Paste your Project URL)
        -   `VITE_SUPABASE_ANON_KEY`: (Paste your `anon` Key)
4.  **Deploy**: Click **Deploy**.

## Testing Locally

To test the backend on your computer:
1.  Create a file named `.env` in the root of your project.
2.  Add the keys there:
    ```
    VITE_SUPABASE_URL=your-project-url
    VITE_SUPABASE_ANON_KEY=your-anon-key
    ```
3.  Restart your dev server: `npm run dev`.

🎉 **You're live!**
