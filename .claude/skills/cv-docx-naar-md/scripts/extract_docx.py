#!/usr/bin/env python3
"""Extract the text of a .docx in document order, keeping table structure.

Only uses the Python standard library (no python-docx needed).

Output (stdout), one line per item:
  P  <style> :: text                     a normal paragraph; tabs shown as ' | '
  T<depth> R<row>: cell1 || cell2 || ... a table row; cells separated by ' || '
                                          paragraphs inside a cell joined by ' / '
Text in headers/footers is printed at the end under '# HEADER/FOOTER'.

Usage: python3 extract_docx.py <file.docx>
"""
import sys
import zipfile
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def para_text(p):
    parts = []
    for el in p.iter():
        if el.tag == W + "t" and el.text:
            parts.append(el.text)
        elif el.tag == W + "tab":
            parts.append("\t")
        elif el.tag in (W + "br", W + "cr"):
            parts.append(" / ")
    text = "".join(parts)
    if not text.strip():
        return ""
    # Tabs separate columns (Word aligns label/value pairs with tabs): show them
    # as ' | ' so column boundaries survive; collapse other whitespace.
    cols = [" ".join(c.split()) for c in text.split("\t")]
    return " | ".join(c for c in cols if c)


def para_style(p):
    ppr = p.find(W + "pPr")
    if ppr is not None:
        st = ppr.find(W + "pStyle")
        if st is not None:
            return st.get(W + "val", "")
        if ppr.find(W + "numPr") is not None:
            return "list"
    return ""


def cell_text(tc, out, depth):
    """Return the text of a cell; nested tables are emitted separately."""
    texts = []
    for child in tc:
        if child.tag == W + "p":
            t = para_text(child)
            if t:
                texts.append(("- " if para_style(child) == "list" else "") + t)
        elif child.tag == W + "tbl":
            walk_table(child, out, depth + 1)
        elif child.tag == W + "sdt":
            content = child.find(W + "sdtContent")
            if content is not None:
                texts.append(cell_text(content, out, depth))
    return " / ".join(t for t in texts if t)


def walk_table(tbl, out, depth):
    for r, tr in enumerate(tbl.findall(W + "tr"), 1):
        nested = []
        cells = [cell_text(tc, nested, depth) for tc in tr.findall(W + "tc")]
        if any(cells):
            out.append(f"T{depth} R{r}: " + " || ".join(cells))
        out.extend(nested)


def walk_body(body, out):
    for child in body:
        if child.tag == W + "p":
            t = para_text(child)
            if t:
                out.append(f"P  {para_style(child) or '-'} :: {t}")
        elif child.tag == W + "tbl":
            walk_table(child, out, 1)
        elif child.tag == W + "sdt":
            content = child.find(W + "sdtContent")
            if content is not None:
                walk_body(content, out)


def main(path):
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("word/document.xml"))
        out = []
        walk_body(root.find(W + "body"), out)
        extra = []
        for name in sorted(z.namelist()):
            if name.startswith(("word/header", "word/footer")) and name.endswith(".xml"):
                hroot = ET.fromstring(z.read(name))
                for p in hroot.iter(W + "p"):
                    t = para_text(p)
                    if t:
                        extra.append(t)
    print("\n".join(out))
    if extra:
        print("\n# HEADER/FOOTER")
        print("\n".join(dict.fromkeys(extra)))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: python3 extract_docx.py <file.docx>")
    main(sys.argv[1])
