import { NextRequest } from 'next/server';

function parseItemUrl(rawUrl: string) {
  try {
    const itemUrl = new URL(rawUrl);
    const itemName = itemUrl.searchParams.get('itemName');
    if (!itemName || !itemName.includes('.')) throw new Error('Invalid itemName');
    const [publisher, name] = itemName.split('.');
    return { publisher, name, itemName };
  } catch {
    throw new Error('Invalid VSCode Marketplace URL');
  }
}

async function fetchLatestVersion(publisher: string, name: string): Promise<string> {
  const data = JSON.stringify({
    filters: [
      {
        criteria: [{ filterType: 7, value: `${publisher}.${name}` }],
      },
    ],
    flags: 0x1 | 0x2 | 0x80 | 0x100,
  });

  const response = await fetch(
    'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json;api-version=3.0-preview.1',
      },
      body: data,
    },
  );

  if (!response.ok) {
    throw new Error('Failed to fetch extension info');
  }

  const json = await response.json();
  const extension = json.results[0]?.extensions[0];
  const version = extension?.versions[0]?.version;

  if (!version) {
    throw new Error('Version not found');
  }

  return version;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return new Response('Missing ?url= parameter', { status: 400 });
  }

  try {
    const { publisher, name, itemName } = parseItemUrl(rawUrl);
    const version = await fetchLatestVersion(publisher, name);

    const vsixUrl = `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${publisher}/vsextensions/${name}/${version}/vspackage`;

    // Fetch the .vsix file and buffer it completely
    const response = await fetch(vsixUrl);

    if (!response.ok) {
      return new Response('Failed to fetch .vsix file', { status: 502 });
    }

    // Get the complete file as an ArrayBuffer to ensure it's fully downloaded
    const arrayBuffer = await response.arrayBuffer();

    const headers = new Headers({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename=${itemName}-${version}.vsix`,
      'Content-Length': arrayBuffer.byteLength.toString(),
    });

    // Return the complete buffered file
    return new Response(arrayBuffer, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return new Response(err.message ?? 'Unexpected error', { status: 400 });
  }
}
