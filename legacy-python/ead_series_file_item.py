import pandas as pd
from lxml import etree
import os
import re
from collections import defaultdict

def clean_scope_text(text):
    """Split scopecontent into paragraphs where spacing exists."""
    if pd.isna(text):
        return []
    paragraphs = re.split(r"\n\s*\n|\r\n\s*\r\n", str(text).strip())
    return [p.strip() for p in paragraphs if p.strip()]

def generate_ead_with_items(excel_path, series_id, series_title, output_path):
    df = pd.read_excel(excel_path)

    level_col = [c for c in df.columns if "<c level" in c][0]
    unitid_col = [c for c in df.columns if "<unitid" in c][0]
    unittitle_col = [c for c in df.columns if "<unittitle" in c][0]
    unitdate_col = [c for c in df.columns if "<unitdate" in c][0]
    extent_col = [c for c in df.columns if "<extent" in c][0]
    scope_col = [c for c in df.columns if "<scopecontent" in c][0]

    df[level_col] = df[level_col].astype(str).str.strip().str.lower()
    series_row = df[df[level_col] == "series"].iloc[0] if not df[df[level_col] == "series"].empty else None
    files = df[df[level_col] == "file"]
    items = df[df[level_col] == "item"]

    item_map = defaultdict(list)
    for _, row in items.iterrows():
        uid = str(row[unitid_col])
        parent_uid = "/".join(uid.split("/")[:-1])
        item_map[parent_uid].append(row)

    ead = etree.Element("ead")
    archdesc = etree.SubElement(ead, "archdesc", level="collection")
    dsc = etree.SubElement(archdesc, "dsc")

    series_c = etree.SubElement(dsc, "c", level="series")
    did = etree.SubElement(series_c, "did")
    etree.SubElement(did, "unitid").text = series_id
    etree.SubElement(did, "unittitle").text = series_title

    if series_row is not None:
        series_date = str(series_row[unitdate_col]).strip()
        if series_date:
            etree.SubElement(did, "unitdate", datechar="creation", era="ce", calendar="gregorian").text = series_date

        series_extent = str(series_row[extent_col]).strip()
        if series_extent:
            physdesc = etree.SubElement(did, "physdesc")
            etree.SubElement(physdesc, "extent").text = series_extent

        paragraphs = clean_scope_text(series_row[scope_col])
        if paragraphs:
            scopecontent = etree.SubElement(series_c, "scopecontent")
            for para in paragraphs:
                etree.SubElement(scopecontent, "p").text = para

    for _, f in files.iterrows():
        file_c = etree.SubElement(series_c, "c", level="file")
        did = etree.SubElement(file_c, "did")

        etree.SubElement(did, "unitid").text = str(f[unitid_col]).strip()
        etree.SubElement(did, "unittitle").text = str(f[unittitle_col]).strip()
        date = str(f[unitdate_col]).strip()
        if date:
            etree.SubElement(did, "unitdate", datechar="creation", era="ce", calendar="gregorian").text = date

        extent = str(f[extent_col]).strip()
        if extent:
            physdesc = etree.SubElement(did, "physdesc")
            etree.SubElement(physdesc, "extent").text = extent

        paragraphs = clean_scope_text(f[scope_col])
        if paragraphs:
            scopecontent = etree.SubElement(file_c, "scopecontent")
            for para in paragraphs:
                etree.SubElement(scopecontent, "p").text = para

        for item in item_map.get(str(f[unitid_col]).strip(), []):
            item_c = etree.SubElement(file_c, "c", level="item")
            item_did = etree.SubElement(item_c, "did")
            etree.SubElement(item_did, "unitid").text = str(item[unitid_col]).strip()
            etree.SubElement(item_did, "unittitle").text = str(item[unittitle_col]).strip()
            date = str(item[unitdate_col]).strip()
            if date:
                etree.SubElement(item_did, "unitdate", datechar="creation", era="ce", calendar="gregorian").text = date

            extent = str(item[extent_col]).strip()
            if extent:
                physdesc = etree.SubElement(item_did, "physdesc")
                etree.SubElement(physdesc, "extent").text = extent

            paragraphs = clean_scope_text(item[scope_col])
            if paragraphs:
                scopecontent = etree.SubElement(item_c, "scopecontent")
                for para in paragraphs:
                    etree.SubElement(scopecontent, "p").text = para

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    etree.ElementTree(ead).write(output_path, pretty_print=True, encoding="utf-8", xml_declaration=True)
    print(f"✅ XML successfully saved to: {output_path}")

generate_ead_with_items("PLP 2.xlsx", "PLP 2", "Allan-Arthur", "output/PLP_2_output.xml")
