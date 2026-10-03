import { LEGAL_CONTACT_EMAIL } from '@/lib/links';
import type { LegalDocument } from './types';

// Projet de politique de confidentialité, rédigé d'après les données réellement utilisées par
// l'app. À faire relire par un juriste avant la publication sur les stores.
export const PRIVACY_FR: LegalDocument = {
  title: 'Politique de confidentialité',
  updatedAt: 'Dernière mise à jour : 3 octobre 2026',
  intro:
    'Cette page explique, simplement, quelles données Lokky utilise, pourquoi, qui peut les voir et comment tu gardes la main dessus. Lokky ne vend pas tes données et n’affiche pas de publicité.',
  sections: [
    {
      title: '1. Qui est responsable',
      blocks: [
        `Lokky est responsable des données traitées dans l’application. Pour toute question sur tes données : ${LEGAL_CONTACT_EMAIL}.`,
      ],
    },
    {
      title: '2. Les données que nous utilisons',
      blocks: [
        [
          'Compte : ton adresse email, ou l’identifiant fourni par Apple ou Google si tu te connectes avec eux.',
          'Profil : ton prénom, ta photo (facultative), ta date de naissance, ta situation (étudiant·e, nouvel·le arrivant·e…), ton quartier et tes centres d’intérêt.',
          'Position : uniquement pendant que tu utilises l’app, et seulement si tu l’autorises, pour te montrer les sorties proches et leur distance. Nous ne gardons pas l’historique de tes déplacements. Sans autorisation, l’app se sert de ton quartier.',
          'Activité : les sorties que tu crées ou rejoins, tes messages, tes avis, la présence indiquée par les créateurs, tes signalements et tes blocages.',
          'Données techniques : le jeton de notification de ton téléphone, et des informations de diagnostic en cas de plantage (modèle d’appareil, version de l’app).',
        ],
      ],
    },
    {
      title: '3. Pourquoi',
      blocks: [
        [
          'faire fonctionner Lokky : te proposer des sorties, te permettre de les rejoindre et de discuter ;',
          'protéger la communauté : vérifier l’âge minimum, traiter les signalements, appliquer les blocages ;',
          'calculer les statistiques de confiance (sorties faites, présence, note des créateurs) ;',
          't’envoyer les notifications que tu as choisies ;',
          'corriger les bugs et améliorer l’app.',
        ],
      ],
    },
    {
      title: '4. Qui voit quoi',
      blocks: [
        [
          'Les autres utilisateurs voient ton prénom, ta photo, ta situation, ton quartier, tes centres d’intérêt, tes statistiques de confiance et les sorties que tu organises.',
          'Ta date de naissance et ton email ne sont jamais visibles.',
          'Les messages d’un groupe sont visibles par ses participants ; un message privé, par les deux personnes uniquement.',
          'Tes signalements restent anonymes pour la personne signalée.',
          'Une personne que tu bloques ne voit plus tes sorties et ne peut plus t’écrire.',
        ],
      ],
    },
    {
      title: '5. Avec qui nous les partageons',
      blocks: [
        'Seulement avec les prestataires techniques nécessaires au service (hébergement, envoi des notifications, diagnostic des plantages), qui n’ont pas le droit de les utiliser à d’autres fins. Nous pouvons aussi être tenus de les transmettre aux autorités sur demande légale, notamment en cas de danger pour une personne.',
      ],
    },
    {
      title: '6. Combien de temps',
      blocks: [
        'Tes données sont conservées tant que ton compte existe. Quand tu le supprimes, elles sont effacées dans un délai de 30 jours, sauf ce que la loi nous oblige à garder plus longtemps ou ce qui est nécessaire au traitement d’un signalement grave.',
      ],
    },
    {
      title: '7. Tes droits',
      blocks: [
        'Conformément à la loi sénégalaise n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel, tu peux :',
        [
          'accéder à tes données et en obtenir une copie ;',
          'les corriger (la plupart directement depuis Réglages › Modifier mon profil) ;',
          'les faire supprimer (Réglages › Supprimer mon compte) ;',
          't’opposer à certains usages, comme les notifications.',
        ],
        `Écris-nous à ${LEGAL_CONTACT_EMAIL}. Tu peux aussi adresser une réclamation à la Commission de Protection des Données Personnelles (CDP) du Sénégal.`,
      ],
    },
    {
      title: '8. Sécurité',
      blocks: [
        'Les échanges entre l’app et nos serveurs sont chiffrés. Sur ton téléphone, tes jetons de connexion sont rangés dans l’espace sécurisé du système. Aucun système n’est infaillible : si tu penses que ton compte a été utilisé par quelqu’un d’autre, préviens-nous.',
      ],
    },
    {
      title: '9. Moins de 18 ans',
      blocks: [
        'Lokky est réservé aux personnes de 18 ans et plus. Si nous apprenons qu’un compte appartient à une personne plus jeune, nous le fermons.',
      ],
    },
    {
      title: '10. Modifications',
      blocks: [
        'Cette politique peut évoluer avec l’app. En cas de changement important, tu seras prévenu·e dans l’app.',
      ],
    },
  ],
};
