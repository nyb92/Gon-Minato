import pandas as pd
from util import clean_uri

INPUT = "data/logements.csv"
OUTPUT = "rdf/logements.ttl"

REQUIRED_COLUMNS = [
    "code_region", "nom_region",
    "code_departement", "nom_departement",
    "année_publication",
    "Taux de logements sociaux* (en %)"
]

# Charger fichier CSV
df = pd.read_csv(INPUT, sep=";")
missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
if missing:
    raise ValueError(f"Colonnes manquantes dans {INPUT} : {missing}")

# 🔥 GARDER UNIQUEMENT 2024
df = df[df["année_publication"] == 2021]

ttl = []
print("✔ Génération du fichier logements.ttl filtré sur 2024...")

for _, row in df.iterrows():

    reg_code = str(row["code_region"]).strip()
    reg_name = row["nom_region"]

    dep_code = str(row["code_departement"]).strip()
    dep_name = row["nom_departement"]

    year = str(row["année_publication"]).strip()

    taux_hlm = str(row["Taux de logements sociaux* (en %)"]).replace(",", ".").strip()

    reg_code_u = clean_uri(reg_code)
    dep_code_u = clean_uri(dep_code)

    # Région
    ttl.append(f"""
:Region_{reg_code_u} a :Region ;
    rdfs:label "{reg_name}"@fr .
""")

    # Département
    ttl.append(f"""
:Department_{dep_code_u} a :Department ;
    rdfs:label "{dep_code} - {dep_name}"@fr ;
    :locatedInRegion :Region_{reg_code_u} ;
    :inseeCode "{dep_code}" .
""")

    # HousingData (2024 uniquement)
    ttl.append(f"""
:HousingData_{dep_code_u}_{year} a :HousingData ;
    :year "{year}"^^xsd:gYear ;
    :proportionHLM "{taux_hlm}"^^xsd:decimal .

:Department_{dep_code_u} :hasHousingData :HousingData_{dep_code_u}_{year} .
""")

# Écriture fichier
with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write("""@prefix : <http://example.org/sport-hlm#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

""")
    f.writelines(ttl)

print("✔ Fichier logement.ttl généré avec succès (année 2024 uniquement).")
