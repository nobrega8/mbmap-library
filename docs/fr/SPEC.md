# `.mbmap` — format Modbus Map, version 2

Un fichier `.mbmap.json` décrit la carte de registres Modbus d’un modèle de périphérique : qui le fabrique, comment dialoguer avec lui et ce que signifie chaque registre. C’est un document JSON : n’importe quel langage peut donc le lire avec son analyseur JSON standard, et un [JSON Schema](schema/mbmap-2.schema.json) en décrit la structure.

Les mots-clés **MUST**, **SHOULD** et **MAY** sont employés comme dans la [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) : **MUST** signifie obligatoire, **SHOULD** recommandé (avec des exceptions justifiées) et **MAY** facultatif. Cette traduction conserve ces mots en anglais pour faciliter la comparaison avec l’original.

## 1. Exemple

```json
{
  "$schema": "https://raw.githubusercontent.com/nobrega8/mbmap-library/main/schema/mbmap-2.schema.json",
  "mbmap": 2,
  "vendor": "Example Corp",
  "model": "EM-100",
  "description": "Single-phase energy meter",
  "protocol": "rtu",
  "unit_id": 1,
  "baudrate": 9600,
  "parity": "E",
  "stopbits": 1,
  "byte_order": "big",
  "word_order": "big",
  "address_base": 0,
  "enums": {
    "relay": {"0": "Open", "1": "Closed"}
  },
  "registers": [
    {"name": "Voltage", "group": "Measurements", "area": "input", "address": 0, "type": "float32", "unit": "V", "description": "RMS voltage"},
    {"name": "Current", "group": "Measurements", "area": "input", "address": 6, "type": "float32", "unit": "A", "description": "RMS current"},
    {"name": "Active energy", "group": "Energy", "area": "holding", "address": 256, "type": "uint32", "scale": 0.01, "unit": "kWh", "word_order": "little"},
    {"name": "Relay state", "group": "Status", "area": "holding", "address": 512, "type": "bool", "bit": 3, "enum": "relay", "description": "Bit 3 of the status word"},
    {"name": "Reset energy", "group": "Commands", "area": "coil", "address": 0, "type": "bool", "access": "W", "description": "Write 1 to reset counters"},
    {"name": "Serial number", "group": "Info", "area": "holding", "address": 1024, "type": "string", "length": 8, "description": "16 ASCII characters"}
  ]
}
```

Un exemple complet se trouve dans [examples/example-corp/em-100.mbmap.json](examples/example-corp/em-100.mbmap.json).

## 2. Fichier

- Une carte est un objet JSON ([RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)), encodé en UTF-8. Les lecteurs **MUST** accepter et ignorer un BOM initial. Les rédacteurs **SHOULD NOT** en écrire un.
- Le nom du fichier se termine par `.mbmap.json`.
- Un objet **MUST NOT** répéter une clé. Les analyseurs JSON traitent les clés en double de façons différentes ; un fichier qui en contient une est donc invalide.
- Les chaînes sont utilisées telles qu’écrites : pas de suppression des espaces, et les valeurs énumérées respectent la casse (`"holding"`, pas `"Holding"`).
- Le `null` de JSON n’est une valeur valide pour aucune clé ; omettez plutôt la clé.
- JSON n’a pas de commentaires. Les notes sur l’ensemble du fichier vont dans `notes`, une note sur un registre dans son `comment`. Les deux sont du texte libre que les outils **MAY** afficher et **MUST NOT** interpréter.
- Les rédacteurs **SHOULD** suivre la mise en page de la section 1 : indentation de deux espaces et une ligne par registre et par table de `enums`/`sentinels`, afin que la modification d’un registre soit une différence d’une seule ligne.
- `$schema` est facultatif et oriente les éditeurs vers le JSON Schema. Les lecteurs **MUST** l’ignorer.

### 2.1 Entiers

Là où une valeur est un **entier**, elle **MAY** s’écrire comme un entier JSON (`1040`) ou comme une chaîne contenant un entier décimal ou hexadécimal `0x` (`"0x0410"`). Les chaînes conservent la graphie hexadécimale qu’utilisent les manuels pour les adresses et les identifiants, et transportent des valeurs 64 bits que tous les analyseurs JSON ne lisent pas exactement comme des nombres (au-delà de 2^53). Les clés des tables `enums` et `sentinels` sont toujours des chaînes, sous les deux mêmes formes.

### 2.2 Tables

Une **table** associe des valeurs brutes à des libellés : un objet dont les clés sont des entiers écrits sous forme de chaînes (2.1) et dont les valeurs sont des libellés non vides, par exemple `{"0": "Stopped", "1": "Idle", "0xFFFF": "Unimplemented"}`. Une table a au moins une entrée, et deux clés **MUST NOT** représenter la même valeur (`"1"` et `"0x1"`).

## 3. Clés de premier niveau

`mbmap`, `vendor`, `model` et `registers` sont obligatoires. Toutes les autres clés sont facultatives ; quand elles manquent, la valeur par défaut s’applique.

| Clé | Type JSON | Par défaut | Signification |
|---|---|---|---|
| `mbmap` | entier `2` | | Version du format (3.1, section 8) |
| `vendor` | chaîne non vide | | Fabricant |
| `model` | chaîne non vide | | Modèle ou famille de modèles, tel qu’affiché aux personnes |
| `models` | tableau de chaînes non vides | `[model]` | Tous les noms ou codes de modèle auxquels la carte s’applique (3.2) |
| `vendor_website` | chaîne : un domaine ou une URL `http(s)://` | | Site web du fabricant, par ex. `se.com` ou `https://www.se.com` |
| `description` | chaîne | | Courte description |
| `revision` | entier ≥ 1 | | Révision du contenu de cette carte (3.1) |
| `revised` | chaîne `YYYY-MM-DD` | | Date de cette révision |
| `firmware` | chaîne | | Texte libre sur le firmware auquel la carte s’applique |
| `firmware_min` | chaîne de version (3.2) | | Le firmware le plus ancien auquel la carte s’applique |
| `firmware_max` | chaîne de version (3.2) | | Le firmware le plus récent auquel la carte s’applique |
| `source` | chaîne | | Résumé en texte libre de la provenance de la carte |
| `sources` | tableau d’objets source | | Documents à partir desquels la carte a été construite ou vérifiée (3.3) |
| `notes` | tableau de chaînes | | Notes libres sur le fichier |
| `protocol` | `"tcp"`, `"rtu"`, `"tcp+rtu"` | `"tcp+rtu"` | Transports pris en charge par le périphérique |
| `unit_id` | entier `0`–`255` | `1` | ID d’unité / d’esclave par défaut |
| `port` | entier `1`–`65535` | `502` | Port TCP par défaut |
| `baudrate` | entier | `9600` | Débit RTU par défaut |
| `parity` | `"N"`, `"E"`, `"O"` | `"E"` | Parité RTU par défaut |
| `databits` | `7`, `8` | `8` | Bits de données RTU par défaut |
| `stopbits` | `1`, `2` | `1` | Bits d’arrêt RTU par défaut |
| `byte_order` | `"big"`, `"little"` | `"big"` | Ordre des octets par défaut dans chaque registre (section 6) |
| `word_order` | `"big"`, `"little"` | `"big"` | Ordre par défaut des registres d’une valeur multi-registres (section 6) |
| `address_base` | `0`, `1` | `0` | Si `address` est compté à partir de 0 ou de 1 (section 5) |
| `max_read_registers` | entier `1`–`125` | `125` | Le plus grand bloc que le périphérique accepte par lecture (FC03/04) |
| `max_read_bits` | entier `1`–`2000` | `2000` | Le plus grand bloc que le périphérique accepte par lecture (FC01/02) |
| `enums` | objet : nom → table | | Tables de traduction nommées (4.1). Les noms utilisent `a`–`z`, `0`–`9` et `_` |
| `sentinels` | objet : type → table | | Valeurs brutes réservées par type entier (4.2) |
| `identify` | objet | | Comment lire l’identité du périphérique avec Report Slave ID (FC17) ou Read Device Identification (FC43) (4.8) |
| `function_reads` | tableau d’objets de lecture | | Lectures faites avec un code de fonction en dehors des quatre zones de données (4.11) |
| `registers` | tableau d’objets registre | | Les registres (section 4) |

