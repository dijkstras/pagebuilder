// netlify/functions/api.js

import { fileStorageGitHub } from '../../src/services/fileStorageGitHub.js';

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

      const page = await fileStorageGitHub.createNewPage(name);
      // Commit to GitHub
      await fileStorageGitHub.savePage(name, page);

      return new Response(JSON.stringify({ success: true, page }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // GET /api/pages - List all pages
    if (method === 'GET' && pathname === '/api/pages') {
      const pages = await fileStorageGitHub.listPages();
      return new Response(JSON.stringify(pages),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // GET /api/pages/:name - Load page
    const pageMatch = pathname.match(/^\/api\/pages\/([^\/]+)$/);
    if (method === 'GET' && pageMatch) {
      const page = await fileStorageGitHub.loadPage(pageMatch[1]);
      if (!page) {
        return new Response(JSON.stringify({ message: 'Not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify(page),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/pages/:name/save - Save page
    const saveMatch = pathname.match(/^\/api\/pages\/([^\/]+)\/save$/);
    if (method === 'POST' && saveMatch) {
      const { page } = await request.json();
      const result = await fileStorageGitHub.savePage(saveMatch[1], page);
      return new Response(JSON.stringify(result),
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
