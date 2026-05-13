// netlify/functions/api.js

import { Octokit } from 'octokit';

// Initialize Octokit with environment variables
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const [owner, repo] = process.env.GITHUB_REPO.split('/');
const branch = process.env.GITHUB_BRANCH;

// Netlify Functions handler
export default async (request, context) => {
  const url = new URL(request.url);
  const pathname = url.pathname.replace('/.netlify/functions/api', '');
  const method = request.method;

  try {
    // POST /api/pages - Create new page
    if (method === 'POST' && pathname === '/api/pages') {
      const { name } = await request.json();

      if (!name || !name.match(/^[a-z0-9\-]+$/i)) {
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid page name' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const blankPage = {
        id: `page-${Date.now()}`,
        title: name,
        breakpoints: {
          mobile: 320,
          tablet: 768,
          desktop: 1024
        },
        root: [],
        styles: {
          logo: null,
          colors: {
            primary: '#3b82f6',
            secondary: '#8b5cf6',
            accent: '#ec4899',
            text: '#1f2937',
            background: '#f9fafb',
            neutral: '#6b7280'
          },
          fonts: {
            heading1: { family: 'Inter', size: 48, weight: 700 },
            heading2: { family: 'Inter', size: 32, weight: 600 },
            body: { family: 'Inter', size: 16, weight: 400 },
            label: { family: 'Inter', size: 12, weight: 500 },
            button: { family: 'Inter', weight: 500 }
          },
          buttonStyles: [
            { id: 'primary', label: 'Primary', bgColor: '#3b82f6', textColor: '#ffffff', padding: 12, radius: 6, bgType: 'solid', bgGradient: null, fontSize: 14 },
            { id: 'secondary', label: 'Secondary', bgColor: '#e5e7eb', textColor: '#1f2937', padding: 12, radius: 6, bgType: 'solid', bgGradient: null, fontSize: 14 },
            { id: 'tertiary', label: 'Tertiary', bgColor: 'transparent', textColor: '#3b82f6', padding: 12, radius: 6, bgType: 'solid', bgGradient: null, fontSize: 14 }
          ],
          shapes: { borderRadius: 6 },
          spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 48 },
          bgColor: '#f9fafb'
        }
      };

      const path = `templates/${name}.json`;
      const content = JSON.stringify(blankPage, null, 2);

      await octokit.rest.repos.createOrUpdateFileContents({
        owner, repo, path,
        message: `Create page: ${name}`,
        content: Buffer.from(content).toString('base64'),
        branch
      });

      return new Response(JSON.stringify({ success: true, page: blankPage }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // GET /api/pages - List all pages
    if (method === 'GET' && pathname === '/api/pages') {
      const { data } = await octokit.rest.repos.getContent({
        owner, repo, path: 'templates', ref: branch
      });

      const pages = data
        .filter(item => item.name.endsWith('.json'))
        .map(item => ({
          name: item.name.replace('.json', ''),
          path: item.path,
          id: item.name.replace('.json', '')
        }));

      const pagesWithTimestamps = await Promise.all(
        pages.map(async (page) => {
          try {
            const { data: commits } = await octokit.rest.repos.listCommits({
              owner, repo, path: page.path, branch, per_page: 1
            });
            const lastModified = commits[0]?.commit?.author?.date || new Date().toISOString();
            return { ...page, lastModified };
          } catch (e) {
            return { ...page, lastModified: new Date().toISOString() };
          }
        })
      );

      pagesWithTimestamps.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
      return new Response(JSON.stringify(pagesWithTimestamps),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // GET /api/pages/:name - Load page
    const pageMatch = pathname.match(/^\/api\/pages\/([^\/]+)$/);
    if (method === 'GET' && pageMatch) {
      const pageName = decodeURIComponent(pageMatch[1]);
      const path = `templates/${pageName}.json`;
      const { data } = await octokit.rest.repos.getContent({
        owner, repo, path, ref: branch
      });
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return new Response(content,
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/pages/:name/save - Save page
    const saveMatch = pathname.match(/^\/api\/pages\/([^\/]+)\/save$/);
    if (method === 'POST' && saveMatch) {
      const pageName = decodeURIComponent(saveMatch[1]);
      const { page } = await request.json();
      const path = `templates/${pageName}.json`;
      const content = JSON.stringify(page, null, 2);

      let sha = null;
      try {
        const { data: existing } = await octokit.rest.repos.getContent({
          owner, repo, path, ref: branch
        });
        sha = existing.sha;
      } catch (e) {
        // File doesn't exist yet
      }

      const { data } = await octokit.rest.repos.createOrUpdateFileContents({
        owner, repo, path,
        message: `Auto-save: ${saveMatch[1]} @ ${new Date().toISOString()}`,
        content: Buffer.from(content).toString('base64'),
        branch,
        ...(sha && { sha })
      });

      return new Response(JSON.stringify({ success: true, commitHash: data.commit.sha }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /api/pages/:name - Delete page
    const deleteMatch = pathname.match(/^\/api\/pages\/([^\/]+)$/);
    if (method === 'DELETE' && deleteMatch) {
      const pageName = decodeURIComponent(deleteMatch[1]);
      const path = `templates/${pageName}.json`;
      const { data } = await octokit.rest.repos.getContent({
        owner, repo, path, ref: branch
      });

      await octokit.rest.repos.deleteFile({
        owner, repo, path,
        message: `Delete page: ${pageName}`,
        sha: data.sha,
        branch
      });

      return new Response(JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/pages/:name/duplicate - Duplicate page
    const duplicateMatch = pathname.match(/^\/api\/pages\/([^\/]+)\/duplicate$/);
    if (method === 'POST' && duplicateMatch) {
      const pageName = decodeURIComponent(duplicateMatch[1]);
      const { newName } = await request.json();
      const oldPath = `templates/${pageName}.json`;
      const newPath = `templates/${newName}.json`;

      const { data: sourceData } = await octokit.rest.repos.getContent({
        owner, repo, path: oldPath, ref: branch
      });

      const content = Buffer.from(sourceData.content, 'base64').toString('utf-8');
      const pageData = JSON.parse(content);
      pageData.title = newName;
      pageData.id = `page-${Date.now()}`;

      await octokit.rest.repos.createOrUpdateFileContents({
        owner, repo, path: newPath,
        message: `Duplicate page: ${pageName} -> ${newName}`,
        content: Buffer.from(JSON.stringify(pageData, null, 2)).toString('base64'),
        branch
      });

      return new Response(JSON.stringify({ success: true, page: pageData }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // GET /api/segments - List segments
    if (method === 'GET' && pathname === '/api/segments') {
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner, repo, path: 'segments', ref: branch
        });

        const segments = data
          .filter(item => item.name.endsWith('.json'))
          .map(item => ({
            name: item.name.replace('.json', ''),
            path: item.path,
            id: item.name.replace('.json', '')
          }));

        const segmentsWithTimestamps = await Promise.all(
          segments.map(async (segment) => {
            try {
              const { data: commits } = await octokit.rest.repos.listCommits({
                owner, repo, path: segment.path, branch, per_page: 1
              });
              const lastModified = commits[0]?.commit?.author?.date || new Date().toISOString();
              return { ...segment, lastModified };
            } catch (e) {
              return { ...segment, lastModified: new Date().toISOString() };
            }
          })
        );

        segmentsWithTimestamps.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
        return new Response(JSON.stringify(segmentsWithTimestamps),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        if (error.status === 404) return new Response('[]',
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
        throw error;
      }
    }

    // POST /api/segments - Save segment
    if (method === 'POST' && pathname === '/api/segments') {
      const { name, data } = await request.json();
      const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      const path = `segments/${id}.json`;
      const content = JSON.stringify({ name, data, savedAt: new Date().toISOString() }, null, 2);

      const { data: result } = await octokit.rest.repos.createOrUpdateFileContents({
        owner, repo, path,
        message: `Save segment: ${name}`,
        content: Buffer.from(content).toString('base64'),
        branch
      });

      return new Response(JSON.stringify({
        success: true,
        commitHash: result.commit.sha,
        segment: { id, name, data, savedAt: new Date().toISOString() }
      }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // GET /api/segments/:id - Load segment
    const segmentMatch = pathname.match(/^\/api\/segments\/([^\/]+)$/);
    if (method === 'GET' && segmentMatch) {
      const path = `segments/${segmentMatch[1]}.json`;
      const { data } = await octokit.rest.repos.getContent({
        owner, repo, path, ref: branch
      });
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      const parsed = JSON.parse(content);
      return new Response(JSON.stringify({
        id: segmentMatch[1],
        name: parsed.name,
        data: parsed.data,
        savedAt: parsed.savedAt
      }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /api/segments/:id - Delete segment
    const deleteSegmentMatch = pathname.match(/^\/api\/segments\/([^\/]+)$/);
    if (method === 'DELETE' && deleteSegmentMatch) {
      const path = `segments/${deleteSegmentMatch[1]}.json`;
      const { data } = await octokit.rest.repos.getContent({
        owner, repo, path, ref: branch
      });

      await octokit.rest.repos.deleteFile({
        owner, repo, path,
        message: `Delete segment: ${deleteSegmentMatch[1]}`,
        sha: data.sha,
        branch
      });

      return new Response(JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Not found
    return new Response(JSON.stringify({ message: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
