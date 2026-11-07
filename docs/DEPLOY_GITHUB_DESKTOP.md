# Publish Keystoria with GitHub Pages and Cloudflare

Keystoria's public portfolio is available at **https://keystoria.masynnay.com/**, with three practice modes at **https://keystoria.masynnay.com/play/**. The 24 story missions and co-op rooms still require the local Python server.

> **Current setup:** The repository is public, GitHub Actions hosts the website, and the custom domain is configured. The steps below are retained for future maintenance and troubleshooting. Do not change the existing Aftertone DNS record.

## 1. Make the existing repository public (GitHub Free)

1. Visit https://github.com/MasynNay/Keystoria/settings
2. Scroll down to **Danger Zone** in **Settings → General**.
3. Select **Change repository visibility** → **Make public** and complete GitHub's confirmation.

**Important:** Making a repository public exposes **all committed files and Git history**, including the game source in `app/`. Review the repository for passwords, API keys, personal data, and proprietary material before switching visibility. This project's tracked file list was checked for obvious secret filenames, but that is not a comprehensive secrets audit.

If your GitHub plan supports Pages on private repositories, you can instead keep it private, but the portfolio itself will still be accessible to visitors through GitHub Pages.

## 2. Enable the existing GitHub Actions publishing workflow

1. Open https://github.com/MasynNay/Keystoria/settings/pages
2. Under **Build and deployment**, choose **Source: GitHub Actions**. **Do not** select "Deploy from a branch" or the repository root.
3. The workflow in `.github/workflows/pages.yml` publishes *only* the `site/` folder after checking its required assets.
4. Open https://github.com/MasynNay/Keystoria/actions and find **Deploy Keystoria portfolio**. If it has not run automatically or failed before Pages was enabled, open the workflow, select **Run workflow**, choose `main`, and run it.
5. Wait until the workflow reports a successful deployment before using the custom domain.

GitHub Pages does not execute the Python files in `app/`. Those remain source code for the full local game.

## 3. Configure the custom domain in GitHub

1. In **Settings → Pages**, under **Custom domain**, enter `keystoria.masynnay.com` and select **Save**.
2. GitHub Pages configured with an Actions workflow ignores `CNAME` files in the repository. The actual setting must be saved in Pages.

## 4. Create the DNS record in Cloudflare

Cloudflare → masynnay.com → DNS → Records → Add record:

| Field | Value |
| --- | --- |
| Type | `CNAME` |
| Name | `keystoria` |
| Target / Content | `masynnay.github.io` |
| Proxy status | **DNS only** (gray cloud) |
| TTL | Auto |

Do not modify or delete the existing `aftertone` DNS record. Multiple subdomains may point to the same GitHub Pages account while each has its own GitHub Pages custom domain setting.

## 5. Check the website

- Revisit **Settings → Pages** for a successful DNS check and the published URL.
- Enable **Enforce HTTPS** once GitHub has provisioned the certificate.
- Open https://keystoria.masynnay.com in a private browser window.
- Check the current K logo, portfolio preview, Lyric Lab screenshot, and browser-app navigation.
- Confirm https://aftertone.masynnay.com still works.

On macOS, you can check DNS resolution with:

```bash
dig keystoria.masynnay.com CNAME +short
```

Expected target: `masynnay.github.io.` (trailing dot is normal). DNS and certificate updates are not always instantaneous.

## Repository layout

- `site/` contains the exact static files published by GitHub Actions.
- `app/` contains the full Keystoria v0.24 game and tests.
- `docs/` contains deployment instructions.
- `.github/workflows/pages.yml` contains the automatic deployment job.
- `README.md` is the repository front page.

## GitHub Desktop after repository edits

Because the repository has been reorganized on GitHub, open your local Keystoria repository in GitHub Desktop and select **Fetch origin → Pull origin** before making more local edits. If you have uncommitted local changes, save them first.
