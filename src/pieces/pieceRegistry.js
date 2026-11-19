import { STATION_TYPES } from '../cv/stations.js';
import ExpertisePiece from './ExpertisePiece.js';
import SignPiece from './SignPiece.js';
import SkillsPiece from './SkillsPiece.js';
import WorkEnjoymentPiece from './WorkEnjoymentPiece.js';

// Welk set piece hoort bij welk stationtype. Niet genoemd = standaardbord (SignPiece).
const PIECES = {
  [STATION_TYPES.expertise]: ExpertisePiece,
  [STATION_TYPES.skills]: SkillsPiece,
  [STATION_TYPES.workEnjoyment]: WorkEnjoymentPiece
};

export function createPiece(scene, x, groundY, station, theme) {
  const largeBoard = (station.type === STATION_TYPES.skills || station.type === STATION_TYPES.expertise)
    && station.data.length > 8;
  const Piece = largeBoard ? SignPiece : (PIECES[station.type] ?? SignPiece);
  return new Piece(scene, x, groundY, station, theme);
}
