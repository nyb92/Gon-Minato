output = "rdf/housingdata_only.ttl"

with open("rdf/logements.ttl", "r", encoding="utf-8") as f:
    lines = f.readlines()

selected = []
capture = False

for line in lines:
    if line.strip().startswith(":HousingData_"):
        capture = True
        selected.append(line)
        continue

    if capture:
        selected.append(line)
        # fin du bloc quand une ligne vide apparaît
        if line.strip() == "":
            capture = False

# Ajout des liens Department -> HousingData
for line in lines:
    if ":hasHousingData" in line:
        selected.append(line)

with open(output, "w", encoding="utf-8") as f:
    f.write("""@prefix : <http://example.org/sport-hlm#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

""")
    f.writelines(selected)

print("✔ Fichier housingdata_only.ttl généré !")
