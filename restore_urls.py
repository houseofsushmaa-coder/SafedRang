import psycopg2

DB_URL = "postgresql://postgres.kveyhshtyznlctuckjae:SushmaaSafed%40123%24@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"

def main():
    log_path = r"C:\Users\MSI-PC\.gemini\antigravity-ide\brain\e5c5bd0a-f903-48b1-9a54-0b0865ae9c6e\.system_generated\tasks\task-412.log"
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Failed to read log: {e}")
        return
        
    mapping = {}
    current_url = None
    
    for line in lines:
        if "Downloading http" in line:
            parts = line.split("Downloading ")
            if len(parts) > 1:
                current_url = parts[1].strip()
                if current_url.endswith("..."):
                    current_url = current_url[:-3]
        elif "Saved to" in line and current_url:
            parts = line.split("Saved to ")
            if len(parts) > 1:
                local_path = parts[1].split(" and updated DB")[0].strip()
                full_local_url = f"http://localhost:5000{local_path}"
                mapping[full_local_url] = current_url
                current_url = None
                
    print(f"Found {len(mapping)} URLs to restore.")
    
    if not mapping:
        return

    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()
    
    updated_count = 0
    for local_url, orig_url in mapping.items():
        cursor.execute("UPDATE product_images SET url = %s WHERE url = %s", (orig_url, local_url))
        updated_count += cursor.rowcount
        
    conn.commit()
    cursor.close()
    conn.close()
    print(f"Restore complete. Updated {updated_count} rows in the database.")

if __name__ == "__main__":
    main()
