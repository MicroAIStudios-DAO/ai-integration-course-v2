// Mock for node-fetch
export default async function fetch(_url: string, _options?: any): Promise<any> {
  return {
    ok: true,
    json: async () => ({ data: [] }),
    text: async () => '',
    body: null
  };
}

export class Response {}