Les valeurs de connexion sont des **valeurs par défaut** : l’utilisateur peut toujours les modifier à la connexion.

### 3.1 Version du format et révision de la carte

Deux nombres décrivent une carte, et ils changent pour des raisons différentes :

- **`mbmap`, la version du format**, indique quelle version de cette spécification le fichier suit, afin qu’un lecteur sache s’il peut le lire (section 8). Elle est identique pour toutes les cartes écrites selon cette spécification et ne change que lorsque le format change.
- **`revision`, la révision de la carte**, indique quelle édition du contenu de cette carte est le fichier. Elle commence à `1` et **SHOULD** augmenter d’une unité à chaque modification publiée qui affecte la façon dont un périphérique est lu ou écrit : un registre, une valeur de connexion par défaut, une table, une plage de firmware ou un modèle. Elle **MAY** rester la même pour les modifications de texte libre seulement (`description`, `notes`, `comment`, `source`). `revised` donne la date de cette modification.

Un outil qui possède deux copies de la même carte (mêmes `vendor` et `model`) **SHOULD** traiter celle dont la `revision` est la plus haute comme la plus récente, et **MAY** proposer la plus récente à l’utilisateur. Une carte sans `revision` ne peut pas être comparée ainsi. La révision n’est pas la version de firmware du périphérique : le firmware relève de la section 3.2.

### 3.2 Modèles et firmware

Une carte s’applique aux modèles de `models`, ou à `model` seul quand `models` manque. `model` est le nom affiché aux personnes : un périphérique, ou le nom de la famille ou de la série quand la carte en couvre plusieurs (`"PM5100 and PM5300 series"`), et non une liste de périphériques. `models` liste chaque nom ou code qu’un périphérique peut signaler, afin qu’un outil puisse le comparer au périphérique connecté (section 9) :

```json
"model": "PM5100 and PM5300 series",
"models": ["PM5110", "PM5111", "PM5310", "PM5320", "PM5330"]
```

`firmware_min` et `firmware_max` indiquent à quelles versions de firmware la carte s’applique. Les deux sont facultatifs : sans eux, la carte s’applique à tous les firmwares, ce qui est aussi le bon choix quand la version est inconnue. `firmware` reste disponible pour tout ce qu’une plage ne peut pas dire (« 2.x, sauf la 2.3 bêta »).

Une **chaîne de version** est un ou plusieurs nombres entiers séparés par des points : `"2"`, `"2.1"`, `"1.02.7"`. Les composantes se comparent comme des nombres, de gauche à droite (`"1.10"` est plus récente que `"1.9"`, et `"1.02"` équivaut à `"1.2"`) ; écrivez donc les versions telles que le périphérique les signale. Une borne couvre toutes les versions qui commencent par elle :

- `firmware_min` `"2.1"` inclut `2.1`, `2.1.4` et `3.0`, mais pas `2.0.9` ;
- `firmware_max` `"2"` inclut toutes les `2.x` et `2.x.y`, mais pas `3.0` ; `firmware_max` `"2.3"` inclut `2.3.7` mais pas `2.4`.

Ainsi `"firmware_min": "1", "firmware_max": "2"` se lit « firmware 1.x et 2.x ». `firmware_min` **MUST NOT** être postérieur à `firmware_max`.

**Registres qui dépendent du firmware.** Un registre peut porter ses propres `firmware_min` et `firmware_max`, avec le même sens, quand il n’existe que dans certaines versions de firmware. Cela permet de garder un seul fichier pour des révisions de firmware qui ne diffèrent que par quelques registres. Un registre sans eux s’applique partout où la carte s’applique. Deux registres **MAY** partager un `name` (et une adresse) quand leurs plages de firmware ne se chevauchent pas : l’outil utilise celui qui correspond au périphérique.

Exemple : le firmware 2.1 a déplacé le compteur d’énergie et ajouté un registre de facteur de puissance :

```json
"firmware_min": "1",
"firmware_max": "2",
"registers": [
  {"name": "Firmware version", "area": "holding", "address": 0, "type": "string", "length": 4, "role": "firmware"},
  {"name": "Voltage", "area": "input", "address": 10, "type": "float32", "unit": "V"},
  {"name": "Active energy", "area": "input", "address": 20, "type": "uint32", "unit": "Wh", "firmware_max": "2.0"},
  {"name": "Active energy", "area": "input", "address": 40, "type": "uint64", "unit": "Wh", "firmware_min": "2.1"},
  {"name": "Power factor", "area": "input", "address": 30, "type": "int16", "scale": 0.001, "firmware_min": "2.1"}
]
```

Quand les différences sont importantes (la plupart des adresses changent, ou les paramètres de connexion), des fichiers séparés sont plus clairs : une carte par plage de firmware, chacune avec ses propres `firmware_min` et `firmware_max`.

### 3.3 Sources

`sources` consigne les documents à partir desquels une carte a été construite ou avec lesquels elle a été vérifiée, afin qu’un lecteur puisse les retrouver et savoir quelle édition a été utilisée. Chaque élément est un objet :

| Clé | Type JSON | Signification |
|---|---|---|
| `title` | chaîne non vide, obligatoire | Titre du document, par ex. `"EM530/EM540 Modbus communication protocol"` |
| `version` | chaîne | Édition ou révision du document, telle qu’imprimée dessus |
| `date` | chaîne `YYYY`, `YYYY-MM` ou `YYYY-MM-DD` | Date de publication de cette édition |
| `url` | URL `http(s)://` | Où trouver le document |
| `note` | chaîne | Quelle partie a été utilisée, ou comment la carte a été vérifiée (par ex. `"tables 4.1-4.24"`, `"tested on a device with firmware 2.1"`) |
| `accessed` | chaîne `YYYY-MM-DD` | Quand le document a été téléchargé ou lu, puisqu’un document à la même URL peut changer sans nouvelle version |
| `sha256` | chaîne de 64 chiffres hexadécimaux | SHA-256 du fichier utilisé, afin qu’un lecteur puisse savoir si le document à `url` est toujours le même |

```json
"sources": [
  {"title": "EM530/EM540 Modbus communication protocol", "version": "1.3", "date": "2024-02-13", "url": "https://www.gavazziautomation.com/...", "note": "tables 4.1-4.24", "accessed": "2026-11-14", "sha256": "9f2b…"}
]
```

`sha256` est montré abrégé ci-dessus ; dans un fichier, ce sont les 64 chiffres hexadécimaux. Un outil **MAY** le comparer au document qu’il télécharge et avertir quand ils diffèrent : le document a été mis à jour et la carte peut devoir être revérifiée.

`source` reste un résumé d’une ligne en texte libre, pour les personnes et pour les cartes dont les sources ne sont pas connues avec ce niveau de détail. Une carte **MAY** avoir les deux.

