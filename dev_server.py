import http.server
import socketserver
import urllib.parse
import urllib.request
import os


ROOT = os.path.abspath(os.path.dirname(__file__))

# Default backend for /api/* when running locally.
# You can override by setting env var JOB_PROXY_URL, e.g.:
#   $env:JOB_PROXY_URL="https://playground-serveless.vercel.app"
DEFAULT_API_ORIGIN = os.environ.get("JOB_PROXY_URL", "https://job-search-engine-api.onrender.com").rstrip("/")


class Handler(http.server.SimpleHTTPRequestHandler):
	def translate_path(self, path: str) -> str:
		# Serve files from analytics-lab/ regardless of cwd
		path = path.split("?", 1)[0].split("#", 1)[0]
		path = urllib.parse.unquote(path)
		if path == "/":
			path = "/index.html"
		full = os.path.join(ROOT, path.lstrip("/"))
		return full

	def end_headers(self):
		# Helpful for local testing + CORS-ish fetches
		self.send_header("Cache-Control", "no-store")
		super().end_headers()

	def do_GET(self):
		if self.path.startswith("/api/"):
			return self._proxy_api()
		return super().do_GET()

	def do_OPTIONS(self):
		if self.path.startswith("/api/"):
			self.send_response(200)
			self.send_header("Access-Control-Allow-Origin", "*")
			self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
			self.send_header("Access-Control-Allow-Headers", "Content-Type")
			self.end_headers()
			return
		return super().do_OPTIONS()

	def _proxy_api(self):
		# Proxy /api/* to remote backend so the frontend can use same-origin JOB_PROXY_URL=''
		target = DEFAULT_API_ORIGIN + self.path
		try:
			req = urllib.request.Request(
				target,
				headers={
					"User-Agent": "analytics-lab-dev-server/1.0",
					"Accept": "*/*",
				},
				method="GET",
			)
			with urllib.request.urlopen(req, timeout=20) as resp:
				body = resp.read()
				self.send_response(resp.status)
				ct = resp.headers.get("Content-Type") or "application/json; charset=utf-8"
				self.send_header("Content-Type", ct)
				self.send_header("Access-Control-Allow-Origin", "*")
				self.end_headers()
				self.wfile.write(body)
		except Exception as e:
			self.send_response(502)
			self.send_header("Content-Type", "application/json; charset=utf-8")
			self.send_header("Access-Control-Allow-Origin", "*")
			self.end_headers()
			msg = ('{"ok":false,"error":"proxy_failed","detail":%r,"target":%r}' % (str(e), target)).encode("utf-8")
			self.wfile.write(msg)


def main():
	port = int(os.environ.get("PORT", "8000"))
	with socketserver.TCPServer(("", port), Handler) as httpd:
		print(f"Serving analytics-lab at http://localhost:{port}")
		print(f"Proxying /api/* -> {DEFAULT_API_ORIGIN}")
		httpd.serve_forever()


if __name__ == "__main__":
	main()

