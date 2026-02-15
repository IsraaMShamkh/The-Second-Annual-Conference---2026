# IJBTCS 2026 Website - Deployment Guide (Hostinger)

This guide provides step-by-step instructions to deploy the IJBTCS 2026 website to your Hostinger account and set up a subdomain.

## 1. Prepare Your Files

Ensure all the following files and folders from your workspace are ready:

- `index.html` (Main landing page)
- `about.html`, `agenda.html`, `registration.html`, `travel.html`, `partners.html`, `sponsorship.html`, `connect.html`
- `css/` (Contains `main.css`)
- `img/` (All background and UI images)
- (Any other assets like fonts or JS folders)

## 2. Create a Subdomain on Hostinger

If you want the site to live at `conference.ijbtcs.com`:

1. Log in to your **Hostinger hPanel**.
2. Go to **Websites** -> **Manage** (for your main domain).
3. Search for **Subdomains** in the sidebar.
4. Enter the name (e.g., `conference`) and click **Create**.
5. Note the "Custom folder for subdomain" (usually `public_html/conference`).

## 3. Upload Files via File Manager

The easiest way to upload:

1. In hPanel, go to **Files** -> **File Manager**.
2. Navigate to the folder created for your subdomain (e.g., `public_html/conference`).
3. Click the **Upload** icon (top right).
4. Select all your files and folders and upload them.

> [!TIP]
> **Pro Method (Faster):** Zip all your files into a single `.zip` file on your computer, upload the zip, and then use the **Extract** feature in the File Manager. This is much faster than uploading files one by one.

## 4. Automation: Git Deployment (Beta)

If you use VS Code and want to avoid manual uploads:

1. **Hostinger hPanel**: Go to **Advanced** -> **Git**.
2. **Repository**: Create a private repository on GitHub and push your code there.
3. **Connect**: Link your GitHub repo to Hostinger in the Git section.
4. **Auto-Deploy**: Use the "Deployment Webhook" URL provided by Hostinger and add it to your GitHub repository settings under **Webhooks**.
5. Once set up, every `git push` will automatically update your website.

## 5. Final Checks

1. Visit your subdomain URL in a browser.
2. Check all links (Home, Registration, etc.) to ensure they navigate correctly.
3. Verify that the **Particles Background** and images are loading properly.

## 5. Troubleshooting

- **404 Not Found:** Ensure your main file is named exactly `index.html` (lowercase).
- **Images Not Loading:** Ensure the `img` folder name in the file manager matches the code (`img/` in lowercase).
- **CSS Not Applying:** Clear your browser cache or use Incognito mode after uploading.

---
*Support: Martina Watson / Israa M. Shamekh*