## 4. Registres

Chaque élément de `registers` est un objet. `name`, `area`, `address` et `type` sont obligatoires ; toutes les autres clés sont facultatives, et la valeur par défaut s’applique quand elles manquent.

| Clé | Type JSON | Par défaut | Signification |
|---|---|---|---|
| `name` | chaîne non vide | | Nom de la variable. **SHOULD** être unique dans le fichier |
| `group` | chaîne | | Regroupement libre pour l’affichage (par ex. `Measurements`) |
| `area` | `"coil"`, `"discrete"`, `"input"`, `"holding"` | | Zone de données Modbus (section 5) |
| `address` | entier (2.1) | | Adresse du premier registre / bit (section 5) |
| `type` | voir section 6 | | Type de données |
| `length` | entier ≥ 1 | | Nombre de registres. Obligatoire pour `string`, ignoré sinon |
| `bit` | entier `0`–`15` | | Pour `bool` dans `input`/`holding` : quel bit du registre, 0 = le moins significatif. Pour un champ de bits `uint16` : son bit le plus bas |
| `bits` | entier `1`–`16` | | Pour `uint16` dans `input`/`holding` : largeur d’un champ de bits commençant à `bit` (4.3) |
| `scale` | nombre | `1` | Multiplicateur |
| `scale_factor` | chaîne : le `name` d’un registre | | Registre dont la valeur entière est un exposant de puissance de dix pour celui-ci (4.4) |
| `offset` | nombre | `0` | Ajouté après la mise à l’échelle |
| `unit` | chaîne | | Unité d’ingénierie (`V`, `kWh`, `°C`…) |
| `access` | `"R"`, `"W"`, `"RW"` | `"R"` | Opérations autorisées |
| `byte_order` | `"big"`, `"little"` | `byte_order` du fichier | Remplace la valeur par défaut du fichier pour ce registre (section 6) |
| `word_order` | `"big"`, `"little"` | `word_order` du fichier | Remplace la valeur par défaut du fichier pour ce registre (section 6) |
| `write_min` | nombre | | Plus petite valeur acceptée à l’écriture, en unités d’ingénierie (4.5) |
| `write_max` | nombre | | Plus grande valeur acceptée à l’écriture, en unités d’ingénierie (4.5) |
| `enum` | chaîne (un nom de `enums`) ou table | | Libellés pour des valeurs entières ou booléennes (4.1) |
| `reference` | voir 4.6 | | Valeur brute que ce registre doit contenir sur un périphérique sain |
| `firmware_min` | chaîne de version (3.2) | | Le firmware le plus ancien qui a ce registre |
| `firmware_max` | chaîne de version (3.2) | | Le firmware le plus récent qui a ce registre |
| `role` | `"model"`, `"firmware"`, `"serial"` | | Ce registre identifie le périphérique (4.7) |
| `read_alone` | booléen | `false` | Le registre est lu dans une requête à part (4.9) |
| `read_group` | chaîne non vide | | Le registre n’est lu qu’avec des registres du même groupe (4.9) |
| `parts` | tableau d’objets | | Nomme les valeurs à l’intérieur d’un registre de bloc, ou les champs de bits d’un registre de mot, pour qu’un outil puisse les afficher et les modifier un à un (4.10) |
| `description` | chaîne | | Texte libre |
| `comment` | chaîne | | Note libre sur le registre, pour ceux qui modifient la carte |

Valeur d’ingénierie = brut × 10^`scale_factor` × `scale` + `offset` (sans `scale_factor` : brut × `scale` + `offset`). À l’écriture, un outil applique l’inverse et arrondit à l’entier le plus proche pour les types entiers.

### 4.1 Tables de traduction

Beaucoup de registres contiennent un nombre qui représente un état : `0` est arrêté, `1` est inactif, `2` est en démarrage, et ainsi de suite. `enum` transforme ces nombres en libellés. C’est soit :

- **une table** écrite dans le registre : `"enum": {"0": "Stopped", "1": "Idle", "2": "Starting"}` ;
- **le nom d’une table** dans `enums`, au premier niveau, de sorte que la même liste ne soit écrite qu’une fois pour tous les registres qui l’utilisent :

```json
"enums": {
  "run_state": {"0": "Stopped", "1": "Idle", "2": "Starting", "3": "Running", "4": "Fault"}
},
"registers": [
  {"name": "Pump 1 state", "area": "holding", "address": 100, "type": "uint16", "enum": "run_state"},
  {"name": "Pump 2 state", "area": "holding", "address": 101, "type": "uint16", "enum": "run_state"}
]
```

Les valeurs sont comparées à la valeur **brute**, avant `scale` et `offset`. Une valeur absente de la table s’affiche comme un simple nombre. Les outils **SHOULD** proposer les libellés à l’écriture.

### 4.2 Valeurs sentinelles

Certains périphériques répondent par une valeur brute réservée au lieu d’une mesure : une valeur signifie « non implémenté », une autre « au-dessus de la plage », une autre « défaut du capteur ». `sentinels` les déclare pour tous les registres d’un type :

```json
"sentinels": {
  "uint16": {"0xFFFF": "Unimplemented", "0xFFFE": "Over range", "0xFFFD": "Under range"},
  "int16": {"0x7FFF": "Unimplemented", "0x7FFE": "Over range", "0x7FFD": "Under range"},
  "uint32": {"0xFFFFFFFF": "Unimplemented"}
}
```

- Les clés de `sentinels` sont `int16`, `uint16`, `int32`, `uint32`, `int64`, `uint64`. Une table s’applique à tous les registres de ce type.
- Les valeurs **MUST** tenir dans le type et sont comparées à la valeur **brute**, avant `scale` et `offset`.
- Quand une lecture correspond, les outils **SHOULD** afficher le libellé plutôt qu’un nombre et **SHOULD NOT** la traiter comme une mesure (dans les graphiques, les limites ou les moyennes).
- Un libellé d’`enum` pour la même valeur brute l’emporte sur la sentinelle.

### 4.3 Champs de bits

Certains périphériques regroupent plusieurs petites valeurs dans un registre, par exemple quatre codes d’alarme de 4 bits. Un registre `uint16` avec `bit` et `bits` en lit un : valeur brute = (registre >> `bit`) & (2^`bits` − 1). `bit` + `bits` **MUST NOT** dépasser 16.

```json
{"name": "Alarm A", "area": "holding", "address": 100, "type": "uint16", "bit": 12, "bits": 4, "enum": "alarm_condition"},
{"name": "Alarm B", "area": "holding", "address": 100, "type": "uint16", "bit": 8, "bits": 4, "enum": "alarm_condition"}
```

Des registres qui lisent des champs différents d’un même registre ne se chevauchent pas. Pour écrire un champ, il **SHOULD** lire le registre, ne modifier que les bits du champ et le réécrire.

### 4.4 Facteurs d’échelle

Certains périphériques, notamment les onduleurs et compteurs SunSpec, envoient un registre d’exposant distinct pour une valeur au lieu d’une échelle fixe : la valeur est brut × 10^exposant, et l’exposant peut changer avec la plage du périphérique. `scale_factor` nomme ce registre d’exposant :

```json
{"name": "AC power", "area": "holding", "address": 40083, "type": "int16", "unit": "W", "scale_factor": "W_SF"},
{"name": "W_SF", "area": "holding", "address": 40084, "type": "int16"}
```

