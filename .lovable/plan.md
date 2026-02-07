

## Improve App Logo Professionalism

### What's Wrong Now

The current logo implementation has several issues making it look unprofessional:

1. **Blurry raster image**: The logo file (`recall-logo-new.svg`) is actually a PNG bitmap wrapped inside an SVG, so it looks pixelated instead of crisp
2. **Broken layout**: There are two copies of the logo in the header -- one centered but non-clickable, and one hidden but clickable. This is confusing and visually broken
3. **Too large**: The logo is 64px tall (`h-16`), which is oversized for a professional app header
4. **No interaction feedback**: The visible logo doesn't respond to hover or clicks since it's marked as non-interactive

### What Will Change

We'll replace the blurry image-based logo with a clean, crisp text-based wordmark that uses your brand colors and font, paired with a small icon for visual identity.

```text
Before:
+--------------------------------------------------------------+
|  [hidden button]    [BIG BLURRY LOGO, centered]    [Settings] |
+--------------------------------------------------------------+

After:
+--------------------------------------------------------------+
|  [Brain icon] Recall  (clickable, left-aligned)    [Settings] |
+--------------------------------------------------------------+
```

### Changes

**File: `src/components/AppHeader.tsx`**

- Remove the import of the raster logo image
- Remove the absolute-positioned centered logo div (the non-clickable one)
- Remove the invisible clickable button (the `opacity-0` one)
- Replace both with a single, clean clickable logo component:
  - A Brain icon from Lucide (already available in the project) in the brand primary color
  - "Recall" text in bold Inter font using the brand primary color
  - Properly sized at ~32-40px height
  - Left-aligned (standard web convention)
  - Subtle hover effect (opacity transition + slight scale)
  - Proper focus ring for accessibility
  - Clickable, navigating to "/" on click

### Technical Details

- Uses existing `Brain` icon from `lucide-react` (already imported elsewhere in the project)
- Uses the existing `--primary` CSS variable (`hsl(232, 43%, 20%)` / `#1d2349`) for brand consistency
- Uses Inter font (already configured in Tailwind) with `font-bold` weight
- No new dependencies or assets needed
- The landing page hero logo (`recall-main-logo.png`) is unaffected -- this change only applies to the in-app header

