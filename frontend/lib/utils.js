export const MARKET_LABELS = {
  "1": "Home Win", "X": "Draw", "2": "Away Win",
  "1X": "Home/Draw", "12": "Home/Away", "X2": "Draw/Away",
  "O2.5": "Over 2.5", "U2.5": "Under 2.5",
  "BTTS_Y": "BTTS Yes", "BTTS_N": "BTTS No",
  "C_O9.5": "Corners O9.5", "C_U9.5": "Corners U9.5",
  "Y_O3.5": "Cards O3.5", "Y_U3.5": "Cards U3.5",
  "RED_Y": "Red Card Yes", "RED_N": "Red Card No",
};

export const getMarketLabel = (market, homeName, awayName) => {
  switch (market) {
    case "1": return `${homeName} to Win`;
    case "X": return "Draw";
    case "2": return `${awayName} to Win`;
    case "1X": return `${homeName} or Draw`;
    case "12": return `${homeName} or ${awayName}`;
    case "X2": return `Draw or ${awayName}`;
    default: return MARKET_LABELS[market] || market;
  }
};