- Le registre nommé **MUST** être un registre du même fichier avec un type entier (`int16` … `uint64`) et sans `bits`, et **MUST NOT** avoir lui-même de `scale_factor`. Si plusieurs registres partagent le nom, le premier compte.
- Seuls les types numériques peuvent avoir un `scale_factor` (pas `bool` ni `string`).
- Un outil lit le registre d’exposant avec la valeur, même quand l’utilisateur a choisi de ne pas l’afficher. Si l’exposant ne peut pas être lu, ou est une sentinelle (4.2, par ex. le `-32768` de SunSpec = non implémenté), la valeur n’est pas disponible.
- À l’écriture, un outil lit d’abord l’exposant et applique l’inverse.

### 4.5 Limites d’écriture

`write_min` et `write_max` déclarent les valeurs qu’un registre accepte à l’écriture, afin qu’un outil puisse rejeter une mauvaise valeur avant qu’elle n’atteigne le périphérique.

- Les deux sont des nombres en **unités d’ingénierie** : la valeur que voit l’utilisateur, après application de `scale_factor`, `scale` et `offset`. Une limite de `0.5` sur un registre dont `scale` vaut `0.1` correspond à une valeur brute de 5.
- L’une ou l’autre peut être omise : une limite absente laisse ce côté ouvert. Si les deux sont absentes, un registre n’a pas de limite déclarée (le périphérique décide).
- `write_min` **MUST NOT** être supérieur à `write_max`. Les limites sont inclusives.
- Un outil **MUST NOT** envoyer une écriture dont la valeur d’ingénierie est inférieure à `write_min` ou supérieure à `write_max`, et **SHOULD** dire à l’utilisateur quelle limite a été dépassée.
- Elles s’appliquent à la valeur que demande l’utilisateur, avant sa conversion en valeur brute et son arrondi. Une valeur dans les limites qui ne tient pourtant pas dans le type du registre est refusée par les contrôles de type habituels.
- Elles n’ont pas de sens pour les registres `bool` et `string` ni pour les registres qui ne peuvent pas être écrits (`access` `"R"`), et y sont ignorées.

```json
{"name": "Setpoint", "area": "holding", "address": 100, "type": "uint16", "scale": 0.1, "unit": "°C", "access": "RW", "write_min": 5, "write_max": 30}
```

### 4.6 Valeurs de référence

`reference` donne une valeur qu’un périphérique sain est connu pour contenir dans ce registre (un numéro de modèle, un identifiant de protocole fixe, un code de fabricant). Un outil peut lire le registre et le comparer à la référence pour détecter une adresse, une base, un ordre d’octets ou un type de données erronés avant que l’utilisateur ne se fie aux autres valeurs. Tous les périphériques n’ont pas un tel registre ; la plupart des registres n’ont donc pas de `reference`.

- C’est la valeur **brute**, avant `scale_factor`, `scale` et `offset`, dans le type JSON de cette valeur : un entier (2.1) pour les types entiers et les champs de bits, un nombre pour `float32` et `float64`, `true` / `false` pour `bool`, une chaîne pour `string`. Elle **MUST** tenir dans le type (et dans la largeur d’un champ de bits, ou `2 × length` caractères pour une chaîne).
- La vérification, c’est le registre lui-même : un outil lit son `area` et son `address` (déjà ajustés selon `address_base`) et décode son `type` avec son ordre des octets et des mots.
- Une carte peut avoir autant de registres avec `reference` qu’elle le souhaite.
- Résultat de chaque vérification : **match** (la valeur brute décodée est égale à la référence), **mismatch** (elle diffère), **failed** (la lecture a renvoyé une erreur ou dépassé le délai : on ne sait donc rien), **not checked** (le registre n’a pas été lu). Un outil **SHOULD** les signaler séparément : un mismatch indique une carte ou des paramètres erronés, une lecture échouée un problème de connexion ou d’adressage.
- Les flottants sont comparés à la précision du type lui-même (une référence `float32` est comparée comme un flottant 32 bits). Les chaînes sont comparées après suppression des caractères NUL et espaces de fin.
- Une référence ne fait qu’appuyer un diagnostic. Plusieurs ordres d’octets ou de mots peuvent décoder les mêmes octets en la même valeur (un petit nombre ou un palindrome se lit pareil dans plus d’un ordre) ; une correspondance ne prouve donc pas que toute la carte est correcte. Les cartes **SHOULD** utiliser une valeur distinctive et **SHOULD** en donner plus d’une quand le périphérique en a.
- Une `reference` sur un registre qui ne peut pas être lu (`access` `"W"`) est une erreur.

```json
{"name": "Manufacturer code", "area": "holding", "address": 768, "type": "uint16", "reference": "0x016A"},
{"name": "Serial prefix", "area": "holding", "address": 770, "type": "uint32", "word_order": "little", "reference": "0x00010002"}
```

### 4.7 Registres d’identité

`role` marque les registres qui disent quel périphérique est connecté, afin qu’un outil puisse y confronter la carte (section 9) :

- **`"model"`** : le nom ou code de modèle du périphérique. Sa valeur, ou son libellé d’`enum` quand il en a un, est comparée à `models`. Il vaut mieux donner un libellé à un code de modèle numérique : `"enum": {"0x016A": "EM-100"}`.
- **`"firmware"`** : la version du firmware. Un registre de chaîne est lu comme du texte, et la première chaîne de version qu’il contient est utilisée (`"V2.01b"` donne `2.01`). Un nombre donne sa valeur d’ingénierie (`102` avec `scale` `0.01` donne `1.02`). Quand plusieurs registres ont ce rôle, leurs valeurs sont jointes par des points dans l’ordre du fichier, ce qui convient aux périphériques qui séparent les versions majeure et mineure, par exemple en deux champs de bits d’un registre (`"bit": 8, "bits": 8` et `"bit": 0, "bits": 8`).
- **`"serial"`** : le numéro de série. Les outils **MAY** l’afficher ; il n’est jamais comparé.

Au plus un registre **MAY** avoir le rôle `"model"` et au plus un `"serial"`. Un registre ayant un rôle **MUST** pouvoir être lu. Pour le reste, les registres ayant un rôle sont des registres ordinaires : ils sont lus et affichés comme les autres, et peuvent aussi avoir une `reference`.

### 4.8 Identité depuis le périphérique (FC17, FC43)

Certains périphériques disent ce qu’ils sont avec une fonction propre et n’ont pas de registre d’identité. `identify` indique quelle fonction envoyer et où se trouve l’identité dans la réponse, afin qu’un outil puisse vérifier la carte comme il le fait avec les registres de la section 4.7 (section 9). Une carte a au plus un `identify`.

```json
"enums": {"type_codes": {"0x41": "DMG610", "0x57": "DMG620"}},
"identify": {
  "function": 17,
  "fields": [
    {"name": "Type", "offset": 0, "type": "uint8", "role": "model", "enum": "type_codes"},
    {"name": "Software revision", "offset": 1, "type": "uint8", "role": "firmware"},
    {"name": "Hardware revision", "offset": 2, "type": "uint8"}
  ]
}
```

```json
"identify": {
  "function": 43,
  "fields": [
    {"name": "Vendor name", "object": 0},
    {"name": "Product code", "object": 1, "role": "model"},
    {"name": "Revision", "object": 2, "role": "firmware"}
  ]
}
```

| Clé | Type JSON | Par défaut | Signification |
|---|---|---|---|
| `function` | `17` ou `43` | | `17` : Report Slave ID. `43` : Read Device Identification (transport d’interface encapsulée, type MEI `0x0E`) |
| `fields` | tableau non vide d’objets champ | | Les valeurs à tirer de la réponse |

