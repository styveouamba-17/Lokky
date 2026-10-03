import { LEGAL_CONTACT_EMAIL } from '@/lib/links';
import type { LegalDocument } from './types';

// Projet de conditions d'utilisation, rédigé d'après le fonctionnement réel de l'app.
// À faire relire par un juriste avant la publication sur les stores.
export const TERMS_FR: LegalDocument = {
  title: 'Conditions d’utilisation',
  updatedAt: 'Dernière mise à jour : 3 octobre 2026',
  intro:
    'Bienvenue sur Lokky ! Ces conditions expliquent les règles du jeu : ce que Lokky propose, ce que tu t’engages à respecter, et ce qui se passe si quelque chose ne va pas. En créant un compte, tu les acceptes.',
  sections: [
    {
      title: '1. Ce qu’est Lokky',
      blocks: [
        'Lokky est une application qui aide les gens à Dakar à se retrouver pour des sorties entre pairs : foot, ciné, thé, révisions, balades… Les sorties sont proposées par les utilisateurs eux-mêmes.',
        'Lokky n’organise pas les sorties et n’y est pas présent. Lokky est un outil de mise en relation, pas une application de rencontres amoureuses.',
      ],
    },
    {
      title: '2. Ton compte',
      blocks: [
        [
          'Tu dois avoir 18 ans ou plus.',
          'Un seul compte par personne, à ton vrai prénom.',
          'Les informations de ton profil doivent être exactes. Ta date de naissance reste privée.',
          'Tu es responsable de ce qui se passe avec ton compte : garde l’accès à ton email, à ton compte Apple ou Google.',
        ],
      ],
    },
    {
      title: '3. Les sorties',
      blocks: [
        'Le créateur d’une sortie en indique le lieu, l’heure, le nombre de places et le coût. Chaque participant vient de son plein gré et reste responsable de lui-même.',
        'Une sortie est gratuite, ou « chacun paie sa part ». Il n’y a aucun paiement dans l’app : Lokky n’intervient pas dans les arrangements d’argent entre participants.',
        'On peut quitter une sortie jusqu’à son début. Le créateur peut l’annuler ; les participants sont alors prévenus.',
      ],
    },
    {
      title: '4. Les règles de conduite',
      blocks: [
        'Lokky n’existe que si tout le monde s’y sent bien. Il est interdit :',
        [
          'de harceler, menacer, insulter ou discriminer quelqu’un ;',
          'de publier des contenus sexuels, violents ou haineux ;',
          'de se faire passer pour quelqu’un d’autre ou de créer un faux profil ;',
          'd’utiliser Lokky pour vendre, faire de la publicité ou envoyer du spam ;',
          'de proposer une sortie illégale ou dangereuse ;',
          'de partager les informations personnelles d’autrui sans son accord.',
        ],
      ],
    },
    {
      title: '5. Ta sécurité',
      blocks: [
        'Quelques réflexes pour sortir l’esprit tranquille :',
        [
          'retrouve-toi dans des lieux publics ;',
          'préviens un proche de l’endroit où tu vas ;',
          'garde le contrôle de ton trajet de retour ;',
          'signale tout comportement qui te met mal à l’aise.',
        ],
        'En cas de danger immédiat, appelle le 17 (police) ou le 18 (pompiers).',
      ],
    },
    {
      title: '6. Messages privés',
      blocks: [
        'Tu peux écrire en privé à quelqu’un seulement après avoir partagé une sortie avec cette personne. Tu peux bloquer quelqu’un à tout moment : vous ne verrez plus les sorties de l’autre et ne pourrez plus vous écrire.',
      ],
    },
    {
      title: '7. Signalements et modération',
      blocks: [
        'Tu peux signaler un profil, une sortie ou un message. Les signalements sont anonymes et examinés par l’équipe Lokky.',
        'Selon la gravité, Lokky peut retirer un contenu, avertir, suspendre temporairement ou fermer définitivement un compte, sans préavis lorsque la sécurité des utilisateurs l’exige.',
      ],
    },
    {
      title: '8. Avis et confiance',
      blocks: [
        'Après une sortie, les participants peuvent noter son créateur, et le créateur indique qui est venu. Ces informations servent les statistiques de confiance affichées sur les profils. Laisse des avis honnêtes et sois juste en indiquant la présence.',
      ],
    },
    {
      title: '9. Tes contenus',
      blocks: [
        'Tu restes propriétaire de ce que tu publies (photo, messages, sorties). Tu autorises Lokky à les afficher aux autres utilisateurs, uniquement pour faire fonctionner le service.',
      ],
    },
    {
      title: '10. Responsabilité',
      blocks: [
        'Lokky fait de son mieux pour que l’app fonctionne bien et reste sûre, mais ne peut pas garantir le déroulement des sorties ni le comportement des participants. Dans les limites prévues par la loi, Lokky n’est pas responsable des dommages qui surviennent pendant une sortie.',
      ],
    },
    {
      title: '11. Supprimer ton compte',
      blocks: [
        'Tu peux supprimer ton compte à tout moment depuis Réglages › Supprimer mon compte. Lokky peut aussi fermer un compte qui ne respecte pas ces conditions.',
      ],
    },
    {
      title: '12. Modifications',
      blocks: [
        'Ces conditions peuvent évoluer. En cas de changement important, tu seras prévenu·e dans l’app avant qu’il ne s’applique.',
      ],
    },
    {
      title: '13. Droit applicable et contact',
      blocks: [
        'Ces conditions sont régies par le droit sénégalais. En cas de litige, on cherche d’abord une solution à l’amiable ; à défaut, les tribunaux de Dakar sont compétents.',
        `Une question ? Écris-nous à ${LEGAL_CONTACT_EMAIL}.`,
      ],
    },
  ],
};
