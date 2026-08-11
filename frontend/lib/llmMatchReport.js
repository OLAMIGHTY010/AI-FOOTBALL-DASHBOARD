export const generateMatchReport = (homeTeam, awayTeam, homeScore, awayScore, matchEvents) => {
  const isDraw = homeScore === awayScore;
  const isHomeWin = homeScore > awayScore;
  const winner = isHomeWin ? homeTeam : isDraw ? "Nobody" : awayTeam;
  const loser = isHomeWin ? awayTeam : isDraw ? "Nobody" : homeTeam;
  const totalGoals = homeScore + awayScore;

  // 1. Generate Headline
  const headlines = [
    isDraw ? `Stalemate: ${homeTeam} and ${awayTeam} Share the Spoils` : `${winner} Secure Crucial ${homeScore}-${awayScore} Victory Over ${loser}`,
    isDraw ? `Nothing to Separate Them: ${homeTeam} ${homeScore}-${awayScore} ${awayTeam}` : `Masterclass: ${winner} Outclass ${loser} in Thriller`,
    totalGoals > 3 ? `Goal Fest! ${winner === "Nobody" ? 'An Epic Draw' : `${winner} Triumphs`} in ${homeScore}-${awayScore} Classic` : 
      (isDraw ? `Defenses Reign Supreme as ${homeTeam} and ${awayTeam} Draw` : `${winner} Grind Out a ${homeScore}-${awayScore} Win`),
    `${homeScore}-${awayScore}: The Story of ${homeTeam} vs ${awayTeam}`
  ];
  const headline = headlines[Math.floor(Math.random() * headlines.length)];

  // 2. Generate Lead Paragraph
  const leads = [
    `In a highly anticipated fixture, ${homeTeam} hosted ${awayTeam} in what promised to be a tactical battle. And the match delivered on its promises, concluding in a ${homeScore}-${awayScore} result that ${isDraw ? 'leaves both managers with mixed feelings.' : `sends ${winner} fans into jubilation.`}`,
    `The atmosphere was electric as ${homeTeam} clashed with ${awayTeam} today. The final whistle confirmed a ${homeScore}-${awayScore} ${isDraw ? 'draw' : `win for ${winner}`}, a result that will undoubtedly be analyzed closely in the days to come.`,
    `${totalGoals > 3 ? 'Spectators were treated to an absolute classic today.' : 'It was a cagey affair from the very first whistle.'} ${homeTeam} and ${awayTeam} battled fiercely, ultimately finishing ${homeScore}-${awayScore}.`
  ];
  const lead = leads[Math.floor(Math.random() * leads.length)];

  // 3. Generate Body (Parsing Events)
  let body = "";
  const goals = matchEvents.filter(e => e.type === "goal");
  const redCards = matchEvents.filter(e => e.type === "red_card");
  const yellowCards = matchEvents.filter(e => e.type === "yellow_card");

  if (goals.length === 0) {
    body += `Both teams struggled to find a breakthrough in the final third. Despite periods of sustained possession, neither ${homeTeam} nor ${awayTeam} could convert their chances into goals, leading to a gritty 0-0 affair. `;
  } else {
    body += `The scoring opened in spectacular fashion. `;
    if (goals.length > 2) {
      body += `The match quickly turned into an end-to-end spectacle with multiple goals keeping the fans on the edge of their seats. `;
    }
  }

  if (redCards.length > 0) {
    body += `A major turning point occurred when the referee produced a red card, dramatically altering the tactical landscape of the match. Playing with 10 men forced a complete reshuffle. `;
  }

  if (yellowCards.length > 4) {
    body += `The match was heavily disjointed by fouls, with the referee forced to go to his pocket multiple times to keep control of a very physical contest. `;
  }

  // Add some generic filler based on flow
  const bodyFillers = [
    `The midfield battle was heavily contested, with both sides trying to dictate the tempo. `,
    `Wide areas proved crucial as overlapping fullbacks created numerous headaches for the opposing defense. `,
    `Set pieces were a constant threat, though the final delivery often left much to be desired. `
  ];
  body += bodyFillers[Math.floor(Math.random() * bodyFillers.length)];

  // 4. Generate Conclusion
  const conclusions = [
    `Looking ahead, ${isDraw ? `both teams` : winner} will look to build on this performance, while ${isDraw ? 'they' : loser} must head back to the drawing board to address their shortcomings before the next gameweek.`,
    `This ${homeScore}-${awayScore} result serves as a stark reminder of the unpredictable nature of this league. As the managers head to the press conference, the narrative of the season continues to twist.`,
    `Ultimately, the final scoreline of ${homeScore}-${awayScore} reflects a match where ${isDraw ? 'neither side deserved to lose.' : `${winner} seized their key moments.`} The focus now shifts immediately to recovery and preparation for the next fixture.`
  ];
  const conclusion = conclusions[Math.floor(Math.random() * conclusions.length)];

  return {
    headline,
    paragraphs: [lead, body, conclusion],
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  };
};
