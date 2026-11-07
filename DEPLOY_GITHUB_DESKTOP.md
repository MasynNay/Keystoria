# Deploy Keystoria with GitHub Desktop and Cloudflare DNS

Intended site: **https://keystoria.masynnay.com**. Existing **aftertone.masynnay.com** remains unchanged.

## 1. Publish the repository using GitHub Desktop

1. Extract `Keystoria-GitHub-Desktop-Ready.zip` fully. The extracted folder contains a hidden `.git` folder, plus `index.html`, `CNAME`, and `app/`.
2. Open **GitHub Desktop → File → Add Local Repository**.
3. Choose the extracted `Keystoria-GitHub-Desktop-Ready` directory and click **Add Repository**.
4. Click **Publish repository**. Use **Name: keystoria**, and select **Keep this code private** = **off** (public repo, for ordinary free GitHub Pages). Publish.
5. In GitHub Desktop, **Repository → View on GitHub**. Confirm that `index.html`, `styles.css`, `assets/`, `app/`, and `CNAME` are at the repository root.

*If Desktop instead says the folder is not a Git repository, the hidden `.git` folder was lost in extraction. Run `git init -b main`, `git add .`, and `git commit -m "Initial Keystoria portfolio and source release"` inside the extracted folder, then repeat step 2, or create a new repo in Desktop and copy these files into it.*

## 2. Enable GitHub Pages

1. Open `https://github.com/MasynNay/keystoria`.
2. Select **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**. Set **Branch: main** and folder **/ (root)**, then **Save**.
4. Under **Custom domain**, enter `keystoria.masynnay.com` and **Save** (the repository already contains a root-level `CNAME` file).
5. When the certificate is ready, tick **Enforce HTTPS**. It can take time for GitHub to issue the certificate after DNS is correct.

## 3. Create the new DNS record in Cloudflare

1. Open Cloudflare → choose `masynnay.com` → **DNS → Records → Add record**.
2. Enter:

   | Field | Value |
   | --- | --- |
   | Type | CNAME |
   | Name | `keystoria` |
   | Target / Content | `masynnay.github.io` |
   | Proxy status | DNS only (gray cloud) |
   | TTL | Auto |

3. Save. Do **not** edit, remove or overwrite your existing `aftertone` record. These two subdomains can use the same CNAME target.

## 4. Verify

- Check GitHub **Settings → Pages** for the published site and successful DNS check.
- Visit `https://keystoria.masynnay.com` in a private window.
- Make sure the Keystoria logo, large homepage image, and Lyric Lab image load.
- Click **Explore the experiences**, **View source on GitHub**, and **How to play**.
- Confirm that `https://aftertone.masynnay.com` still works.

You can check the CNAME on macOS in Terminal with:

```bash
dig keystoria.masynnay.com CNAME +short
```

Expected target: `masynnay.github.io.` (a final dot is normal).

## Important hosting limitation

This repository's website is a responsive **showcase**. The live co-op missions, real-time Python game engine, and backend-synced Lyric Lab are in `app/`, and they **will not work as a GitHub Pages-only upload**. Publishing a fully playable online demo requires a separate service that runs the `aiohttp` backend and supports HTTPS and WebSockets.

## Why both CNAMEs point to the same place

GitHub Pages matches each requested custom domain to its repository through the custom domain assigned in that repository's **Settings → Pages**. Multiple subdomains can therefore point to one GitHub Pages account target without mixing their content.
