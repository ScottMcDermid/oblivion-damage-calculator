# Oblivion Damage Calculator

![Status](https://img.shields.io/badge/Status-Experimental-8A2BE2?style=flat-square)
![Made with Next.js](https://img.shields.io/badge/Next.js-powered-black?style=flat-square)
![License GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-brightgreen?style=flat-square)

Compute precise damage output for weapon attacks and hand-to-hand combat in The Elder Scrolls IV: Oblivion.
Source for https://damage.oblivion.tools

## Highlights

- Four calculation modes: Blade, Blunt, Bow, and Hand to Hand, each implementing the full UESP damage formula.
- Weapon presets for all materials (Iron through Daedric) with auto-populated base damage and condition fields.
- Collapsible breakdown panel showing every intermediate formula step with tooltips.
- Vanilla and Remastered mode support, plus a full difficulty slider (-100 to +100).

## Getting Started

### Development

1. Ensure `docker`, `docker compose`, and `make` are installed.
2. Launch the development stack:
   ```bash
   make dev
   ```
3. Navigate to [http://localhost:3000](http://localhost:3000) and start calculating.

### Deployment

To build the production image and boot the server:

```bash
make prod-build
```

Then visit [http://localhost:3000](http://localhost:3000).

## Configuration

Adjust `.env` to override defaults for local runs.

| Name             | Purpose                |
| ---------------- | ---------------------- |
| `CONTAINER_NAME` | Docker container name  |
| `PORT`           | Port server listens to |

## Helpful Commands

- `make stop` -- halt running containers.
- `make logs` -- tail application logs for quick debugging.

## Legal

- **Trademarks** -- *The Elder Scrolls*, *Oblivion*, and related marks are the property of Bethesda
  Softworks/ZeniMax. References here are purely descriptive; this project is independent,
  non-commercial, and not endorsed by the rights holders.
- **Copyright** -- All original code in this repository is released under the GNU General Public
  License v3.0 (see `LICENSE`). External assets retain their original ownership and are either
  used with permission or under their respective licenses.
- **Community transparency** -- Contributions occur publicly through issues, pull requests, and
  commit history so authorship remains attributable. Please flag any content concerns and they
  will be reviewed or removed to keep the project respectful of both community norms and IP
  boundaries.
