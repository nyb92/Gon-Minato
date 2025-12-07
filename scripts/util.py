import unicodedata
import re

def clean_uri(value: str) -> str:
    """
    Nettoie une chaîne pour en faire une URI propre :
    - retire accents
    - remplace espaces par '_'
    - retire caractère non alphanumérique
    """
    if not isinstance(value, str):
        value = str(value)

    # Normalisation unicode → suppression accents
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode()

    # Remplacement espaces
    value = value.replace(" ", "_")

    # Garde seulement alphanumériques + underscore
    value = re.sub(r"[^A-Za-z0-9_]", "", value)

    return value
