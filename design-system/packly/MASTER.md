# Design System Master File — Packly (LOCKED)

> Auto-generated script colors (blue SaaS) were **rejected**. This file is the product lock.
> Page overrides live in `design-system/packly/pages/`.

**Project:** Packly  
**Category:** Network security / packet ops dashboard  
**Dial:** Density 9 · Motion 5 · Variance 6  

---

## Locked direction

Dark **phosphor radar** ops aesthetic. Dense live tables, not marketing chrome.

### Typography

| Role | Font |
|------|------|
| Display / brand | **Syne** (`next/font/google`) |
| Tables / data | **IBM Plex Mono** |

Avoid Inter, Roboto, Arial, system stacks.

### Color tokens

| Token | Hex / value |
|-------|-------------|
| `--ink` | `#071210` |
| `--panel` | `#0E1A18` |
| `--surface` | `#132420` |
| `--phosphor` | `#3DFFC8` |
| `--warn` | `#F0A202` |
| `--signal` | `#FF5C5C` |
| `--fog` | `#A8C5BC` |
| `--line` | `rgba(61,255,200,0.14)` |

Atmosphere: scanline + grid + radial phosphor glow. **No purple gradients.**

### Motion (2–3 intentional)

1. Live status pulse on capture indicator  
2. Staggered row fade-in on packet / history tables  
3. Phosphor underline / hover on nav  

Respect `prefers-reduced-motion`.

### Pattern notes (from ui-ux-pro-max)

- Style family: **Data-Dense Dashboard** (keep density; reject default blue palette)  
- Effects: row highlight on hover, chart tooltips, loading feedback  
- Avoid: ornate marketing cards, emoji icons, purple glow

### Refs

- 21st: Firewall Rack, System Monitor, Health Checks, Streaming Data Rows patterns  
- Mobbin: unavailable (paid plan)  
- Context: linear.app density rhythm (not Inter fonts)
