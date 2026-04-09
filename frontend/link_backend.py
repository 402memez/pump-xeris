import os

# Your live cloud address
live_url = "https://stunning-nurturing-production-5e0e.up.railway.app"

# The old local addresses it's currently looking for
old_urls = ["http://localhost:8000", "http://127.0.0.1:8000", "ws://localhost:8000"]

print("🔍 Searching frontend for old local connections...")

for root, dirs, files in os.walk("."):
    # Skip node_modules so it doesn't take an hour
    if "node_modules" in root or ".git" in root:
        continue
        
    for file in files:
        if file.endswith((".js", ".jsx", ".ts", ".tsx", ".html", ".env")):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()

                new_content = content
                for old in old_urls:
                    if old in new_content:
                        new_content = new_content.replace(old, live_url)

                # If we made a change, save it and tell the user
                if new_content != content:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"✅ Linked successfully in: {filepath}")
            except Exception as e:
                pass

print("🚀 Frontend connection patching complete!")
