#!/usr/bin/env python3
"""Check that no information from the .docx went missing in the Markdown.

Compares the words in the extraction (output of extract_docx.py) with the
words in the generated Markdown. Prints every source line that has words
which do not occur anywhere in the Markdown, so you can see what was dropped.

Usage: python3 check_coverage.py <extract.txt> <cv.md>
Exit code 0 = everything covered, 1 = something is missing.
"""
import re
import sys

# Section titles and field labels from the TestCoders CV layout. They become
# Markdown headings/labels under a different name, so they are not content.
LABELS = {
    "curriculum", "vitae", "personalia", "geboortedatum", "recente",
    "werkervaring", "behaalde", "diploma’s", "diploma's", "vakopleidingen",
    "certificering", "taalvaardigheid", "vakkennis", "competentie",
    "kennisniveau", "bedrijf", "omschrijving", "pakketten", "db",
    # variants seen in other layouts
    "over", "mij", "persoonlijke", "gegevens", "geboren", "opdrachten",
    "opdrachtgever", "klant", "rol", "beschrijving", "taken", "technieken",
    "onderwerp", "niveau", "kennis", "kunde", "opleiding", "opleidingen",
    "talen", "werkzaamheden",
}
# Extend LABELS when a new CV layout uses other field names: a label that
# shows up here as "missing" is noise, a content word is a real gap.
# Dutch month names: the birth date is converted to YYYY-MM-DD.
MONTHS = {
    "januari", "februari", "maart", "april", "mei", "juni", "juli",
    "augustus", "september", "oktober", "november", "december",
}


def words(text):
    found = set()
    for w in re.findall(r"[\w#+.&®’'-]{2,}", text):
        w = w.lower()
        found.add(w)
        if re.fullmatch(r"[\d-]+", w):  # 1988-05-25 also counts as 1988, 05, 25
            found.update(p.lstrip("0") or "0" for p in w.split("-") if p)
            found.update(p for p in w.split("-") if p)
    return found


def norm(w):
    return w.strip(".,;:-’'")


def main(extract_path, md_path):
    md_words = {norm(w) for w in words(open(md_path, encoding="utf-8").read())}
    missing_lines = []
    for line in open(extract_path, encoding="utf-8"):
        line = line.rstrip("\n")
        if line.startswith("# HEADER/FOOTER"):
            break  # header/footer holds company details, not CV content
        if not line.strip():
            continue
        m = re.match(r"^P\s+(\S+)\s+::", line)
        if m and re.match(r"(?i)(kop|heading|titel|title|koptekst)", m.group(1)):
            continue  # section headings become the fixed Markdown headings
        content = re.sub(r"^(P\s+\S+\s+::|T\d+ R\d+:)", "", line)
        birth = re.search(r"(?i)geboortedatum|geboren", content)
        ignore = LABELS | (MONTHS if birth else set())
        missing = sorted({norm(w) for w in words(content)} - md_words - ignore - {""})
        if missing:
            missing_lines.append((line, missing))
    if not missing_lines:
        print("OK: alle woorden uit de docx komen voor in de Markdown.")
        return 0
    print(f"{len(missing_lines)} bronregel(s) met woorden die niet in de Markdown staan:\n")
    for line, missing in missing_lines:
        print(f"- ontbreekt {missing}\n    in: {line[:160]}")
    return 1


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("Usage: python3 check_coverage.py <extract.txt> <cv.md>")
    sys.exit(main(sys.argv[1], sys.argv[2]))
