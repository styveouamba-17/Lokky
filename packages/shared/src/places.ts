import type { NeighborhoodId } from './constants';

// Lieux populaires de Dakar proposés à la création d'une activité (étape « Où ? »).
// Sans service de géocodage en v1 : un lieu choisi ici donne des coordonnées précises,
// un lieu saisi librement prend celles de son quartier.
export interface PopularPlace {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  neighborhood: NeighborhoodId;
}

export const POPULAR_PLACES: readonly PopularPlace[] = [
  {
    id: 'corniche-ouest',
    name: 'Corniche Ouest',
    coordinates: { lat: 14.693, lng: -17.475 },
    neighborhood: 'fann',
  },
  {
    id: 'plage-ngor',
    name: 'Plage de Ngor',
    coordinates: { lat: 14.7535, lng: -17.516 },
    neighborhood: 'ngor',
  },
  {
    id: 'plage-yoff',
    name: 'Plage de Yoff',
    coordinates: { lat: 14.758, lng: -17.473 },
    neighborhood: 'yoff',
  },
  {
    id: 'phare-mamelles',
    name: 'Phare des Mamelles',
    coordinates: { lat: 14.724, lng: -17.504 },
    neighborhood: 'ouakam',
  },
  {
    id: 'ucad-bu',
    name: 'Bibliothèque universitaire de l’UCAD',
    coordinates: { lat: 14.6925, lng: -17.4625 },
    neighborhood: 'fann',
  },
  {
    id: 'institut-francais',
    name: 'Institut français de Dakar',
    coordinates: { lat: 14.667, lng: -17.435 },
    neighborhood: 'plateau',
  },
  {
    id: 'marche-kermel',
    name: 'Marché Kermel',
    coordinates: { lat: 14.6675, lng: -17.43 },
    neighborhood: 'plateau',
  },
  {
    id: 'embarcadere-goree',
    name: 'Embarcadère de Gorée',
    coordinates: { lat: 14.673, lng: -17.428 },
    neighborhood: 'plateau',
  },
  {
    id: 'monument-renaissance',
    name: 'Monument de la Renaissance africaine',
    coordinates: { lat: 14.722, lng: -17.495 },
    neighborhood: 'ouakam',
  },
  {
    id: 'point-e',
    name: 'Point E',
    coordinates: { lat: 14.696, lng: -17.457 },
    neighborhood: 'point-e',
  },
];
