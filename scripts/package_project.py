import os
import zipfile
import sys

def create_archive(output_zip="MediCore_Complete_Project.zip"):
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    print(f"Creating archive from root: {root_dir}")

    # Exclusions
    exclude_dirs = {
        'node_modules',
        '.next',
        '.git',
        '__pycache__',
        '.pytest_cache',
        '.venv',
        'venv',
        'backups'
    }
    
    exclude_files = {
        '.env',
        'backend_out.log',
        'backend_err.log',
        output_zip
    }
    
    exclude_extensions = {
        '.pyc',
        '.tsbuildinfo',
        '.log'
    }

    zip_path = os.path.join(root_dir, output_zip)
    if os.path.exists(zip_path):
        os.remove(zip_path)

    file_count = 0
    total_uncompressed_bytes = 0

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for current_root, dirs, files in os.walk(root_dir):
            # Prune excluded directories in-place
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.next')]

            for f in files:
                if f in exclude_files:
                    continue
                _, ext = os.path.splitext(f)
                if ext in exclude_extensions:
                    continue

                abs_file_path = os.path.join(current_root, f)
                rel_path = os.path.relpath(abs_file_path, root_dir)

                # Skip if inside an excluded directory path
                parts = rel_path.split(os.sep)
                if any(p in exclude_dirs for p in parts):
                    continue

                zipf.write(abs_file_path, rel_path)
                file_count += 1
                total_uncompressed_bytes += os.path.getsize(abs_file_path)

    zip_size_mb = os.path.getsize(zip_path) / (1024 * 1024)
    print(f"Successfully packaged {file_count} files into {output_zip}")
    print(f"Archive Size: {zip_size_mb:.2f} MB (Uncompressed: {total_uncompressed_bytes / (1024 * 1024):.2f} MB)")
    print(f"Archive Absolute Path: {zip_path}")

if __name__ == "__main__":
    create_archive()
