"""
Assemble demo screenshots into an animated GIF
"""
import os
import glob
from PIL import Image

SCREENSHOTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'demo-screenshots')
OUTPUT_GIF = os.path.join(os.path.dirname(__file__), '..', 'demo-screenshots', 'VAST_Demo.gif')
FRAME_DURATION = 2500  # ms per frame

def main():
    # Find all PNG screenshots sorted by name
    pattern = os.path.join(SCREENSHOTS_DIR, '*.png')
    files = sorted(glob.glob(pattern))

    if not files:
        print('No screenshots found in', SCREENSHOTS_DIR)
        return

    print(f'Found {len(files)} screenshots')

    # Open and resize all images to consistent size
    frames = []
    target_size = None

    for f in files:
        img = Image.open(f).convert('RGB')
        if target_size is None:
            target_size = img.size
        else:
            img = img.resize(target_size, Image.LANCZOS)
        frames.append(img)
        print(f'  Added: {os.path.basename(f)} ({img.size[0]}x{img.size[1]})')

    if not frames:
        print('No frames to assemble')
        return

    # Save as animated GIF
    frames[0].save(
        OUTPUT_GIF,
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION,
        loop=0,  # infinite loop
        optimize=True
    )

    size_mb = os.path.getsize(OUTPUT_GIF) / (1024 * 1024)
    print(f'\n✅ GIF created: {OUTPUT_GIF}')
    print(f'   Size: {size_mb:.1f} MB')
    print(f'   Frames: {len(frames)}')
    print(f'   Duration: {len(frames) * FRAME_DURATION / 1000:.0f}s total ({FRAME_DURATION/1000:.1f}s per frame)')

if __name__ == '__main__':
    main()
