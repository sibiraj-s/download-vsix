import { NextRequest } from "next/server";
import https from "https";

function parseItemUrl(rawUrl: string) {
  try {
    const itemUrl = new URL(rawUrl);
    const itemName = itemUrl.searchParams.get("itemName");
    if (!itemName || !itemName.includes("."))
      throw new Error("Invalid itemName");
    const [publisher, name] = itemName.split(".");
    return { publisher, name, itemName };
  } catch {
    throw new Error("Invalid VSCode Marketplace URL");
  }
}

function fetchLatestVersion(publisher: string, name: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      filters: [
        {
          criteria: [{ filterType: 7, value: `${publisher}.${name}` }],
        },
      ],
      flags: 0x1 | 0x2 | 0x80 | 0x100,
    });

    const options = {
      hostname: "marketplace.visualstudio.com",
      path: "/_apis/public/gallery/extensionquery",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json;api-version=3.0-preview.1",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          const extension = json.results[0]?.extensions[0];
          const version = extension?.versions[0]?.version;
          if (!version) return reject("Version not found");
          resolve(version);
        } catch {
          reject("Failed to parse version response");
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return new Response("Missing ?url= parameter", { status: 400 });
  }

  try {
    const { publisher, name, itemName } = parseItemUrl(rawUrl);
    const version = await fetchLatestVersion(publisher, name);

    const vsixUrl = `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${publisher}/vsextensions/${name}/${version}/vspackage`;

    return new Promise<Response>((resolve) => {
      https
        .get(vsixUrl, (vsixRes) => {
          if (vsixRes.statusCode !== 200) {
            resolve(
              new Response("Failed to fetch .vsix file", { status: 502 }),
            );
            return;
          }

          const headers = new Headers({
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename=${itemName}-${version}.vsix`,
          });

          resolve(
            new Response(vsixRes as any, {
              status: 200,
              headers,
            }),
          );
        })
        .on("error", () => {
          resolve(new Response("Error downloading .vsix", { status: 500 }));
        });
    });
  } catch (err: any) {
    return new Response(err.message ?? "Unexpected error", { status: 400 });
  }
}
