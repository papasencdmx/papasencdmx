# Guia de Campamentos de Verano 2026 - Deployment Instructions

## What This Is

Updated Summer Camp Guide with 4 featured sponsors (Real Madrid, Las Encinas, InterWay, Summer SEK), a Destacado sponsor (Orea Camp), 99 camp listings in card grid format, and GA4 click tracking on all CTA buttons.

Two files to deploy:
- `guia-campamentos-verano-2026-v5.html` (the web page, self-contained with all images as base64)
- `guia-campamentos-verano-2026.pdf` (downloadable PDF version)


---

## STEP 1: Deploy the HTML Page

The HTML file is fully self-contained (all images embedded as base64, all CSS inline, no external dependencies except Google Fonts and GA4). 

**Option A: Static page on Vercel (recommended)**
1. Place the HTML file in the `/public` directory of the Next.js project
2. Rename it to something clean: `/public/guia-campamentos-verano-2026.html`
3. Also place the PDF in `/public/guia-campamentos-verano-2026.pdf`
4. Deploy normally
5. The guide will be accessible at: `padresenmadrid.com/guia-campamentos-verano-2026.html`

**Option B: As a Next.js page (if you want it under the site routing)**
1. Create a new page route, e.g., `/app/guia-campamentos/page.tsx`
2. Use an iframe or convert the HTML content into a React component
3. Option A is simpler and recommended since the file is self-contained

**Option C: Standalone deploy (fastest)**
1. Just upload the HTML file to any hosting (even a simple S3 bucket or Cloudflare Pages)
2. Point a subdomain or path to it


---

## STEP 2: Set Up GA4 Custom Dimensions

The GA4 tracking code is already embedded in the HTML (measurement ID: G-P7K2W1TK35). Every CTA button fires a custom event called `cta_click` with three parameters. For these parameters to show up in GA4 reports, you need to register them as custom dimensions.

1. Go to https://analytics.google.com
2. Select the Padres en Madrid property
3. Click **Admin** (gear icon, bottom left)
4. Under **Data display**, click **Custom definitions**
5. Click **Create custom dimension** and add these three:

   **Dimension 1:**
   - Dimension name: `Advertiser`
   - Scope: `Event`
   - Event parameter: `advertiser`
   - Click Save

   **Dimension 2:**
   - Dimension name: `Placement`
   - Scope: `Event`
   - Event parameter: `placement`
   - Click Save

   **Dimension 3:**
   - Dimension name: `Destination`
   - Scope: `Event`
   - Event parameter: `destination`
   - Click Save

These take 24-48 hours to start populating with data after the page is live.


---

## STEP 3: Verify GA4 Is Working

After deploying:

1. Open the guide page in your browser
2. In another tab, go to GA4 > **Reports** > **Realtime**
3. You should see your visit appear within seconds
4. Click any CTA button on the guide
5. In the Realtime report, scroll to **Event count by Event name**
6. You should see `cta_click` appear
7. Click into it to verify the `advertiser` parameter is being sent

If you don't see anything in Realtime after 2 minutes, check:
- Is the page loading from the deployed URL (not from a local file)?
- Open browser DevTools > Network tab, search for "gtag" - do you see requests going to google-analytics.com?
- Are any ad blockers or privacy extensions active?


---

## STEP 4: How to View Advertiser Reports

Once data is flowing (give it 24-48 hours), here's how to pull click reports per advertiser:

1. Go to GA4 > **Reports** > **Engagement** > **Events**
2. Find `cta_click` in the event list, click on it
3. You'll see total click count
4. To break down by advertiser: click **Add comparison** or use **Explore** (left sidebar)
5. In **Explore**, create a Free Form report:
   - Rows: `Advertiser` (the custom dimension you created)
   - Values: `Event count`
   - Filter: Event name = `cta_click`
6. This gives you a table: Campus Experience Real Madrid: 234 clicks, Summer SEK: 189 clicks, etc.


---

## What's Being Tracked

Each featured CTA button sends these parameters when clicked:

| Button | advertiser | placement | destination |
|--------|-----------|-----------|-------------|
| Campus Experience Real Madrid | campus-experience-realmadrid | guia-recomendado | campusexperiencermf.com |
| Club Las Encinas | club-las-encinas | guia-recomendado | clublasencinas.es |
| InterWay International | interway | guia-recomendado | interway.es |
| Summer SEK | summer-sek | guia-recomendado | cursosdeverano.sek.es |
| Orea Camp | orea-camp | guia-destacado | oreacamp.es |
| Incluir mi campamento (CTA banner) | padresenmadrid | guia-cta-banner | self |


---

## UTM Parameters on Outbound Links

All featured CTA links already include UTM parameters so advertisers can also see traffic in their own analytics:

- utm_source=padresenmadrid
- utm_medium=guia-campamentos
- utm_campaign=verano2026
- utm_content=recomendado-[advertiser-name]


---

## PDF Download Button

The HTML page has a fixed top bar with two buttons:
- **Descargar PDF**: Uses html2pdf.js (loaded from CDN) to generate a PDF client-side
- **Imprimir**: Opens the browser print dialog

The pre-generated PDF file should also be hosted alongside the HTML so we can link to it directly from newsletters or emails if needed.


---

## File Sizes
- HTML: ~2.7 MB (19 embedded base64 images)
- PDF: ~2.2 MB (12 pages)

Both are self-contained and require no external image hosting.
