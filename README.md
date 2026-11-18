# Minjok Herald content

Content for news.kmla.online, edited with [Pages CMS](https://app.pagescms.org).
Every save in Pages CMS is a commit to this repository.

| Folder      | Holds                                      |
| ----------- | ------------------------------------------ |
| `articles/` | Stories (`<slug>.md`)                      |
| `editions/` | New term editions (`edition-<number>.yml`) |
| `polls/`    | Polls (`<id>.yml`)                         |
| `media/`    | Uploaded photos and PDFs                   |

`.pages.yml` defines the editor forms. The newspaper re-checks every file and skips invalid
ones, so keep `.pages.yml` in step with the newspaper code in `kmlaswtech/kmla-online`
(`news/`).

`.github/workflows/sync-media-to-r2.yml` copies `media/` to Cloudflare R2. It stays off until
the `R2_BUCKET` and `R2_ACCOUNT_ID` variables and the `R2_ACCESS_KEY_ID` and
`R2_SECRET_ACCESS_KEY` secrets are set.
