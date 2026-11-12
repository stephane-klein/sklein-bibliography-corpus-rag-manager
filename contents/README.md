# Corpus contents

This directory holds the test corpus:

- [`books/`](./books/) — complete books, split into one Markdown file per section.
  Each book directory has a `toc.yaml` (the section tree and its order), a
  `config.yaml` (slug, bibliographic metadata, excluded files) and a `markdown/`
  directory.
- [`single-document-texts/`](./single-document-texts/) — standalone texts.

A Markdown file can have a generated `.md.yaml` sidecar and a
`.md.embeddings.bin` file next to it. The `generate-sidecars` and
`generate-embeddings` tasks at the repository root create them for both
collections.