Chaque champ est un objet. `name` est toujours obligatoire. `role` et les clés suivantes dépendent de `function`.

| Clé | Type JSON | Par défaut | Signification |
|---|---|---|---|
| `name` | chaîne non vide | | Nom affiché aux personnes |
| `role` | `"model"`, `"firmware"`, `"serial"` | | Signification de la valeur, comme pour les registres (4.7). Au plus un `"model"` et un `"serial"` |
| `offset` | entier ≥ 0 | | **FC17 seulement, obligatoire.** Position du champ, en octets, dans les données de la réponse. Le décalage `0` est le premier octet après le nombre d’octets, de sorte que les données sont les octets qu’un périphérique liste après « byte count » dans son manuel |
| `type` | `"uint8"`, `"uint16"`, `"string"` | | **FC17 seulement, obligatoire.** `uint16` est big-endian. `string` est de l’ASCII, sans les caractères NUL et espaces de fin |
| `length` | entier ≥ 1 | | **FC17 seulement.** Longueur en octets. Obligatoire pour `string` |
| `enum` | nom de table ou table en ligne | | **FC17 seulement.** Traduit un nombre en libellé (4.1). Il vaut mieux donner un libellé à un code de modèle, qui est alors comparé à `models` |
| `object` | entier 0–255 | | **FC43 seulement, obligatoire.** ID d’objet : `0x00` VendorName, `0x01` ProductCode, `0x02` MajorMinorRevision, `0x03` VendorUrl, `0x04` ProductName, `0x05` ModelName, `0x06` UserApplicationName, `0x80`–`0xFF` définis par le périphérique |

- **FC43 :** la valeur d’un objet est une chaîne ASCII, sans les caractères NUL et espaces de fin. Un outil demande le niveau d’accès (basique, normal ou étendu) qui inclut tous les objets nommés par les champs et suit l’indicateur « la suite arrive » jusqu’à les avoir tous. Pour `"firmware"`, on utilise la première chaîne de version du texte, comme pour un registre de chaîne (4.7).
- **Les deux fonctions :** un périphérique répond sur un ID d’unité, pas sur une adresse de registre ; `address_base` ne s’applique donc pas.
- **Pas de valeur :** une réponse plus courte que ce qu’exige un champ, une réponse d’exception, un objet manquant ou un périphérique qui ne prend pas la fonction en charge ne donnent pas de valeur. La vérification est **unknown** (section 9), pas un mismatch.
- **Plusieurs sources :** `identify` et des registres avec `role` peuvent coexister. Quand les deux donnent une valeur pour le même rôle, un outil **SHOULD** utiliser les registres et **MAY** utiliser `identify` pour les rôles qu’aucun registre ne donne.

### 4.9 Lecture en requêtes séparées

Un lecteur regroupe normalement les registres voisins en une seule requête. Certains périphériques refusent une requête qui franchit la frontière entre deux tables internes, même si tous les registres qu’elle contient existent. Deux clés facultatives limitent la façon dont les registres sont regroupés :

- **`read_alone`** : `true` signifie que le registre est lu dans une requête qui ne contient aucun autre registre. Les champs de bits et les autres registres qui occupent les mêmes mots comptent comme le même registre.
- **`read_group`** : un nom. Les registres portant le même nom **MAY** être lus dans une seule requête, et une requête **MUST NOT** contenir de registres de groupes différents ni un registre sans groupe. Les registres sans `read_group` sont regroupés comme avant.

```json
{"name": "Digital input status", "area": "holding", "address": 768, "type": "uint16", "read_group": "status"},
{"name": "Active tariff", "area": "holding", "address": 769, "type": "uint16", "read_group": "status"},
{"name": "Firmware", "area": "holding", "address": 770, "type": "uint16", "read_alone": true}
```

Quand les deux clés sont présentes, `read_alone` l’emporte. Les clés ne limitent que le regroupement : un lecteur est libre de faire plus de requêtes que nécessaire, et `max_read_registers` et `max_read_bits` s’appliquent toujours. Elles n’affectent que la manière dont les registres sont demandés, pas leur signification ; un lecteur qui ne les connaît pas lit donc les mêmes registres, regroupés comme toujours. C’est pourquoi elles n’exigent pas de nouvelle version de `mbmap` (section 8) : sur un périphérique qui refuse la requête regroupée, un ancien lecteur échoue exactement comme il le ferait sans les clés.

### 4.10 Parties d’un bloc

Certains périphériques gardent plusieurs valeurs dans un bloc et n’acceptent que le bloc entier : une écriture qui commence au milieu, ou qui ne le couvre pas, est refusée (exception `0x02` ou `0x03`). Un cas typique est une passerelle SMS dont le bloc contient le numéro du destinataire suivi du texte du message. La carte décrit ce bloc comme **un** registre, comme elle l’a toujours fait, et `parts` dit ce qu’il contient :

```json
{
  "name": "Add SMS", "area": "holding", "address": 397, "type": "string", "length": 90, "access": "RW",
  "parts": [
    {"name": "Recipient", "offset": 0, "length": 10, "description": "Phone number as 00 + digits (00 stands for +)"},
    {"name": "Text", "offset": 10, "length": 80}
  ]
}
```

| Clé | Type JSON | Par défaut | Signification |
|---|---|---|---|
| `name` | chaîne non vide | | Nom affiché aux personnes |
| `offset` | entier ≥ 0 | | Position de la partie dans le bloc, en **registres**, à partir du premier registre du registre |
| `type` | `"string"` ou un type numérique (section 6) | `"string"` | Comment la partie est lue et écrite |
| `length` | entier ≥ 1 | | Nombre de registres. Obligatoire pour `string`, ignoré pour les autres types |
| `description` | chaîne | | Texte libre |

- `parts` ne concerne qu’un registre `string`. Il **MUST NOT** être vide. Chaque partie **MUST** se trouver dans le bloc (`offset` plus ses registres vaut au plus le `length` du registre), et les parties **MUST NOT** se chevaucher. Les registres qu’aucune partie ne couvre sont permis : c’est du remplissage.
- Le registre lui-même garde sa signification. Un lecteur qui ne connaît pas `parts` lit et écrit le bloc entier comme une seule chaîne, en une seule requête, exactement comme avant ; une telle carte continue donc de fonctionner dans tous les outils.
- Un outil qui connaît `parts` **SHOULD** afficher chaque partie comme un champ à part. Pour lire, il décode chaque partie du bloc, avec le `byte_order` et le `word_order` du registre (section 6). Pour écrire, il construit le bloc **entier** à partir des parties et l’envoie en une seule requête (FC16) : une partie laissée vide par l’utilisateur est envoyée sous forme d’octets nuls, de sorte qu’un champ vide ne conserve jamais une ancienne valeur par accident. Un outil **MUST NOT** envoyer une écriture qui ne couvre que certaines parties, car le périphérique la refuse.
- Une partie `string` est de l’ASCII, complétée par des caractères NUL jusqu’à son `length`. L’outil **MUST** refuser un texte de plus de `2 × length` caractères. Une partie numérique est encodée comme d’habitude (section 6).
- `access` est celui du registre : les parties ne peuvent pas être plus inscriptibles que le bloc.
- `parts` ne décrit que ce qu’un registre contient ; il n’exige donc pas de nouvelle version de `mbmap` (section 8). Les lecteurs qui l’ignorent se comportent comme avant.

#### Champs de bits d’un mot

