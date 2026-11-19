import SignPiece from './SignPiece.js';
import SkillsPiece from './SkillsPiece.js';
import ExpertisePiece from './ExpertisePiece.js';
import WerkplezierPiece from './WerkplezierPiece.js';

// Welk set piece hoort bij welk CV-onderdeel. Niet genoemd = standaardbord.
const PIECES = { expertise: ExpertisePiece, skills: SkillsPiece, werkplezier: WerkplezierPiece };

export function createPiece(scene, x, groundY, station, theme) {
  const Piece = PIECES[station.type] ?? SignPiece;
  return new Piece(scene, x, groundY, station, theme);
}
