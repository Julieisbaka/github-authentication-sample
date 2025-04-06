# GitHub Project Submission Portal

A static website hosted on GitHub Pages that uses GitHub Authentication and GitHub Actions for project submissions.

## How It Works

This application demonstrates a serverless approach to accepting project submissions:

1. **GitHub Pages** hosts the static website
2. **GitHub OAuth** handles user authentication
3. **GitHub Actions** process form submissions and manage project data
4. **GitHub Issues & PRs** store and track project submissions

## Features

- Sign in with GitHub account
- Submit projects with name, URL, description, and tags
- View submitted projects
- All data is stored in the repository
- No additional backend needed

## Setup Instructions

1. **Fork this repository**

2. **Enable GitHub Pages**
   - Go to repository Settings > Pages
   - Select the main branch as source
   - Save the configuration

3. **Create a GitHub OAuth App**
   - Go to your GitHub Settings > Developer Settings > OAuth Apps
   - Create a new OAuth App
   - Set the homepage URL to your GitHub Pages URL
   - Set the callback URL to the same GitHub Pages URL
   - Copy the Client ID and generate a Client Secret

4. **Configure repository secrets**
   - Go to repository Settings > Secrets > Actions
   - Add the following secrets:
     - `GITHUB_CLIENT_ID`: Your OAuth App Client ID
     - `GITHUB_CLIENT_SECRET`: Your OAuth App Client Secret

5. **Update configuration in the code**
   - In `auth.js`, update the `CLIENT_ID` with your OAuth App Client ID
   - In `app.js`, update `repoOwner` and `repoName` with your GitHub username and repository name

6. **Push changes to your repository**
   - The GitHub Pages site will automatically update

## How Submissions Work

When a user submits a project:

1. The form data is sent as a GitHub Issue
2. A GitHub Action is triggered by the new issue
3. The Action extracts project data from the issue
4. The data is added to a JSON file in the repository
5. A Pull Request is created with the changes
6. A repository maintainer can review and merge the PR
7. Once merged, the project appears on the site

## Customization

- Modify `index.html` to change the form fields or page layout
- Update `styles.css` to customize the appearance
- Adjust the GitHub Actions workflow in `.github/workflows/project-submission.yml`

## Security Considerations

- OAuth token exchange is handled server-side via GitHub Actions
- Project data is stored in the repository (public or private)
- Form submissions are moderated through Pull Requests

## License

MIT