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

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        # API endpoint to save auto-backup to disk
        if self.path == '/api/backup/save':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                payload = json.loads(post_data.decode('utf-8'))

                raw_target_dir = payload.get('targetDir', '').strip()
                date_folder = payload.get('dateFolder', '').strip()
                if not date_folder:
                    from datetime import datetime
                    date_folder = datetime.now().strftime('%d-%m-%Y')

                # Resolve target path
                if raw_target_dir and (os.path.isabs(raw_target_dir) or raw_target_dir.startswith(('/', '\\'))):
                    target_base = raw_target_dir
                elif raw_target_dir:
                    target_base = os.path.normpath(os.path.join(BASE_DIR, raw_target_dir))
                else:
                    target_base = os.path.join(BASE_DIR, 'backup')

                target_folder = os.path.join(target_base, date_folder)
                os.makedirs(target_folder, exist_ok=True)

                saved_files = []

                # 1. Save Master Backup JSON
                master_backup = payload.get('masterBackup')
                if master_backup:
                    master_path = os.path.join(target_folder, 'edumanga_master_backup.json')
                    with open(master_path, 'w', encoding='utf-8') as f:
                        json.dump(master_backup, f, ensure_ascii=False, indent=2)
                    saved_files.append('edumanga_master_backup.json')

                # 2. Save Manga Catalog JSON
                catalog_data = payload.get('catalog')
                if catalog_data:
                    catalog_path = os.path.join(target_folder, 'manga_catalog.json')
                    with open(catalog_path, 'w', encoding='utf-8') as f:
                        json.dump(catalog_data, f, ensure_ascii=False, indent=2)
                    saved_files.append('manga_catalog.json')

                # 3. Save Individual Chapters in chapters/ subfolder
                chapters_data = payload.get('chapters', [])
                if chapters_data:
                    chapters_dir = os.path.join(target_folder, 'chapters')
                    os.makedirs(chapters_dir, exist_ok=True)
                    for chap_item in chapters_data:
                        series_id = chap_item.get('seriesId', 'manga').replace('/', '_').replace('\\', '_')
                        chap_id = chap_item.get('id', 'chap').replace('/', '_').replace('\\', '_')
                        chap_filename = f"{series_id}_{chap_id}.json"
                        chap_path = os.path.join(chapters_dir, chap_filename)
                        with open(chap_path, 'w', encoding='utf-8') as f:
                            json.dump(chap_item, f, ensure_ascii=False, indent=2)
                        saved_files.append(f"chapters/{chap_filename}")

                response_data = {
                    "success": True,
                    "targetFolder": target_folder,
                    "dateFolder": date_folder,
                    "savedFiles": saved_files,
                    "totalFiles": len(saved_files),
                    "savedAt": time.strftime('%Y-%m-%d %H:%M:%S')
                }

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))
                print(f"\n[Auto-Backup] 💾 Successfully saved {len(saved_files)} backup files to: {target_folder}")

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                err_res = {"success": False, "error": str(e)}
                self.wfile.write(json.dumps(err_res, ensure_ascii=False).encode('utf-8'))
                print(f"\n[Auto-Backup] ❌ Error saving backup: {e}")
            return

        # Fallback 404 for unknown POST
        self.send_response(404)
        self.end_headers()

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
