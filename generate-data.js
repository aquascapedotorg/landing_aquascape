/**
 * generate-data.js
 *
 * Fetches all repos from the aquascapedotorg GitHub organization,
 * reads each repo's README, and writes the result to repos.json.
 *
 * Requires environment variable:
 *   GITHUB_TOKEN — a PAT with `repo` scope for private repo access
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx node generate-data.js
 */

const fs = require('fs');
const path = require('path');

const ORG_NAME = 'aquascapedotorg';
const API_BASE = 'https://api.github.com';
const OUTPUT_FILE = path.join(__dirname, 'repos.json');

async function githubFetch(endpoint) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${body}`);
  }

  return res.json();
}

async function fetchAllRepos() {
  const repos = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const batch = await githubFetch(
      `/orgs/${ORG_NAME}/repos?per_page=${perPage}&page=${page}&sort=updated&direction=desc`
    );

    if (batch.length === 0) break;
    repos.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }

  return repos;
}

async function fetchReadme(owner, repo) {
  try {
    const data = await githubFetch(`/repos/${owner}/${repo}/readme`);
    // README content is base64-encoded
    if (data.content && data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch {
    // No README or access denied
    return null;
  }
}

async function main() {
  console.log(`Fetching repos for org: ${ORG_NAME}`);

  const rawRepos = await fetchAllRepos();
  console.log(`Found ${rawRepos.length} repositories`);

  const repos = [];

  for (const repo of rawRepos) {
    console.log(`  Processing: ${repo.name}`);
    const readme = await fetchReadme(ORG_NAME, repo.name);

    repos.push({
      name: repo.name,
      description: repo.description || '',
      language: repo.language || null,
      visibility: repo.visibility || (repo.private ? 'private' : 'public'),
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      topics: repo.topics || [],
      html_url: repo.html_url,
      readme: readme,
    });
  }

  const output = {
    generated_at: new Date().toISOString(),
    org: ORG_NAME,
    repos: repos,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Written ${repos.length} repos to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
