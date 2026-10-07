import os
import requests
import psycopg2
from urllib.parse import urlparse

# Connect directly to the Supabase database
DB_URL = "postgresql://postgres.kveyhshtyznlctuckjae:SushmaaSafed%40123%24@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"

# Target uploads directory in backend
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "safedrang-backend", "public", "uploads"))

# Ensure directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

def download_image(url):
    try:
        # Some servers require a User-Agent
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 200:
            filename = os.path.basename(urlparse(url).path)
            if not filename:
                filename = "image.jpg"
            # Ensure unique filename
            base, ext = os.path.splitext(filename)
            filepath = os.path.join(UPLOAD_DIR, filename)
            counter = 1
            while os.path.exists(filepath):
                filename = f"{base}_{counter}{ext}"
                filepath = os.path.join(UPLOAD_DIR, filename)
                counter += 1
                
            with open(filepath, 'wb') as f:
                f.write(response.content)
            # Local URL format matching standard express static serving
            return f"/uploads/{filename}"
        else:
            print(f"Failed {url}: HTTP {response.status_code}")
    except Exception as e:
        print(f"Error downloading {url}: {e}")
    return None

def main():
    try:
        print("Connecting to database...")
        conn = psycopg2.connect(DB_URL)
        cursor = conn.cursor()
        
        # Get all images that have remote URLs
        cursor.execute("SELECT id, url FROM product_images WHERE url LIKE 'http%'")
        images = cursor.fetchall()
        
        print(f"Found {len(images)} images to download.")
        
        for index, (img_id, url) in enumerate(images):
            print(f"[{index+1}/{len(images)}] Downloading {url}...")
            local_path = download_image(url)
            if local_path:
                # Add full backend URL if necessary, or just relative
                full_local_url = f"http://localhost:5000{local_path}"
                cursor.execute("UPDATE product_images SET url = %s WHERE id = %s", (full_local_url, img_id))
                conn.commit()
                print(f" -> Saved to {local_path} and updated DB.")
            else:
                print(f" -> Failed to download {url}")
                
        cursor.close()
        conn.close()
        print("Bulk import completed successfully!")
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    main()
