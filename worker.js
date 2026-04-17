export default {
  async fetch(request, env) {
    const ORIGIN = "https://radrd.net";  // your actual Ghost/tunnel endpoint
    const FALLBACK = "https://summer-cake-8053.williamgalan.workers.dev";

    try {
      // Rewrite the request to bypass the Worker route
      const originRequest = new Request(request);
      const response = await fetch(originRequest, {
        cf: { resolveOverride: "radrd.net" }
      });

      if ([502, 523, 530].includes(response.status)) {
        const fallback = await fetch(FALLBACK);
        const html = await fallback.text();
        return new Response(html, {
          status: 503,
          headers: { "Content-Type": "text/html;charset=UTF-8" }
        });
      }

      return response;
    } catch {
      const fallback = await fetch(FALLBACK);
      const html = await fallback.text();
      return new Response(html, {
        status: 503,
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }
  }
};
