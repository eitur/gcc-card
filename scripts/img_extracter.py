import fitz  # PyMuPDF
import os
import re
import io
from pathlib import Path
from PIL import Image

def generate_name(name, replace_character='-'):
    """
    Convert filename to lowercase and replace spaces/special chars.
    
    Args:
        name: Original filename
        replace_character: Character to use for replacement (default: '-')
    Returns:
        Cleaned filename
    """
    name = name.lower()                   # lowercase
    name = re.sub(r'[^a-z0-9]+', replace_character, name)  # replace non-alphanumeric
    name = name.strip(replace_character)  # remove leading/trailing replace_character

    return name

def optimize_image(image_bytes, max_width=300, quality=60, output_format='webp'):
    """
    Optimize image for web: resize and compress.
    
    Args:
        image_bytes: Original image bytes
        max_width: Maximum width in pixels (default: 800)
        quality: Quality 1-100 (default: 85)
        output_format: 'webp', 'jpeg', or 'png' (default: 'webp')
    Returns:
        Optimized image bytes and extension
    """
    try:
        # Open image from bytes
        img = Image.open(io.BytesIO(image_bytes))
        
        # Resize if image is too large
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        
        # Save to bytes with optimization
        output = io.BytesIO()
        
        if output_format.lower() == 'webp':
            # WebP supports both RGB and RGBA
            img.save(output, format='WEBP', quality=quality, method=6)
            ext = 'webp'
        elif output_format.lower() == 'png':
            # PNG for transparency
            img.save(output, format='PNG', optimize=True)
            ext = 'png'
        else:  # JPEG
            # Convert RGBA to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = background
            img.save(output, format='JPEG', quality=quality, optimize=True)
            ext = 'jpg'
        
        return output.getvalue(), ext
    
    except Exception as e:
        print(f"Warning: Could not optimize image: {e}")
        return image_bytes, 'png'  # Return original if optimization fails


def extract_images_from_pdf(pdf_path, output_folder="images/cards-webp", optimize=True, 
                           max_width=800, quality=85, output_format='webp'):
    """
    Extract images from PDF and name them based on the English card name.
    
    Args:
        pdf_path: Path to the PDF file
        output_folder: Folder to save extracted images
        optimize: Whether to optimize images (default: True)
        max_width: Maximum width for optimization (default: 800px)
        quality: Quality 1-100 (default: 85)
        output_format: 'webp', 'jpeg', or 'png' (default: 'webp')
    """
    # Create output folder if it doesn't exist
    Path(output_folder).mkdir(parents=True, exist_ok=True)
    
    # Open the PDF
    doc = fitz.open(pdf_path)
    
    # Counter for images
    img_counter = 0
    total_original_size = 0
    total_optimized_size = 0
    replaced_count = 0
    
    # Iterate through pages
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Get images on the page
        image_list = page.get_images(full=True)
        
        # Extract text from the page for naming
        text = page.get_text("text")
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        # Find card names - lines that start with capital letter and aren't numbers
        card_names = []
        for line in lines:
            # Skip empty lines, numbers, and headers
            if (line and 
                not line.isdigit() and 
                line not in ['No.', '이미지', 'Eng', 'Image'] and
                line[0].isupper()):
                # This should be a card name
                card_names.append(line)
        
        # Extract each image
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            
            # Track original size
            original_size = len(image_bytes)
            total_original_size += original_size
            
            # Optimize image if enabled
            if optimize:
                image_bytes, image_ext = optimize_image(image_bytes, max_width, quality, output_format)
            else:
                image_ext = base_image["ext"]
            
            # Track optimized size
            optimized_size = len(image_bytes)
            total_optimized_size += optimized_size
            
            # Determine filename
            if img_index < len(card_names):
                # Use the card name and clean it
                clean_name = generate_name(card_names[img_index], '-')
                filename = f"{clean_name}.{image_ext}"
            else:
                # Fallback to numbered naming
                filename = f"image-{img_counter:03d}.{image_ext}"
            
            # Save the image (replace if exists)
            image_path = os.path.join(output_folder, filename)
            
            # Check if file exists
            if os.path.exists(image_path):
                status = "Replaced"
                replaced_count += 1
            else:
                status = "Saved"
            
            with open(image_path, "wb") as img_file:
                img_file.write(image_bytes)
            
            # Show size reduction
            reduction = ((original_size - optimized_size) / original_size * 100) if optimize else 0
            print(f"{status}: {filename} ({original_size/1024:.1f}KB → {optimized_size/1024:.1f}KB, {reduction:.1f}% reduction)")
            
            img_counter += 1
    
    doc.close()
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"Total images extracted: {img_counter}")
    print(f"New files: {img_counter - replaced_count}")
    print(f"Replaced files: {replaced_count}")
    print(f"Original total size: {total_original_size/1024:.1f}KB")
    print(f"Optimized total size: {total_optimized_size/1024:.1f}KB")
    if optimize:
        total_reduction = ((total_original_size - total_optimized_size) / total_original_size * 100)
        print(f"Total size reduction: {total_reduction:.1f}%")
    print(f"Images saved to: {output_folder}")
    print(f"{'='*60}")


# Usage
if __name__ == "__main__":
    pdf_file = "card_image.pdf"  # Change this to your PDF filename
    output_dir = "../images/cards-webp"
    
    # WebP (BEST - smallest size, good quality)
    extract_images_from_pdf(
        pdf_file, 
        output_dir, 
        optimize=True,
        max_width=800,
        quality=85,
        output_format='webp'  # Recommended!
    )