Certains périphériques gardent plusieurs réglages dans un mot qu’ils n’acceptent qu’**entier** : une écriture qui met un bit à 1 met les autres à 0. La même clé `parts` décrit ce mot sur un registre `uint16`, `uint32` ou `uint64`. Le registre reste un nombre ordinaire : un lecteur qui ne connaît pas `parts` le lit et l’écrit exactement comme avant.

```json
{
  "name": "Control word", "area": "holding", "address": 2001, "type": "uint32", "access": "RW",
  "parts": [
    {"name": "Command", "bit": 0, "bits": 4, "enum": "command", "description": "Play, ready or stop"},
    {"name": "Error acknowledge", "bit": 4},
    {"name": "Enable unit 1", "bit": 21}
  ]
}
```

| Clé | Type JSON | Par défaut | Signification |
|---|---|---|---|
| `name` | chaîne non vide | | Nom affiché aux personnes |
| `bit` | entier ≥ 0 | | Bit le plus bas du champ ; 0 = bit de poids faible de la valeur décodée avec le `byte_order` et le `word_order` du registre (6) |
| `bits` | entier ≥ 1 | `1` | Largeur du champ |
| `enum` | chaîne | | Nom d’une table de traduction (4.1) pour la valeur du champ |
| `description` | chaîne | | Texte libre |

- `bit` + `bits` **MUST NOT** dépasser la largeur du registre (16, 32 ou 64). Les champs **MUST NOT** se chevaucher. Les bits qu’aucun champ ne couvre sont permis : ils sont inutilisés ou réservés.
- Un champ de bits n’a ni `offset`, ni `length`, ni `type` : ils appartiennent aux parties d’un registre `string`, et les deux sortes ne se mélangent pas dans un même registre.
- Un outil qui connaît `parts` **SHOULD** afficher chaque champ séparément. Pour lire, il extrait le champ de la valeur décodée. Pour écrire, il construit la valeur **entière** à partir des champs (un champ non renseigné est envoyé à 0) et écrit tous les registres du mot en une seule requête (FC16). Il **MUST NOT** envoyer une écriture qui ne couvre que certains champs ou registres.
- `access` est celui du registre. Les champs de bits en lecture seule d’un registre lisible continuent d’utiliser `bit` et `bits` sur le registre lui-même (4.3) ; `parts` sert aux mots qui doivent être écrits entiers.
- Les registres qui utilisent ces `parts` échouent à la validation d’un ancien validateur (`bad-parts` : avant cet ajout, `parts` ne servait que pour les chaînes), mais les lecteurs qui ignorent `parts` lisent le registre comme avant. C’est pourquoi il ne faut pas de nouvelle version de `mbmap` (8).

### 4.11 Lectures avec d’autres codes de fonction

Certains périphériques ne donnent une partie de leur état courant que par une fonction qui ne lit aucune des quatre zones (section 5), par exemple un octet d’état lu avec Read Exception Status (FC07). `function_reads` énumère ces lectures. C’est une clé de premier niveau, un tableau non vide :

```json
"function_reads": [
  {
    "name": "Controller status",
    "function": 7,
    "fields": [
      {"name": "Alarm", "bit": 0},
      {"name": "Fan speed", "bit": 1, "bits": 2, "enum": {"0": "Stopped", "1": "Low", "2": "High"}}
    ]
  }
]
```

| Clé | Type JSON | Par défaut | Signification |
|---|---|---|---|
| `name` | chaîne non vide, obligatoire | | Nom affiché aux personnes |
| `function` | entier, obligatoire | | Le code de fonction, l’un de ceux du tableau ci-dessous |
| `description` | chaîne | | Texte libre |
| `fields` | tableau non vide d’objets champ, obligatoire | | Les valeurs à extraire de la réponse |

| `function` | Nom | Données de la requête | Réponse |
|---|---|---|---|
| `7` | Read Exception Status | aucune | un octet d’état |

Chaque champ est une valeur de l’octet d’état :

| Clé | Type JSON | Par défaut | Signification |
|---|---|---|---|
| `name` | chaîne non vide, obligatoire | | Nom affiché aux personnes |
| `bit` | entier `0`–`7` | | Bit de poids le plus faible de la valeur, 0 = le moins significatif. Sans `bit`, la valeur est l’octet entier, de 0 à 255 |
| `bits` | entier `1`–`8` | `1` | Largeur de la valeur. Nécessite `bit`, et `bit` + `bits` **MUST NOT** dépasser 8 |
| `enum` | nom de table ou table en ligne | | Traduit la valeur en un libellé (4.1) |
| `description` | chaîne | | Texte libre |

- **La liste des fonctions est fermée.** Une carte est une donnée écrite par quelqu’un d’autre, et un outil la lit sans poser de question pour chaque requête, alors qu’un code de fonction que l’outil ne connaît pas peut modifier ou redémarrer le périphérique. Une carte ne peut donc indiquer aucune autre fonction, publique ou définie par l’utilisateur, ni donner de données pour la requête. Une fonction n’est ajoutée à cette spécification que si elle ne fait que lire, avec sa requête et sa réponse définies ici.
- Un outil **MUST NOT** envoyer une fonction que le tableau de sa version de cette spécification n’énumère pas, même si l’utilisateur le confirmait. Il ignore cette entrée et lit le reste de la carte.
- La requête se réduit au code de fonction. Une carte contient au plus une entrée par fonction.
- Ces valeurs sont en lecture seule : on ne peut pas écrire dans un champ.
- Un périphérique répond à un unit id, pas à une adresse de registre ; `address_base` ne s’applique donc pas.
- **Pas de valeur :** une réponse d’exception, l’absence de réponse, une réponse qui n’est pas un octet d’état, ou un périphérique ou une passerelle qui ne prend pas en charge la fonction ne donnent aucune valeur. Ce n’est pas une erreur de la carte, et les registres sont lus comme d’habitude. Modbus définit FC07 pour les liaisons série ; une passerelle Modbus TCP peut donc la refuser.
- La signification de chaque bit de l’octet FC07 dépend du périphérique.
- `function_reads` ajoute des valeurs et ne change rien d’autre ; un lecteur qui l’ignore se comporte comme avant, et aucune nouvelle version de `mbmap` n’est nécessaire (8).

## 5. Zones et adresses

| `area` | Unité | Lecture | Écriture | `access` autorisé |
|---|---|---|---|---|
| `coil` | bit | FC01 | FC05 / FC15 | `R`, `W`, `RW` |
| `discrete` | bit | FC02 | — | `R` |
| `input` | registre de 16 bits | FC04 | — | `R` |
| `holding` | registre de 16 bits | FC03 | FC06 / FC16 | `R`, `W`, `RW` |

Avec `address_base` `0`, `address` est l’adresse envoyée sur le fil (0–65535). Avec `address_base` `1`, l’adresse sur le fil est `address − 1` (1–65536), ce qui correspond aux manuels qui numérotent les registres à partir de 1.

La notation « Modicon » à 5 et 6 chiffres (`40001`, `300010`) n’est **pas** valide dans `address`. Écrivez-la comme une zone plus un nombre : `40001` devient `"area": "holding"`, `"address": 1`, avec `"address_base": 1`.

## 6. Types, ordre des octets et ordre des mots

| `type` | Registres | Notes |
|---|---|---|
| `bool` | — | Dans `coil`/`discrete` : un bit. Dans `input`/`holding` : un bit d’un registre, donc `bit` est obligatoire |
| `int16`, `uint16` | 1 | |
| `int32`, `uint32`, `float32` | 2 | Les flottants sont IEEE 754 |
| `int64`, `uint64`, `float64` | 4 | |
| `string` | `length` | 2 caractères ASCII par registre. Les caractères NUL et espaces de fin sont supprimés à la lecture |

