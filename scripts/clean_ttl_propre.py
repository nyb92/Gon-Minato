def clean_ttl_by_triples(input_file, output_file):
    triples = set()
    triple_buffer = []

    def push_triple():
        triple = "".join(triple_buffer).strip()
        if triple:
            triples.add(triple + "\n")
        triple_buffer.clear()

    with open(input_file, "r", encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()
            if stripped == "":
                continue

            triple_buffer.append(line)

            # Un triple Turtle se termine par un "."
            if stripped.endswith("."):
                push_triple()

    # Si le fichier ne terminait pas par ".", on flush
    if triple_buffer:
        push_triple()

    with open(output_file, "w", encoding="utf-8") as f:
        for t in triples:
            f.write(t)

    print(f"✔ Nettoyage terminé : {output_file}")
    print(f"  → Triples uniques : {len(triples)}")

# --- UTILISATION ---
clean_ttl_by_triples("rdf/logements.ttl", "rdf/logements_clean.ttl")
clean_ttl_by_triples("rdf/sport.ttl", "rdf/sport_clean.ttl")
