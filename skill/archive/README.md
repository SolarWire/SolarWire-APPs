# Archive — Historical skill versions

This directory preserves **historical versions** of the SolarWire AI skill
package for reference. The current, actively maintained version lives at
[`../solarwire/`](../solarwire/).

## Why these are kept

Each version here corresponds to a public release of the skill that was
distributed and used at some point. They are retained so that:

- **Contributors** can trace how the skill's workflows, references, and
  scripts have evolved over time.
- **Users** who adopted a specific version can compare their existing
  outputs against a snapshot of the skill that produced them.
- **Reviewers** can verify the scope of any breaking change by reading
  the diff between adjacent versions.

## Layout

```
archive/
├── solarwire-0.0.1/                 # Earliest released form
├── solarwire-0.0.2/
├── solarwire-0.0.3/
├── solarwire-0.0.4/
├── solarwire-lite-0.0.1/            # Reduced-surface variant
└── solarwire-lite-0.0.2/
```

The **`solarwire-lite-***` lineage** is a smaller, narrower variant of
the skill. The two lineages have since been unified; `../solarwire/` is
the only version recommended for new users.

## Status

These versions are **frozen**. They will not receive fixes, and the
contents of `lib/`, `workflows/`, and `references/` inside each
subdirectory reflect the package as it was at release time — including
any quirks or rough edges that the current version has since smoothed
out.

If you are looking for the latest skill to install, use
[`../solarwire/`](../solarwire/).
