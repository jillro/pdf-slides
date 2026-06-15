# pdf-posts

Next.js editor for generating Instagram-sized social media slides for Parti des Femmes, with PDF/PNG export.

## Development

```bash
npm install              # Install dependencies

npm run dev              # Start dev server at http://localhost:3000
npm run build            # Production build
npm run start            # Run production server

npm run lint             # Lint
npm run format           # Format with Prettier
```

## Environment variables

Environment variables are read from a `.env` file at the repo root (gitignored). Copy from a teammate, or set them in your deployment environment.

| Variable               | Required?       | Purpose                                                                                                                              |
| ---------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `REDIS_URL`            | optional        | Redis connection string. When unset, posts are stored in an in-memory Map (dev only, lost on restart). Used in `src/app/storage.tsx`. |
| `WORDPRESS_URL`        | informational   | Default WordPress site the editor's import form targets. Not currently read by code — kept in `.env` as a project hint.              |
| `S3_ENDPOINT`          | required for S3 | S3-compatible endpoint, e.g. `https://s3.fr-par.scw.cloud` for Scaleway.                                                             |
| `S3_REGION`            | required for S3 | Region slug, e.g. `fr-par`.                                                                                                          |
| `S3_BUCKET`            | required for S3 | Bucket name. The bucket must allow public read on objects and have a CORS rule permitting `GET` and `PUT` from the app's origins.    |
| `S3_ACCESS_KEY_ID`     | required for S3 | Access key.                                                                                                                          |
| `S3_SECRET_ACCESS_KEY` | required for S3 | Secret key.                                                                                                                          |
| `S3_PUBLIC_URL_BASE`   | optional        | Override for the public URL prefix. Defaults to `${S3_ENDPOINT}/${S3_BUCKET}`. Useful when the bucket is fronted by a CDN or custom domain. |

**S3 configuration is all-or-nothing.** When any of the five required `S3_*` variables is missing, image uploads fall back to the legacy behavior (base64-encoded into Redis). Either set all five, or leave them all unset.
