import os
import sys
import json
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading

# Ensure UTF-8
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure scripts dir is in sys.path
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

# Import auto sync function
from auto_scanner import run_auto_sync, BASE_DIR

PORT = 8080

class EduMangaServerHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        # API endpoint to trigger sync
        if self.path == '/api/sync' or self.path.startswith('/api/sync?'):
            try:
                res = run_auto_sync()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                err_res = {"success": False, "error": str(e)}
                self.wfile.write(json.dumps(err_res, ensure_ascii=False).encode('utf-8'))
            return

        # Default static file serving
        return super().do_GET()

    def end_headers(self):
        # Disable aggressive caching during development
        if self.path.endswith('.json') or self.path.endswith('.html') or self.path.endswith('.js') or self.path.endswith('.css'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def start_background_watcher():
    """Background thread watching for filesystem changes"""
    last_state = {}

    def get_dir_state():
        state = {}
        for root, dirs, files in os.walk(BASE_DIR):
            # Skip system folders
            if any(part in root for part in [".git", "assets", "data", "css", "js", "scripts", "docs", "brain"]):
                continue
            for file in files:
                if file.lower().endswith(('.json', '.pdf')):
                    full_p = os.path.join(root, file)
                    try:
                        state[full_p] = os.path.getmtime(full_p)
                    except Exception:
                        pass
        return state

    last_state = get_dir_state()

    while True:
        time.sleep(2.5)
        try:
            current_state = get_dir_state()
            if current_state != last_state:
                print("\n[Auto-Watcher] 🔔 Detected new/modified manga file! Triggering auto-sync...")
                run_auto_sync()
                last_state = current_state
        except Exception as e:
            print(f"[Auto-Watcher] Error: {e}")

def run_server():
    # Run initial sync on boot
    print("🚀 Initializing EduManga Server...")
    run_auto_sync()

    # Start background watcher thread
    watcher_thread = threading.Thread(target=start_background_watcher, daemon=True)
    watcher_thread.start()

    server_address = ('', PORT)
    httpd = HTTPServer(server_address, EduMangaServerHandler)
    print(f"\n✨ EduManga Hub is LIVE with Auto-Watcher at: http://localhost:{PORT}/index.html")
    print("📡 Drop any PDF or JSON into any subject folder to auto-publish instantly!\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")

if __name__ == "__main__":
    run_server()