Deux réglages indépendants disent comment arrivent les octets d’une valeur :

- **`byte_order`**, à l’intérieur de chaque registre de 16 bits : `"big"` envoie d’abord l’octet de poids fort (la norme Modbus), `"little"` d’abord l’octet de poids faible.
- **`word_order`**, entre les registres d’une valeur 32 ou 64 bits : `"big"` place d’abord le registre le plus significatif (à l’adresse la plus basse), `"little"` d’abord le moins significatif.

Les clés de premier niveau fixent la valeur par défaut du fichier ; le `byte_order` et le `word_order` d’un registre la remplacent chacun de leur côté (un registre qui ne définit que `"word_order": "little"` garde l’ordre des octets du fichier).

| Type | `byte_order` | `word_order` |
|---|---|---|
| `bool` | non utilisé | non utilisé |
| `int16`, `uint16` | échange les deux octets du registre | non utilisé (un seul registre) |
| `int32`, `uint32`, `float32` | échange les deux octets de chaque registre | décide lequel des 2 registres est le mot de poids fort |
| `int64`, `uint64`, `float64` | échange les deux octets de chaque registre | `"little"` inverse les 4 registres dans leur ensemble |
| `string` | `"big"` : le premier octet reçu est le premier caractère ; `"little"` : le deuxième octet reçu est le premier caractère | non utilisé (les registres sont lus dans l’ordre des adresses) |

Pour les valeurs 64 bits, l’ordre de mots little inverse toute la séquence des quatre registres ; il n’échange pas séparément deux moitiés de 32 bits.

Ordre sur le fil de la valeur 32 bits `0x0A0B0C0D` :

| `byte_order` | `word_order` | Octets sur le fil | Nom courant |
|---|---|---|---|
| `big` | `big` | `0A 0B 0C 0D` | Norme Modbus |
| `big` | `little` | `0C 0D 0A 0B` | « échange de mots », utilisé par de nombreux compteurs et automates |
| `little` | `big` | `0B 0A 0D 0C` | « échange d’octets » (rare) |
| `little` | `little` | `0D 0C 0B 0A` | little-endian |

## 7. Validation

Les lecteurs **SHOULD** signaler chaque problème avec l’un des codes ci-dessous et un [JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901) vers la valeur (`/registers/3/address`, `/enums/relay`), afin que les outils s’accordent sur ce qui ne va pas. Les problèmes qui concernent tout le fichier n’ont pas de pointeur. Une **error** rend le fichier invalide. Un **warning** est signalé, mais le fichier reste utilisable.

| Code | Gravité | Quand |
|---|---|---|
| `not-utf8` | error | Le fichier n’est pas de l’UTF-8 valide |
| `not-json` | error | Le fichier n’est pas un unique objet JSON valide, ou répète une clé dans un objet. Signalé pour tout le fichier : les analyseurs placent les erreurs de syntaxe à des positions différentes, la position figure donc dans le message |
| `bad-json-type` | error | Une clé connue contient le mauvais type JSON (une chaîne là où un nombre est attendu, `null`, …) |
| `missing-key` | error | `mbmap`, `vendor`, `model` ou `registers` manque (pour tout le fichier), ou un registre n’a pas `name`, `area`, `address` ou `type`, ou l’a vide (au niveau du registre) |
| `bad-meta-value` | error | Une clé de premier niveau a une valeur hors de son ensemble ou de sa plage autorisés, y compris un `mbmap` différent de `2` |
| `bad-area` | error | `area` inconnue, ou non écrite en minuscules |
| `bad-type` | error | `type` inconnu, ou non écrit en minuscules |
| `type-area` | error | Un type autre que `bool` dans `coil` ou `discrete` |
| `bad-address` | error | `address` n’est pas un entier |
| `address-range` | error | L’adresse est inférieure à `address_base`, ou la valeur dépasse l’adresse 65535 |
| `missing-bit` | error | `bool` dans `input`/`holding` sans `bit` |
| `bad-bit` | error | `bit` hors de `0`–`15` |
| `missing-length` | error | `string` sans `length` |
| `bad-length` | error | `length` n’est pas un entier ≥ 1 |
| `bad-access` | error | `access` inconnu (ou non écrit en majuscules), ou non autorisé pour l’`area` |
| `bad-byte-order` | error | Le `byte_order` ou le `word_order` d’un registre n’est ni `"big"` ni `"little"` |
| `bad-enum` | error | Une table enum (2.2) a une clé qui n’est pas un entier, un libellé vide, une valeur répétée ou aucune entrée, ou un nom d’`enums` n’est pas `a`–`z`, `0`–`9`, `_` |
| `bad-sentinel` | error | `sentinels` nomme un type non pris en charge, ou une table n’est pas valide (2.2) ou contient une valeur qui ne tient pas dans le type |
| `bad-bits` | error | `bits` n’est pas un entier de 1 à 16, est utilisé sur un type autre que `uint16` ou en dehors de `input`/`holding`, n’a pas de `bit`, ou `bit` + `bits` dépasse 16 |
| `unknown-enum` | error | `enum` nomme une table que `enums` ne définit pas |
| `bad-write-limit` | error | `write_min` est supérieur à `write_max` |
| `bad-reference` | error | `reference` n’est pas une valeur brute valide pour le `type` du registre (pas un entier, hors de la plage du type, plus large que le champ de bits, pas un booléen pour `bool`, pas un nombre fini pour les flottants, plus long que la chaîne), ou est défini sur un registre qui ne peut pas être lu |
| `unknown-scale-factor` | error | `scale_factor` ne nomme aucun registre du fichier (les registres en erreur ne comptent pas) |
| `bad-scale-factor` | error | `scale_factor` est défini sur un `bool` ou une `string`, ou nomme un registre qui n’est pas un entier complet (un flottant, `bool`, `string` ou champ de bits) ou qui a lui-même un `scale_factor` |
| `bad-version` | error | `firmware_min` ou `firmware_max`, dans le fichier ou dans un registre, n’est pas une chaîne de version (3.2) |
| `bad-firmware-range` | error | `firmware_min` est postérieur à `firmware_max`, dans le fichier ou dans un registre |
| `bad-source` | error | Un élément de `sources` n’est pas un objet avec un `title` non vide, ou a un `version`, `date`, `url`, `note`, `accessed` ou `sha256` de forme incorrecte |
| `bad-role` | error | `role` n’est ni `"model"`, ni `"firmware"`, ni `"serial"`, est défini sur un registre qui ne peut pas être lu, ou `"model"` ou `"serial"` est utilisé plus d’une fois |
| `bad-identify` | error | `identify` n’est pas valide (4.8) : `function` n’est ni `17` ni `43`, `fields` est vide, ou un champ n’a pas de `name`, a un `role` inconnu ou répété pour `"model"` ou `"serial"`, ou enfreint les règles de sa fonction (FC17 : `offset` manquant ou négatif, `type` manquant ou inconnu, `string` sans `length`, un `enum` qui ne nomme aucune table ou n’est pas une table valide, un `object` ; FC43 : `object` manquant ou hors de 0–255, un `offset`, `type`, `length` ou `enum`) |
| `bad-parts` | error | `parts` est vide, est défini sur un registre qui n’est pas une `string` avec un `length` valide, ou a une partie sans `name` ou `offset`, avec un `offset` négatif, un `type` inconnu ou `bool`, une partie `string` sans `length`, une partie qui dépasse le bloc, ou des parties qui se chevauchent; sur un registre `uint16`, `uint32` ou `uint64`, la première condition ne s’applique pas et les parties sont des champs de bits : c’est alors une partie sans `bit`, avec un `bit` négatif, avec `bits` inférieur à 1, avec `offset`, `length` ou `type`, un champ qui dépasse la largeur du registre ou des champs qui se chevauchent ; un `enum` sans table donne `unknown-enum` (4.10) |
| `bad-function-read` | error | `function_reads` n’est pas valide (4.11) : il est vide, ou une entrée n’est pas un objet, n’a pas de `name`, a une `function` absente du tableau de 4.11 ou utilisée deux fois, a un `request`, ou n’a pas de `fields` ; ou un champ n’est pas un objet, n’a pas de `name`, a un `bit` hors de `0`–`7`, des `bits` sans `bit` ou au-delà des 8 bits de l’octet, ou un `enum` qui ne désigne aucune table ou n’est pas une table valide ; ou une `description` n’est pas une chaîne |
| `no-rows` | warning | `registers` est vide |
| `duplicate-name` | warning | Un `name` est utilisé plus d’une fois par des registres dont les plages de firmware se chevauchent (3.2) |
| `model-list` | warning | `model` liste des périphériques séparés par « / » ; donnez le nom de la famille et listez les périphériques dans `models` (3.2) |
| `overlap` | warning | Une valeur commence à l’intérieur des registres d’une autre valeur dans la même zone, ce qui signifie généralement une adresse ou un type erronés. Les registres qui commencent à la même adresse sont des lectures alternatives des mêmes données (par exemple un code lu comme un nombre et comme du texte) et ne comptent jamais comme un chevauchement ; pas plus que les bits et champs de bits d’un registre (`bool` + `bit`, `uint16` + `bit` + `bits`), ni les registres dont les plages de firmware ne se chevauchent pas |
| `firmware-outside-map` | warning | La plage de firmware d’un registre n’a aucune version en commun avec celle du fichier, il ne s’applique donc jamais |
| `bad-read` | error | `read_group` est une chaîne vide |
| `unknown-key` | warning | Un registre a une clé qui ne figure pas dans cette spécification et ne commence pas par `x_` |
| `unused-write-limit` | warning | `write_min` ou `write_max` est défini sur un registre où il n’a aucun effet (`bool`, `string`, ou `access` `"R"`) |
| `unused-bit` | warning | `bit` est défini sur un registre où il n’a aucun effet (tout type sauf `bool`, à moins que `bits` ne soit aussi défini sur un `uint16`) |

