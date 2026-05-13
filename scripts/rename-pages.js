// scripts/rename-pages.js
// Rename pages with spaces to use dashes

import { Octokit } from 'octokit';
import dotenv from 'dotenv';

// Try to load from .env.local, .env, or .env.production
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.production' });

if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO || !process.env.GITHUB_BRANCH) {
  console.error('Missing required environment variables:');
  console.error('- GITHUB_TOKEN');
  console.error('- GITHUB_REPO');
  console.error('- GITHUB_BRANCH');
  console.error('\nPlease set these in your .env.local file or environment.');
  process.exit(1);
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const [owner, repo] = process.env.GITHUB_REPO.split('/');
const branch = process.env.GITHUB_BRANCH;

async function renamePages() {
  try {
    console.log('Fetching pages from GitHub...');
    const { data } = await octokit.rest.repos.getContent({
      owner, repo, path: 'templates', ref: branch
    });

    const pages = data
      .filter(item => item.name.endsWith('.json'))
      .map(item => ({
        name: item.name.replace('.json', ''),
        path: item.path
      }));

    console.log(`Found ${pages.length} pages`);

    for (const page of pages) {
      if (page.name.includes(' ')) {
        const newName = page.name.replace(/\s+/g, '-');
        console.log(`Renaming "${page.name}" to "${newName}"`);

        // Load the page content
        const { data: fileData } = await octokit.rest.repos.getContent({
          owner, repo, path: page.path, ref: branch
        });

        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        const pageData = JSON.parse(content);

        // Update the title in the page data
        pageData.title = newName;

        // Create the new file
        const newPath = `templates/${newName}.json`;
        await octokit.rest.repos.createOrUpdateFileContents({
          owner, repo, path: newPath,
          message: `Rename page: ${page.name} -> ${newName}`,
          content: Buffer.from(JSON.stringify(pageData, null, 2)).toString('base64'),
          branch
        });

        // Delete the old file
        await octokit.rest.repos.deleteFile({
          owner, repo, path: page.path,
          message: `Delete old page: ${page.name}`,
          sha: fileData.sha,
          branch
        });

        console.log(`✓ Renamed "${page.name}" to "${newName}"`);
      } else {
        console.log(`Skipping "${page.name}" (no spaces)`);
      }
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

renamePages();
