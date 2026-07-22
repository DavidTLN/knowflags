# ═══════════════════════════════════════════════════════════════
#  KnowFlags — quels fichiers de symboles manquent ?
#  À lancer depuis la racine du projet
# ═══════════════════════════════════════════════════════════════

$dossier = "public\flags\symbols"

# ── Fichiers attendus : nom => pays ───────────────────────────────────────────
$attendus = [ordered]@{
  'union-jack'            = 'PARTAGÉ — Australie, Fidji, N.-Zélande, R.-Uni, Tuvalu'
  'nordic-cross'          = 'PARTAGÉ — Danemark, Suède, Norvège, Finlande, Islande, Féroé, Åland'
  'af-shahada'            = 'Afghanistan'
  'al-eagle'              = 'Albanie'
  'dz-crescent-star'      = 'Algérie'
  'ad-coat-of-arms'       = 'Andorre'
  'ao-machete'            = 'Angola'
  'ao-gear'               = 'Angola'
  'sa-shahada'            = 'Arabie saoudite'
  'ar-sun-of-may'         = 'Argentine'
  'au-commonwealth-star'  = 'Australie'
  'au-southern-cross'     = 'Australie'
  'az-crescent-star'      = 'Azerbaïdjan'
  'bz-coat-of-arms'       = 'Belize'
  'bt-druk'               = 'Bhoutan'
  'by-ornament'           = 'Biélorussie'
  'bo-coat-of-arms'       = 'Bolivie'
  'br-globe'              = 'Brésil'
  'bn-emblem'             = 'Brunei'
  'kh-angkor-wat'         = 'Cambodge'
  'ca-maple-leaf'         = 'Canada'
  'cv-stars'              = 'Cap-Vert'
  'cn-stars'              = 'Chine'
  'cy-map'                = 'Chypre'
  'km-crescent-stars'     = 'Comores'
  'kr-taegeuk'            = 'Corée du Sud'
  'kr-geon'               = 'Corée du Sud'
  'kr-ri'                 = 'Corée du Sud'
  'kr-gam'                = 'Corée du Sud'
  'kr-gon'                = 'Corée du Sud'
  'cr-coat-of-arms'       = 'Costa Rica'
  'hr-coat-of-arms'       = 'Croatie'
  'dm-parrot'             = 'Dominique'
  'dm-stars'              = 'Dominique'
  'eg-eagle'              = 'Égypte'
  'ec-coat-of-arms'       = 'Équateur'
  'er-wreath'             = 'Érythrée'
  'es-coat-of-arms'       = 'Espagne'
  'sz-shield'             = 'Eswatini'
  'et-emblem'             = 'Éthiopie'
  'fj-shield'             = 'Fidji'
  'ge-crosses'            = 'Géorgie'
  'gd-nutmeg'             = 'Grenade'
  'gl-disc'               = 'Groenland'
  'gt-coat-of-arms'       = 'Guatemala'
  'gq-coat-of-arms'       = 'Guinée équatoriale'
  'ht-coat-of-arms'       = 'Haïti'
  'mh-star'               = 'Îles Marshall'
  'in-chakra'             = 'Inde'
  'iq-takbir'             = 'Irak'
  'ir-emblem'             = 'Iran'
  'ir-takbir'             = 'Iran'
  'gb-nir-red-hand'       = 'Irlande du Nord'
  'il-star-of-david'      = 'Israël'
  'kz-sun-eagle'          = 'Kazakhstan'
  'kz-ornament'           = 'Kazakhstan'
  'ke-emblem'             = 'Kenya'
  'kg-sun-tunduk'         = 'Kirghizistan'
  'ki-frigatebird'        = 'Kiribati'
  'xk-map'                = 'Kosovo'
  'ls-mokorotlo'          = 'Lesotho'
  'lb-tree'               = 'Liban'
  'ly-crescent-star'      = 'Libye'
  'li-crown'              = 'Liechtenstein'
  'mk-sun'                = 'Macédoine du Nord'
  'my-crescent-star'      = 'Malaisie'
  'mw-sun'                = 'Malawi'
  'mv-crescent'           = 'Maldives'
  'mt-george-cross'       = 'Malte'
  'ma-pentagram'          = 'Maroc'
  'mr-crescent-star'      = 'Mauritanie'
  'mx-coat-of-arms'       = 'Mexique'
  'fm-stars'              = 'Micronésie'
  'md-coat-of-arms'       = 'Moldavie'
  'mn-soyombo'            = 'Mongolie'
  'me-coat-of-arms'       = 'Monténégro'
  'mz-emblem'             = 'Mozambique'
  'na-sun'                = 'Namibie'
  'nr-star'               = 'Nauru'
  'np-moon'               = 'Népal'
  'np-sun'                = 'Népal'
  'ni-coat-of-arms'       = 'Nicaragua'
  'nz-southern-cross'     = 'Nouvelle-Zélande'
  'om-khanjar'            = 'Oman'
  'ug-crane'              = 'Ouganda'
  'pk-crescent-star'      = 'Pakistan'
  'pg-bird-of-paradise'   = 'Papouasie-Nouvelle-Guinée'
  'pg-southern-cross'     = 'Papouasie-Nouvelle-Guinée'
  'py-coat-of-arms'       = 'Paraguay'
  'gb-wls-dragon'         = 'Pays de Galles'
  'pe-coat-of-arms'       = 'Pérou'
  'ph-sun'                = 'Philippines'
  'pt-armillary'          = 'Portugal'
  'pt-coat-of-arms'       = 'Portugal'
  'do-coat-of-arms'       = 'République dominicaine'
  'rw-sun'                = 'Rwanda'
  'sm-coat-of-arms'       = 'Saint-Marin'
  'vc-diamonds'           = 'Saint-Vincent-et-les-Grenadines'
  'sv-coat-of-arms'       = 'Salvador'
  'ws-southern-cross'     = 'Samoa'
  'rs-coat-of-arms'       = 'Serbie'
  'sg-crescent-stars'     = 'Singapour'
  'sk-coat-of-arms'       = 'Slovaquie'
  'si-coat-of-arms'       = 'Slovénie'
  'lk-lion'               = 'Sri Lanka'
  'tj-crown-stars'        = 'Tadjikistan'
  'tw-white-sun'          = 'Taïwan'
  'tn-crescent-star'      = 'Tunisie'
  'tm-guls'               = 'Turkménistan'
  'tm-crescent-stars'     = 'Turkménistan'
  'tr-crescent-star'      = 'Turquie'
  'uy-sun-of-may'         = 'Uruguay'
  'vu-emblem'             = 'Vanuatu'
  'va-emblem'             = 'Vatican'
  'zm-eagle'              = 'Zambie'
  'zw-bird'               = 'Zimbabwe'
}

