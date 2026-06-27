# Images

Static image assets (logos, icons, illustrations, etc.) for the Manasu app.

Files placed here are served from the site root. For example:

- `public/images/logo.svg` → available at `/images/logo.svg`
- `public/images/logos/manasu-mark.png` → available at `/images/logos/manasu-mark.png`

## Usage in components

```tsx
import Image from "next/image";

<Image src="/images/logo.svg" alt="Manasu" width={120} height={40} />
```

## Suggested structure

- `images/logos/` — brand logos and marks
- `images/icons/` — UI icons
- `images/illustrations/` — larger graphics
