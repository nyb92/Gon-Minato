import pandas as pd
import glob
import re
from util import clean_uri

OUTPUT = "rdf/sport.ttl"

print("✔ Génération du fichier sport.ttl...\n")

POSSIBLE_LICENCE_COLS = {
    "Licences_annuelles",
    "Licences__annuelles",
    "Licences_annuelles",
    "Licences annuelles",
}

INVALID_VALUES = {"-", "", " ", "nan", "NaN", "None", None}

def clean_int(value):
    if isinstance(value, str):
        v = value.replace(",", ".").strip()
        if v in INVALID_VALUES:
            return 0
        try:
            return int(float(v))
        except:
            return 0
    try:
        return int(float(value))
    except:
        return 0

def clean_age(value):
    if value is None:
        return 0
    if isinstance(value, str):
        v = value.strip()
        if not v.replace(".", "", 1).isdigit():
            return 0
        try:
            return int(float(v))
        except:
            return 0
    try:
        return int(float(value))
    except:
        return 0

def extract_dep_code(dep_label):
    """
    Extrait automatiquement le code département (01, 75, 2A, 2B, 971...)
    depuis une chaîne de type :
      - "01 - Ain"
      - "Ain"
      - "Ain (01)"
      - "Ain - 01"
    """
    # cherche un code département : 2A, 2B, 01, 75, 971...
    match = re.search(r"\b([0-9]{2,3}|2A|2B)\b", dep_label)
    if match:
        return match.group(1)
    return clean_uri(dep_label)  # fallback si pas trouvé


ttl = []
files = sorted(glob.glob("data/sport_*.csv"))

if not files:
    raise ValueError("Aucun fichier sport_XXXX.csv trouvé dans /data")

# --------------------------------------------------------------------------
# Traitement
# --------------------------------------------------------------------------
for file in files:
    print(f" → Traitement : {file}")

    df = pd.read_csv(file, sep=";", low_memory=False)

    df.columns = [col.replace(" ", "_").replace("\u00A0", "_") for col in df.columns]

    licence_col = None
    for col in df.columns:
        if col.replace("\u00A0", "_") in POSSIBLE_LICENCE_COLS:
            licence_col = col
            break

    if licence_col is None:
        raise ValueError(f"❌ Colonne licences introuvable dans {file}\nColonnes = {df.columns}")

    for row in df.itertuples(index=False):
        row_dict = row._asdict()

        year  = str(row_dict["Année"])
        sexe  = str(row_dict["Sexe"]).strip()
        age   = clean_age(row_dict["Age"])
        region_label = row_dict["Région"]
        dep_label    = row_dict["Département"]
        sport_label  = row_dict["Fédération"]
        licences     = clean_int(row_dict[licence_col])

        # EXTRACTION propre du code département
        dep_code = extract_dep_code(dep_label)
        dep_code_u = clean_uri(dep_code)

        region_u = clean_uri(region_label)
        sport_u  = clean_uri(sport_label)
        sexe_u   = clean_uri(sexe)
        age_u    = clean_uri(age)

        # Région
        ttl.append(f"""
:Region_{region_u} a :Region ;
    rdfs:label "{region_label}"@fr .
""")

        # Département (ALIGNÉ AVEC LOGEMENTS)
        ttl.append(f"""
:Department_{dep_code_u} a :Department ;
    rdfs:label "{dep_code} - {dep_label}"@fr ;
    :locatedInRegion :Region_{region_u} .
""")

        # Population Group
        ttl.append(f"""
:PopGroup_{dep_code_u}_{age_u}_{sexe_u} a :PopulationGroup ;
    :age {age} ;
    :sex "{sexe}" ;
    :locatedInDepartment :Department_{dep_code_u} .
""")

        # Sport
        ttl.append(f"""
:Sport_{sport_u} a :Sport ;
    rdfs:label "{sport_label}"@fr .
""")

        # Participation
        ttl.append(f"""
:SportPart_{dep_code_u}_{age_u}_{sexe_u}_{sport_u}_{year} a :SportParticipation ;
    :year "{year}"^^xsd:gYear ;
    :numLicences {licences} ;
    :hasSport :Sport_{sport_u} ;
    :hasPopulationGroup :PopGroup_{dep_code_u}_{age_u}_{sexe_u} .
""")

# --------------------------------------------------------------------------
# Écriture finale
# --------------------------------------------------------------------------
with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write("""@prefix : <http://example.org/sport-hlm#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

""")
    f.writelines(ttl)

print("\n✔ sport.ttl généré avec succès (URIs propres et alignées).")
