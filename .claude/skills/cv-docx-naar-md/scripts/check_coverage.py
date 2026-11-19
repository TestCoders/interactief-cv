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
    "curriculum", "vitae", "personalia", "recente",
    "werkervaring", "behaalde", "diploma’s", "diploma's", "vakopleidingen",
    "certificering", "taalvaardigheid", "vakkennis", "competentie",
    "kennisniveau", "bedrijf", "omschrijving", "pakketten", "db",
    # variants seen in other layouts
    "over", "mij", "persoonlijke", "gegevens", "geboren", "opdrachten",
    "opdrachtgever", "klant", "rol", "beschrijving", "taken", "technieken",
    "onderwerp", "niveau", "kennis", "kunde", "opleiding", "opleidingen",
    "talen", "werkzaamheden", "beknopte", "samenvatting", "testsoorten",
}
# Extend LABELS when a new CV layout uses other field names: a label that
# shows up here as "missing" is noise, a content word is a real gap.
# Labels whose value is a place: that name is also removed from running text.
PLACE = re.compile(r"(?i)^\s*(geboorteplaats|woonplaats|adres|postcode)\b")
# Personal data is deliberately left out of the Markdown (see SKILL.md,
# "Persoonsgegevens"), so source lines with these labels are not checked.
PERSONAL = re.compile(
    r"(?i)^\s*(geboortedatum|geboren|geboorteplaats|leeftijd|woonplaats|adres|"
    r"postcode|telefoon|mobiel|e-?mail|nationaliteit|burgerlijke staat|rijbewijs)\b"
)


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


def personal_values(lines):
    """Values from personal-data lines, e.g. "Woonplaats | Harderwijk" -> "Harderwijk"."""
    values, place_words = [], set()
    for line in lines:
        content = re.sub(r"^(P\s+\S+\s+::|T\d+ R\d+:)", "", line)
        if PERSONAL.match(content) and "|" in content:
            value = content.split("|", 1)[1].strip()
            if value:
                values.append(value)
                if PLACE.match(content):
                    place_words |= {norm(w) for w in words(value)}
    return values, place_words


def main(extract_path, md_path):
    md_text = open(md_path, encoding="utf-8").read()
    md_words = {norm(w) for w in words(md_text)}
    lines = open(extract_path, encoding="utf-8").read().split("HEADER/FOOTER")[0].splitlines()
    values, place_words = personal_values(lines)
    leaks = [v for v in values if re.search(r"(?i)(?<!\w)" + re.escape(v) + r"(?!\w)", md_text)]
    for v in leaks:
        print(f"- persoonsgegeven staat nog in de Markdown: {v!r}")
    missing_lines = []
    in_summary = False  # the "Recente werkervaring" summary table is left out on purpose
    in_profile = False  # the profile text and keywords are left out on purpose
    after_keywords = False
    for line in lines:
        line = line.rstrip("\n")
        content = re.sub(r"^(P\s+\S+\s+::|T\d+ R\d+:)", "", line)
        if re.fullmatch(r"(?i)\s*(profiel|beknopte samenvatting|over mij)\s*", content):
            in_profile = True
            continue
        if in_profile:
            if re.fullmatch(r"(?i)\s*kernwoorden\s*", content):
                after_keywords = True
                continue
            ends = re.match(r"^T\d+ R\d+:", line) or re.fullmatch(
                r"(?i)\s*(recente werkervaring|opleidingen|werkervaring|vakkennis)\s*", content)
            if not ends:
                if after_keywords:  # the keyword line itself, then the profile is over
                    in_profile = after_keywords = False
                if "|" not in content:  # personalia lines (Naam | ...) are still checked
                    continue
            else:
                in_profile = after_keywords = False
        if re.fullmatch(r"(?i)\s*recente werkervaring\s*", content):
            in_summary = True
            continue
        if in_summary and re.match(r"^T\d+ R\d+:", line):
            continue
        in_summary = False
        if line.startswith("# HEADER/FOOTER"):
            break  # header/footer holds company details, not CV content
        if not line.strip():
            continue
        m = re.match(r"^P\s+(\S+)\s+::", line)
        if m and re.match(r"(?i)(kop|heading|titel|title|koptekst)", m.group(1)):
            continue  # section headings become the fixed Markdown headings
        content = re.sub(r"^(P\s+\S+\s+::|T\d+ R\d+:)", "", line)
        if PERSONAL.match(content):
            continue  # personal data is left out on purpose
        missing = sorted({norm(w) for w in words(content)} - md_words - LABELS - place_words - {""})
        if missing:
            missing_lines.append((line, missing))
    if not missing_lines:
        if leaks:
            return 1
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
