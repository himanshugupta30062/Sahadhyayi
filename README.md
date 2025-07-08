
# Welcome to your Lovable project

## Project info

**Repository name:** Sahadhyayi  
**URL**: https://lovable.dev/projects/c31baff7-46f5-4cb4-8fc1-fe1c52fc3fe0

## Live Website

This project is deployed using **GitHub Pages**. You can access it at [https://www.sahadhyayi.com](https://www.sahadhyayi.com).
Changes pushed to the `main` branch will automatically update the site.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c31baff7-46f5-4cb4-8fc1-fe1c52fc3fe0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd Sahadhyayi

# Step 3: Install the necessary dependencies. If npm cannot reach the registry,
# you can use Bun which installs packages from `bun.lockb`.
bun install

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev

# Step 5: Run the linter to check for code quality issues.
npm run lint
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Environment variables

Create a `.env` file based on `.env.example` and add your Supabase credentials
along with the Gemini API key:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_key_here
```
These values are required for the application to connect to Supabase and for the
chatbot to fetch responses from the Gemini API. The application will throw an error if any of them are missing.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c31baff7-46f5-4cb4-8fc1-fe1c52fc3fe0) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)


## Adding Books to the Library

To display custom books in the Library section you must populate the `books_library` table in Supabase. See [docs/AddBooksToLibrary.md](docs/AddBooksToLibrary.md) for a step-by-step guide on creating the table and uploading covers and PDFs.

## Training Gemini with your chats

Each chat message you send along with the assistant's reply is stored in a new Supabase table called `gemini_training_data`. These prompt/response pairs can be exported for fine‑tuning by running:

```sh
node scripts/exportGeminiTrainingData.js
```

The script creates a `gemini_training_data.json` file that can be used with Google's tuning tools or any other model training pipeline.
