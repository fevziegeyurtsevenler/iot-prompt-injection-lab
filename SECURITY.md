# Security Policy

**Project:** IoT Prompt Injection Lab  
**Authors:** Deniz Tektek & Fevzi Ege Yurtsevenler  
**Purpose:** Defensive research and education only

---

## Scope

This project is a **fully client-side simulation** deployed as a static site on GitHub Pages. There is no backend server, no database, no API keys, and no user data collection.

**In scope:**
- Frontend JavaScript/TypeScript vulnerabilities (XSS, prototype pollution)
- Dependency vulnerabilities (npm packages)
- Insecure content in educational material
- Misleading or harmful security guidance

**Out of scope:**
- GitHub Pages infrastructure
- Font delivery (Google Fonts CDN)
- Third-party services not used by this project

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (`main` branch) | ✅ |
| Older commits | ❌ |

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report privately via one of the following:

- **GitHub Private Vulnerability Reporting:**  
  `github.com/fevziegeyurtsevenler/iot-prompt-injection-lab/security/advisories/new`

- **Email:**  
  Security reports can be sent directly to the maintainers. Check the GitHub profile for contact information.

**Please include:**
1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We aim to respond within **72 hours** and resolve confirmed issues within **14 days**.

---

## Security Architecture

### No Backend — Attack Surface Minimized

All simulation logic runs entirely in the browser (TypeScript). There is no:
- Server-side code execution
- Database or storage
- API keys or secrets
- User authentication
- External API calls (except Google Fonts)

### Content Security Policy

The following CSP headers are set via `next.config.ts` and `layout.tsx`:

```
default-src 'self'
script-src 'self' 'unsafe-inline'
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
img-src 'self' data:
connect-src 'self'
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
```

### XSS Prevention

- User input is **never** rendered as HTML (`dangerouslySetInnerHTML` is not used)
- All user input is sanitized before display (HTML tag stripping, max length)
- Input is rendered as `textContent` only

### No Sensitive Data

- No cookies
- No localStorage/sessionStorage with sensitive data
- No analytics or tracking
- No user accounts

---

## Educational Content Disclaimer

This project demonstrates **real attack techniques** (prompt injection, LSB steganography, homoglyph attacks) in a **controlled simulation environment**.

All attack demonstrations:
- Run entirely in the browser — no real IoT devices are affected
- Use simulated payloads against a mock smart home
- Are designed for **defensive awareness**, not offensive use

**This project must not be used to attack real systems.**  
Unauthorized testing of systems you do not own is illegal.

---

## Dependency Security

Dependencies are monitored via **GitHub Dependabot**. Security updates are applied promptly.

To audit dependencies locally:

```bash
cd frontend
npm audit
npm audit fix
```

Known acceptable risks (false positives from `npm audit`) will be documented here if applicable.

---

## Responsible Disclosure

We follow coordinated disclosure:

1. Reporter submits private report
2. Maintainers acknowledge within 72 hours
3. Issue is investigated and fix developed
4. Fix is deployed to `main`
5. Reporter is credited (if desired) in the release notes

---

## License & Legal

This project is released for **defensive research and education only**.

```
© 2026 Deniz Tektek & Fevzi Ege Yurtsevenler
Unauthorized copying, distribution, or commercial use is prohibited.
```

Reproducing attack techniques from this project against real systems without authorization may violate applicable laws including but not limited to:
- Turkish Penal Code Article 243-245 (Computer crimes)
- EU Directive 2013/40/EU (Attacks against information systems)
- Computer Fraud and Abuse Act (USA)
