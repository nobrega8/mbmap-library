# Erreurs CRC Modbus sur RS-485

Une erreur CRC signifie qu’une trame est arrivée mais que sa somme de contrôle ne correspondait pas : des octets ont été altérés ou perdus en route. Contrairement à une mauvaise adresse, elle renvoie à la liaison physique ou au timing.

## Causes courantes

- **Bruit.** Câble non blindé posé à côté de câbles de puissance ou de variateurs. Utilisez une paire torsadée blindée, avec le blindage relié à la terre à une seule extrémité.
- **Terminaison manquante ou en trop.** Une résistance de 120 Ω à chaque extrémité du bus ; aucune entre les deux.
- **Pas de polarisation (bias).** Un bus au repos sans résistances de polarisation flotte, et les premiers octets d’une trame peuvent être mal lus. Beaucoup de convertisseurs et de maîtres ont une option de polarisation.
- **Dérivations et câblage en étoile.** Le RS-485 veut une seule ligne de périphérique en périphérique, pas des branches.
- **Débit légèrement décalé** sur des convertisseurs bon marché ou à haut débit. Essayez un débit plus faible.
- **Trames qui fusionnent.** Si le maître envoie la requête suivante avant que le bus soit resté silencieux 3,5 temps de caractère, les périphériques voient une longue trame brisée. Augmentez le délai entre les requêtes.
- **Deux maîtres**, ou un périphérique qui répond à la même adresse qu’un autre.

<mb-crc></mb-crc>

## Étapes

1. Baissez le débit et regardez si les erreurs cessent.
2. Testez avec un seul périphérique et un câble court. Si cela fonctionne, le problème vient du bus, pas du périphérique.
3. Vérifiez la terminaison hors tension : la résistance entre A et B doit être d’environ 60 Ω avec les deux terminaisons en place.
4. Ajoutez la polarisation si le maître ou le convertisseur la propose.
5. Augmentez l’intervalle d’interrogation et le délai d’attente.

Une erreur CRC occasionnelle sur un long bus industriel est normale ; un outil devrait réessayer. Des erreurs sur la plupart des trames, non.
