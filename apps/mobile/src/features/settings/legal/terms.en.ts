import { LEGAL_CONTACT_EMAIL } from '@/lib/links';
import type { LegalDocument } from './types';

// English version of the draft terms of use (terms.fr.ts is the reference).
// To be reviewed by a lawyer before publishing on the stores.
export const TERMS_EN: LegalDocument = {
  title: 'Terms of use',
  updatedAt: 'Last updated: October 3, 2026',
  intro:
    'Welcome to Lokky! These terms explain the rules of the game: what Lokky offers, what you agree to respect, and what happens if something goes wrong. By creating an account, you accept them.',
  sections: [
    {
      title: '1. What Lokky is',
      blocks: [
        'Lokky is an app that helps people in Dakar meet up for peer-to-peer outings: football, movies, tea, study sessions, walks… Outings are created by the users themselves.',
        'Lokky does not organize outings and is not present at them. Lokky is a way to connect people, not a dating app.',
      ],
    },
    {
      title: '2. Your account',
      blocks: [
        [
          'You must be 18 or older.',
          'One account per person, under your real first name.',
          'Your profile information must be accurate. Your date of birth stays private.',
          'You are responsible for what happens with your account: keep access to your email, Apple or Google account safe.',
        ],
      ],
    },
    {
      title: '3. Outings',
      blocks: [
        'The creator of an outing states the place, time, number of spots and cost. Each participant comes of their own free will and remains responsible for themselves.',
        'An outing is free, or “everyone pays their share”. There are no payments in the app: Lokky is not involved in money arrangements between participants.',
        'You can leave an outing until it starts. The creator can cancel it; participants are then notified.',
      ],
    },
    {
      title: '4. Code of conduct',
      blocks: [
        'Lokky only works if everyone feels good on it. It is forbidden to:',
        [
          'harass, threaten, insult or discriminate against anyone;',
          'post sexual, violent or hateful content;',
          'impersonate someone else or create a fake profile;',
          'use Lokky to sell, advertise or send spam;',
          'propose an illegal or dangerous outing;',
          'share other people’s personal information without their consent.',
        ],
      ],
    },
    {
      title: '5. Your safety',
      blocks: [
        'A few habits to go out with peace of mind:',
        [
          'meet in public places;',
          'tell someone close where you are going;',
          'stay in control of your way back home;',
          'report any behavior that makes you uncomfortable.',
        ],
        'If you are in immediate danger, call 17 (police) or 18 (fire department).',
      ],
    },
    {
      title: '6. Private messages',
      blocks: [
        'You can message someone privately only after sharing an outing with them. You can block someone at any time: you will no longer see each other’s outings or be able to message each other.',
      ],
    },
    {
      title: '7. Reports and moderation',
      blocks: [
        'You can report a profile, an outing or a message. Reports are anonymous and reviewed by the Lokky team.',
        'Depending on the severity, Lokky may remove content, warn, temporarily suspend or permanently close an account, without notice when users’ safety requires it.',
      ],
    },
    {
      title: '8. Reviews and trust',
      blocks: [
        'After an outing, participants can rate its creator, and the creator states who came. This information feeds the trust statistics shown on profiles. Leave honest reviews and be fair when stating attendance.',
      ],
    },
    {
      title: '9. Your content',
      blocks: [
        'You remain the owner of what you post (photo, messages, outings). You allow Lokky to show it to other users, solely to run the service.',
      ],
    },
    {
      title: '10. Liability',
      blocks: [
        'Lokky does its best to keep the app working well and safe, but cannot guarantee how outings unfold or how participants behave. Within the limits set by law, Lokky is not liable for damage occurring during an outing.',
      ],
    },
    {
      title: '11. Deleting your account',
      blocks: [
        'You can delete your account at any time from Settings › Delete my account. Lokky may also close an account that does not respect these terms.',
      ],
    },
    {
      title: '12. Changes',
      blocks: [
        'These terms may change. In case of a significant change, you will be notified in the app before it applies.',
      ],
    },
    {
      title: '13. Governing law and contact',
      blocks: [
        'These terms are governed by Senegalese law. In case of dispute, we first look for an amicable solution; failing that, the courts of Dakar have jurisdiction.',
        `A question? Write to us at ${LEGAL_CONTACT_EMAIL}.`,
      ],
    },
  ],
};
