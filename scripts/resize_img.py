from PIL import Image
import os

def reduce_webp_images(folder_path, quality=80, max_width=200, max_height=280, output_folder=None):
    """
    Recursively reduce the size of all WebP images in a folder and its subfolders.
    Resizes images while maintaining aspect ratio.
    
    Args:
        folder_path: Path to the folder containing WebP images
        quality: Quality setting (1-100, default 80)
        max_width: Maximum width in pixels (default 1920)
        max_height: Maximum height in pixels (default 1080)
        output_folder: Optional separate output folder (default overwrites originals)
    """
    # Walk through all directories and subdirectories
    for root, dirs, files in os.walk(folder_path):
        for filename in files:
            if filename.lower().endswith('.webp'):
                input_path = os.path.join(root, filename)
                
                # Determine output path
                if output_folder:
                    # Recreate folder structure in output folder
                    relative_path = os.path.relpath(root, folder_path)
                    output_dir = os.path.join(output_folder, relative_path)
                    os.makedirs(output_dir, exist_ok=True)
                    output_path = os.path.join(output_dir, filename)
                else:
                    output_path = input_path
                
                try:
                    # Open image
                    img = Image.open(input_path)
                    original_size_bytes = os.path.getsize(input_path)
                    original_dimensions = img.size
                    
                    # Resize if image is larger than max dimensions
                    if img.width > max_width or img.height > max_height:
                        # Calculate new size maintaining aspect ratio
                        img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
                    
                    # Save with reduced quality
                    img.save(output_path, 'WEBP', quality=quality, method=6)
                    
                    # Get file sizes
                    new_size_bytes = os.path.getsize(output_path)
                    reduction = (1 - new_size_bytes/original_size_bytes) * 100
                    
                    # Show relative path and dimensions for clarity
                    relative_file_path = os.path.relpath(input_path, folder_path)
                    new_dimensions = Image.open(output_path).size
                    
                    print(f"✓ {relative_file_path}")
                    print(f"  {original_dimensions[0]}x{original_dimensions[1]} → {new_dimensions[0]}x{new_dimensions[1]}")
                    print(f"  {original_size_bytes/1024:.1f}KB → {new_size_bytes/1024:.1f}KB ({reduction:.1f}% reduction)")
                    
                except Exception as e:
                    print(f"✗ Error processing {filename}: {e}")


if __name__ == "__main__":
    folder_path = "./images/cards-webp"
    output_path = "./images/cards-webp-new"
    reduce_webp_images(folder_path, quality=65, max_width=200, max_height=280, output_folder=output_path)