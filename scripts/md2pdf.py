# Markdown を A4 の PDF に変換する（日本語フォント対応、Playwright 同梱の Chromium を使用）
# 使い方: pip install markdown && python3 scripts/md2pdf.py 入力.md 出力.pdf
import sys, markdown, subprocess, pathlib
src = pathlib.Path(sys.argv[1]); out = pathlib.Path(sys.argv[2])
body = markdown.markdown(src.read_text(encoding='utf-8'), extensions=['tables'])
html = f"""<!doctype html><html lang="ja"><head><meta charset="utf-8">
<style>
@page {{ size: A4; margin: 18mm 16mm; }}
body {{ font-family: "IPAGothic", "WenQuanYi Zen Hei", sans-serif; font-size: 10.5pt; line-height: 1.6; color: #222; }}
h1 {{ font-size: 18pt; border-bottom: 2px solid #333; padding-bottom: 4px; margin: 0 0 12px; }}
h2 {{ font-size: 13pt; margin: 20px 0 8px; border-left: 4px solid #555; padding-left: 8px; }}
table {{ border-collapse: collapse; width: 100%; margin: 6px 0 12px; font-size: 9.5pt; page-break-inside: auto; }}
tr {{ page-break-inside: avoid; }}
th, td {{ border: 1px solid #999; padding: 5px 7px; vertical-align: top; text-align: left; }}
th {{ background: #eee; white-space: nowrap; }}
th:first-child, td:first-child {{ min-width: 5.5em; }}
ul {{ padding-left: 1.4em; }} li {{ margin: 2px 0; }}
a {{ color: #1a56a0; word-break: break-all; }}
strong {{ font-weight: bold; }}
</style></head><body>{body}</body></html>"""
tmp = out.with_suffix('.tmp.html'); tmp.write_text(html, encoding='utf-8')
subprocess.run(["/opt/pw-browsers/chromium-1194/chrome-linux/chrome","--headless=new","--no-sandbox","--disable-gpu",
  "--no-pdf-header-footer", f"--print-to-pdf={out}", f"file://{tmp.resolve()}"], check=True, capture_output=True)
tmp.unlink(); print("wrote", out, out.stat().st_size, "bytes")