# ── Facultatifs ───────────────────────────────────────────────────────────────
$facultatifs = [ordered]@{
  'ao-star'    = 'Angola'
  'ag-sun'     = 'Antigua-et-Barbuda'
  'sa-sword'   = 'Arabie saoudite'
  'bb-trident' = 'Barbade'
  'bz-tree'    = 'Belize'
  'bz-wreath'  = 'Belize'
  'br-diamond' = 'Brésil'
  'br-script'  = 'Brésil'
  'bi-cross'   = 'Burundi'
  'bi-star'    = 'Burundi'
  'cy-olive'   = 'Chypre'
}

# ── Lecture du dossier ────────────────────────────────────────────────────────
if (-not (Test-Path $dossier)) {
  "Dossier introuvable : $dossier"
  "Lance le script depuis la racine du projet."
  return
}

$presents = Get-ChildItem -Path $dossier -Include *.svg,*.png -File -Recurse |
            ForEach-Object { $_.BaseName } | Sort-Object -Unique

"`n=== PRÉSENTS ({0}) ===" -f $presents.Count

$manquants = @()
foreach ($k in $attendus.Keys) {
  if ($presents -contains $k) { "  OK    {0,-24} {1}" -f $k, $attendus[$k] }
  else { $manquants += $k }
}

"`n=== MANQUANTS ({0}/{1}) ===" -f $manquants.Count, $attendus.Count
foreach ($k in $manquants) { "  ---   {0,-24} {1}" -f $k, $attendus[$k] }

$manqFac = $facultatifs.Keys | Where-Object { $presents -notcontains $_ }
"`n=== FACULTATIFS MANQUANTS ({0}/{1}) ===" -f $manqFac.Count, $facultatifs.Count
foreach ($k in $manqFac) { "  ...   {0,-24} {1}" -f $k, $facultatifs[$k] }

# ── Fichiers présents mais inattendus (mauvais nom ?) ─────────────────────────
$inconnus = $presents | Where-Object { $attendus.Keys -notcontains $_ -and $facultatifs.Keys -notcontains $_ }
if ($inconnus) {
  "`n=== NOMS INATTENDUS ({0}) — à renommer ? ===" -f $inconnus.Count
  $inconnus | ForEach-Object { "  ?     $_" }
}

"`n=========================================="
"  {0} présents · {1} manquants sur {2} requis" -f ($attendus.Count - $manquants.Count), $manquants.Count, $attendus.Count
"=========================================="

# Export de la liste des manquants
$manquants | ForEach-Object { "{0}.svg`t{1}" -f $_, $attendus[$_] } |
  Out-File -Encoding utf8 "symboles-manquants.txt"
"`nListe écrite dans symboles-manquants.txt"