Un registre ayant une erreur dans `name`, `area`, `address` ou `type` n’est pas vérifié plus avant. Un registre ayant une erreur quelconque est exclu de la vérification d’`overlap`.

Le [JSON Schema](schema/mbmap-2.schema.json) vérifie la structure, les types JSON et les plages de valeurs ; les règles qui relient plusieurs valeurs (`unknown-enum`, facteurs d’échelle, `overlap`, `address-range`, `bad-reference` selon le type, clés en double) nécessitent du code. Le dossier [`tests/`](tests/) contient des fichiers d’exemple avec les diagnostics que chacun doit produire, de sorte que toute implémentation puisse s’y confronter.

## 8. Compatibilité et gestion des versions

- Les lecteurs **MUST** ignorer les clés qu’ils ne connaissent pas, au premier niveau et dans les registres. Cela permet à des fichiers plus récents de s’ouvrir dans des lecteurs plus anciens.
- Les clés propres à un fabricant ou à un outil **SHOULD** commencer par `x_` (`"x_modbench_icon"`, `"x_alarm_high"`) afin de ne jamais entrer en conflit avec de futures versions de cette spécification. Leurs valeurs **MAY** être de n’importe quel type JSON.
- `mbmap` est la version **majeure**. Un lecteur **MUST** refuser un fichier dont il ne prend pas en charge le `mbmap` et **SHOULD** dire quelle version il a trouvée.
- Les nouvelles clés facultatives que les anciens lecteurs peuvent ignorer sans risque sont ajoutées sans changer `mbmap`. Une clé dont l’ancien lecteur comprendrait mal le sens s’il l’ignorait exige une nouvelle version majeure.
- Le fichier de schéma porte le nom de la version majeure (`mbmap-2.schema.json`) et n’y gagne que des clés facultatives.

## 9. Vérifier une carte par rapport au périphérique connecté

Un outil qui lit les registres d’identité (4.7), ou la réponse d’identité décrite par `identify` (4.8), du périphérique connecté **SHOULD** les comparer à la carte, afin que l’utilisateur ne se fie pas aux valeurs d’une carte écrite pour un autre modèle ou firmware. Il peut aussi laisser l’utilisateur indiquer à la main le modèle ou le firmware quand le périphérique ne les signale pas.

Chaque vérification a l’un de trois résultats :

| Résultat | Modèle | Firmware |
|---|---|---|
| **match** | Le modèle du périphérique, comparé sans tenir compte de la casse ni des espaces autour, est l’un de `models` (ou `model`) | La version du périphérique est comprise entre `firmware_min` … `firmware_max` |
| **mismatch** | Il ne l’est pas | Elle est hors de la plage |
| **unknown** | La carte n’a pas de registre `"model"`, il n’a pas pu être lu, ou n’a donné aucune valeur | La carte n’a pas de registre `"firmware"`, il n’a pas pu être lu, aucune chaîne de version n’y a été trouvée, ou la carte ne déclare pas de plage |

Ce qu’un outil fait de chacun :

- **match** : rien à signaler ; l’outil **MAY** montrer que le périphérique a été reconnu.
- **mismatch** : l’outil **SHOULD** avertir clairement, en disant ce que la carte attend et ce que le périphérique a signalé, et **SHOULD** demander confirmation avant la première écriture sur le périphérique. Il **MUST NOT** arrêter de lire pour autant : lire est sans danger, et l’utilisateur peut en savoir plus (un périphérique revendu sous une autre marque, un firmware plus récent qui a gardé les mêmes registres).
- **unknown** : ce n’est pas un problème. La plupart des périphériques ne signalent ni modèle ni firmware, et la plupart des cartes s’appliquent à tous les firmwares. L’outil **MUST NOT** le traiter comme un mismatch, et **MAY** mentionner que la carte déclare une plage de firmware qui n’a pas pu être vérifiée.

Registres ayant leur propre plage de firmware (3.2) :

- Quand le firmware est **connu**, un outil **SHOULD** n’utiliser que les registres dont la plage l’inclut : les autres n’existent pas sur ce périphérique, et un nom de registre partagé par plusieurs plages de firmware désigne alors un seul registre.
- Quand le firmware est **inconnu**, un outil **SHOULD** lire tous les registres, **SHOULD** montrer lesquels dépendent du firmware (par exemple « firmware 2.1 et ultérieur ») et **MAY** laisser l’utilisateur choisir la version.

Une carte sans `models`, `firmware_min`, `firmware_max` ni registres d’identité n’est confrontée à rien, ce qui est correct pour une carte qui s’applique à tous les périphériques de son modèle.

## 10. Anciens fichiers

La version 1 du format, fondée sur le CSV, est obsolète. Les nouveaux lecteurs n’ont pas besoin de la prendre en charge ; les fichiers de ce format peuvent être convertis avec [`tools/migrate/migrate.py`](tools/migrate/migrate.py) (voir [legacy/v1](legacy/v1/)).
