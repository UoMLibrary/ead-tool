# Excel to EAD (Browser-based Converter)

A **static, client-side web app** that converts archival Excel spreadsheets into **EAD XML**, entirely in the browser.

This tool replaces existing Python scripts and setup instructions with a **single, zero-install interface**, while preserving the same archival logic and output structure.

## Why this exists

The original Excel → EAD workflow required:

- Installing Python
- Installing multiple packages
- Editing and running scripts
- Understanding command-line output

This app provides the **same conversion capability**, but:

- Runs fully in the browser
- Requires no Python or dependencies
- Makes archival structure decisions explicit
- Reports warnings clearly instead of failing silently

It is designed for **archivists and non-developers**, not just programmers.

## What it does

- Accepts an `.xlsx` Excel file via drag & drop
- Parses and validates archival description data
- Allows the user to choose the archival structure:
  - **Series → File → Item**
  - **Series → Item (flat)**

- Generates valid **EAD XML**
- Downloads the XML file directly
- Reports skipped rows and structural warnings

All processing happens **client-side**.
No files are uploaded anywhere.

## Supported archival structures

### 1. Series → File → Item (hierarchical)

Use when records are grouped into folders/files.

Example structure:

```
Series
 └─ File
    ├─ Item
    └─ Item
```

- Parent/child relationships are inferred from `<unitid>` paths
- Missing file-level rows are handled gracefully
- Items with missing parents are attached to the series and reported as warnings

### 2. Series → Item (flat)

Use when no file/folder level exists.

Example structure:

```
Series
 ├─ Item
 ├─ Item
 └─ Item
```

- All non-series rows are treated as items
- Any file-level grouping is ignored
- Output matches the “flat” Python script behaviour

## Expected Excel format

The app expects an Excel spreadsheet with column headers containing:

- `<c level>` — `series`, `file`, or `item`
- `<unitid>`
- `<unittitle>`
- `<unitdate>`

Optional columns:

- `<extent>`
- `<scopecontent>`

Notes:

- Column names are matched by **content**, not exact spelling
- Rows with no `<c level>` are skipped and reported
- `<scopecontent>` may contain multiple paragraphs (blank-line separated)

## How the app works (pipeline)

The conversion process is intentionally explicit and step-based:

1.  **File ingestion**
    - Drag & drop or select an Excel file

2.  **Excel parsing**
    - Reads the first worksheet - Preserves empty cells

3.  **Normalisation & validation**
    - Detects required columns
    - Cleans values
    - Splits scope content into paragraphs
    - Skips non-descriptive rows
    - Enforces a single series row

4.  **Structure selection**
    - User chooses flat or hierarchical output

5.  **Structure building**
    - Builds a tree representation of the archive
    - Collects warnings (e.g. missing parents)

6.  **EAD XML generation**
    - Recursively converts the tree into EAD XML
    - Omits empty elements

7.  **Download & summary**
    - Downloads the XML file
    - Displays counts and warnings

## Warnings and validation

The app distinguishes between **errors** and **warnings**:

- **Errors** stop the conversion
  (e.g. no series row, invalid `<c level>` values)

- **Warnings** allow conversion to continue
  (e.g. items whose parent file row is missing)

Warnings are displayed clearly in the UI so users understand what happened.

## Styling and UI approach

The interface is intentionally:

- Clean and minimal
- Neutral and professional
- Suitable for institutional use

Styling is handled via a single global stylesheet (`app.css`) and uses:

- System fonts
- Soft borders
- Clear spacing
- Calm warning states (not alarming errors)

## Tech stack

- **Svelte / SvelteKit**
- **TypeScript**
- **SheetJS (`xlsx`)** for Excel parsing
- Native browser APIs for XML generation and download

No backend. No database. No external services.

## Development notes

- All logic is implemented as small, pure functions
- No mutation of source data during transformations
- Hierarchical and flat builds share the same normalised model
- The app is suitable for static hosting

## Non-goals

This tool intentionally does **not**:

- Upload files to a server
- Perform EAD schema validation
- Modify or “fix” archival data automatically
- Invent missing hierarchical structure

Its purpose is **transparent conversion**, not data repair.

## Status

- Core functionality complete
- Flat and hierarchical outputs supported
- Warnings handled gracefully
- Ready for real-world archival spreadsheets

Future enhancements may include previews, schema validation, or batch processing, but are not required for v1.
