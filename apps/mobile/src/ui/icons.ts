import type { ComponentType } from 'react';

// Icônes Phosphor (spec §4.2). Les composants reçoivent l'icône elle-même et la colorent
// selon leur état : jamais d'emoji dans l'interface.
export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
export type IconComponent = ComponentType<{ size?: number; color?: string; weight?: IconWeight }>;
