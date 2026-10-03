import { LEGAL_CONTACT_EMAIL } from '@/lib/links';
import type { LegalDocument } from './types';

// English version of the draft privacy policy (privacy.fr.ts is the reference).
// To be reviewed by a lawyer before publishing on the stores.
export const PRIVACY_EN: LegalDocument = {
  title: 'Privacy policy',
  updatedAt: 'Last updated: October 3, 2026',
  intro:
    'This page explains, simply, what data Lokky uses, why, who can see it and how you stay in control of it. Lokky does not sell your data and does not show ads.',
  sections: [
    {
      title: '1. Who is responsible',
      blocks: [
        `Lokky is responsible for the data processed in the app. For any question about your data: ${LEGAL_CONTACT_EMAIL}.`,
      ],
    },
    {
      title: '2. The data we use',
      blocks: [
        [
          'Account: your email address, or the identifier provided by Apple or Google if you sign in with them.',
          'Profile: your first name, your photo (optional), your date of birth, your situation (student, newcomer…), your neighborhood and your interests.',
          'Location: only while you use the app, and only if you allow it, to show outings near you and their distance. We do not keep a history of your movements. Without permission, the app uses your neighborhood.',
          'Activity: the outings you create or join, your messages, your reviews, the attendance stated by creators, your reports and your blocks.',
          'Technical data: your phone’s notification token, and diagnostic information if the app crashes (device model, app version).',
        ],
      ],
    },
    {
      title: '3. Why',
      blocks: [
        [
          'to run Lokky: suggest outings, let you join them and chat;',
          'to protect the community: check the minimum age, handle reports, apply blocks;',
          'to compute trust statistics (outings attended, attendance, creators’ ratings);',
          'to send you the notifications you have chosen;',
          'to fix bugs and improve the app.',
        ],
      ],
    },
    {
      title: '4. Who sees what',
      blocks: [
        [
          'Other users see your first name, photo, situation, neighborhood, interests, trust statistics and the outings you organize.',
          'Your date of birth and email are never visible.',
          'Group messages are visible to the group’s participants; a private message, to the two people only.',
          'Your reports remain anonymous to the person reported.',
          'Someone you block no longer sees your outings and can no longer message you.',
        ],
      ],
    },
    {
      title: '5. Who we share it with',
      blocks: [
        'Only with the technical providers the service needs (hosting, sending notifications, crash diagnostics), who may not use it for any other purpose. We may also be required to hand it over to the authorities upon a legal request, especially if someone is in danger.',
      ],
    },
    {
      title: '6. How long',
      blocks: [
        'Your data is kept as long as your account exists. When you delete it, it is erased within 30 days, except what the law requires us to keep longer or what is needed to handle a serious report.',
      ],
    },
    {
      title: '7. Your rights',
      blocks: [
        'Under Senegalese law No. 2008-12 of January 25, 2008 on the protection of personal data, you can:',
        [
          'access your data and get a copy;',
          'correct it (mostly directly from Settings › Edit my profile);',
          'have it deleted (Settings › Delete my account);',
          'object to certain uses, such as notifications.',
        ],
        `Write to us at ${LEGAL_CONTACT_EMAIL}. You can also file a complaint with Senegal’s Personal Data Protection Commission (CDP).`,
      ],
    },
    {
      title: '8. Security',
      blocks: [
        'Exchanges between the app and our servers are encrypted. On your phone, your sign-in tokens are stored in the system’s secure storage. No system is foolproof: if you think someone else has used your account, let us know.',
      ],
    },
    {
      title: '9. Under 18',
      blocks: [
        'Lokky is for people aged 18 and over. If we learn that an account belongs to someone younger, we close it.',
      ],
    },
    {
      title: '10. Changes',
      blocks: [
        'This policy may evolve with the app. In case of a significant change, you will be notified in the app.',
      ],
    },
  ],
};
