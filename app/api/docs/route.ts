import { getApiDocs } from '@/lib/swagger';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return Response.json(await getApiDocs({ baseUrl: origin }));
}
