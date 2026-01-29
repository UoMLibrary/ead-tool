import pandas as pd
from lxml import etree
import os
import re

# Auto-install natsort if not already present
try:
    from natsort import natsorted
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "natsort"])
    from natsort import natsorted


def clean_scope_text(text):
    """Split scopecontent into paragraphs."""
    if pd.isna(text):
        return []
    paragraphs = re.split(r"\n\s*\n|\r\n\s*\r\n", str(text).strip())
    return [p.strip() for p in paragraphs if p.strip()]


def generate_flat_ead(excel_path, series_id, series_title, output_path):
    df = pd.read_excel(excel_path)

    # ---- Column mapping ----
    level_col = next((c for c in df.columns if "<c level" in c.lower()), None)
    unitid_col = next(c for c in df.columns if "<unitid" in c)
    unittitle_col = next(c for c in df.columns if "<unittitle" in c)
    unitdate_col = next(c for c in df.columns if "<unitdate" in c)
    extent_col = next((c for c in df.columns if "<extent" in c), None)
    scope_col = next((c for c in df.columns if "<scopecontent" in c), None)

    # ---- Natural sort ----
    df = df.copy()
    df[unitid_col] = df[unitid_col].astype(str)
    df = df.loc[natsorted(df.index, key=lambda i: df.loc[i, unitid_col])]

    # ---- Series row ----
    series_row = df[df[level_col].str.strip().str.lower() == "series"].iloc[0]

    # ---- XML structure ----
    ead = etree.Element("ead")
    archdesc = etree.SubElement(ead, "archdesc", level="collection")
    dsc = etree.SubElement(archdesc, "dsc")

    series_elem = etree.SubElement(dsc, "c", level="series")
    did = etree.SubElement(series_elem, "did")

    etree.SubElement(did, "unitid").text = series_id
    etree.SubElement(did, "unittitle").text = series_title

    # Series-level unitdate
    series_date = str(series_row[unitdate_col]).strip()
    if series_date and series_date.lower() != "nan":
        etree.SubElement(
            did,
            "unitdate",
            datechar="creation",
            era="ce",
            calendar="gregorian"
        ).text = series_date

    # Series-level extent
    if extent_col:
        series_extent = str(series_row[extent_col]).strip()
        if series_extent and series_extent.lower() != "nan":
            physdesc = etree.SubElement(did, "physdesc")
            etree.SubElement(physdesc, "extent").text = series_extent

    # Series-level scopecontent
    if scope_col:
        paragraphs = clean_scope_text(series_row[scope_col])
        if paragraphs:
            scope_elem = etree.SubElement(series_elem, "scopecontent")
            for para in paragraphs:
                etree.SubElement(scope_elem, "p").text = para

    # ---- Items ----
    for _, row in df[df[level_col].str.strip().str.lower() != "series"].iterrows():
        item_c = etree.SubElement(series_elem, "c", level="item")
        item_did = etree.SubElement(item_c, "did")

        etree.SubElement(item_did, "unitid").text = str(row[unitid_col]).strip()
        etree.SubElement(item_did, "unittitle").text = str(row[unittitle_col]).strip()

        date = str(row[unitdate_col]).strip()
        if date and date.lower() != "nan":
            etree.SubElement(
                item_did,
                "unitdate",
                datechar="creation",
                era="ce",
                calendar="gregorian"
            ).text = date

        if extent_col:
            extent_val = str(row[extent_col]).strip()
            if extent_val and extent_val.lower() != "nan":
                physdesc = etree.SubElement(item_did, "physdesc")
                etree.SubElement(physdesc, "extent").text = extent_val

        if scope_col:
            paragraphs = clean_scope_text(row[scope_col])
            if paragraphs:
                scope_elem = etree.SubElement(item_c, "scopecontent")
                for para in paragraphs:
                    etree.SubElement(scope_elem, "p").text = para

    # ---- Save ----
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    etree.ElementTree(ead).write(
        output_path,
        pretty_print=True,
        encoding="utf-8",
        xml_declaration=True
    )

    print(f"✅ Flat EAD XML saved to: {output_path}")


# ✅ Final function call — change to match your file
generate_flat_ead(
    "GLP1.xlsx",
    "GLP/1",
    "Photographs of Lally, friends, family and pageants.",
    "output/GLP1_output.xml"
)
