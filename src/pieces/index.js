import SignPiece from './SignPiece.js';
import IntroPiece from './IntroPiece.js';
import ExpertisePiece from './ExpertisePiece.js';
import SkillsPiece from './SkillsPiece.js';
import EducationPiece from './EducationPiece.js';
import ReleasePiece from './ReleasePiece.js';
import CampfirePiece from './CampfirePiece.js';

// Welk set piece hoort bij welk CV-onderdeel. Niet genoemd = standaardbord (fallback).
const PIECES = {
  profiel: IntroPiece,
  expertise: ExpertisePiece,
  skills: SkillsPiece,
  opleiding: EducationPiece,
  werk: ReleasePiece,
  finale: CampfirePiece
};

export const widthOf = (station) => (PIECES[station.type]?.width?.(station) ?? 200);

export function createPiece(scene, x, groundY, station, theme, index) {
  const Piece = PIECES[station.type] ?? SignPiece;
  const piece = new Piece(scene, x, groundY, station, theme, index);
  piece.stopX ??= x - 100;
  piece.halfWidth = widthOf(station) / 2;
  return piece;
}

/** Optionele extra's achter een sprong: aanvullend, nooit nodig voor de kern van het CV. */
export function bonusFor(station, cv) {
  if (station.type === 'profiel' && cv.kernwoorden?.length) return { titel: 'Kernwoorden', items: cv.kernwoorden };
  if (station.type === 'opleiding' && cv.conferenties?.length) return { titel: 'Bezochte conferenties', items: cv.conferenties };
  if (station.type === 'finale' && cv.hobbys?.length) return { titel: 'Hobby\'s', items: cv.hobbys };
  return null;
}
