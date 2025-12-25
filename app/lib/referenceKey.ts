export type Band = { min: number; max: number; name: string; description: string };

const serve = {
  consistency: [
    { min: 0, max: 6, name: "Unstable", description: "Cannot initiate points reliably; toss, contact, and outcome vary rep to rep" },
    { min: 7, max: 12, name: "Conditional", description: "Can start points in low-stress situations; reliability collapses under pressure or fatigue" },
    { min: 13, max: 18, name: "Functional", description: "Starts points consistently vs peers; misses increase under pressure but motion remains intact" },
    { min: 19, max: 24, name: "Competitive", description: "Second serve is trusted in matches; double faults are rare and contextual" },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Serve reliability holds under fatigue, tactics, and match momentum swings" },
    { min: 31, max: 100, name: "Tour Reference", description: "Serve reliability is assumed; differentiation comes from disguise, variation, and intent" },
  ],
  power: [
    { min: 0, max: 6, name: "Unstable", description: "Power attempts cause breakdowns in toss, timing, or contact" },
    { min: 7, max: 12, name: "Conditional", description: "Can add pace sporadically; power is not repeatable or controllable" },
    { min: 13, max: 18, name: "Functional", description: "Adds pace intentionally with acceptable risk when conditions are favorable" },
    { min: 19, max: 24, name: "Competitive", description: "Power holds up in matches without increasing error rate" },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Power is scaled deliberately based on score, opponent, and serve type" },
    { min: 31, max: 100, name: "Tour Reference", description: "Serve power is weaponized while preserving accuracy and reliability" },
  ],
  accuracy: [
    { min: 0, max: 6, name: "Unstable", description: "Targeting intent is unclear; placement varies wildly" },
    { min: 7, max: 12, name: "Conditional", description: "Can aim to general areas but misses specific locations" },
    { min: 13, max: 18, name: "Functional", description: "Hits intended targets in practice; partial transfer to match play" },
    { min: 19, max: 24, name: "Competitive", description: "Serve locations hold up in competitive match conditions" },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Moves targets intentionally without mechanical breakdown" },
    { min: 31, max: 100, name: "Tour Reference", description: "Serve placement is used tactically and instinctively" },
  ],
  spin: [
    { min: 0, max: 6, name: "Unstable", description: "Spin production is accidental or misunderstood" },
    { min: 7, max: 12, name: "Conditional", description: "Can create spin but cannot regulate or repeat it" },
    { min: 13, max: 18, name: "Functional", description: "Spin type is intentional, though execution varies under pressure" },
    { min: 19, max: 24, name: "Competitive", description: "Spin supports margin, safety, and serve patterns" },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Spin is adjusted deliberately to shape outcomes" },
    { min: 31, max: 100, name: "Tour Reference", description: "Spin disguises intent and manipulates returner positioning" },
  ],
  technique: [
    { min: 0, max: 6, name: "Unstable", description: "Serve motion varies significantly between repetitions" },
    { min: 7, max: 12, name: "Conditional", description: "Motion holds in drills but degrades under stress or fatigue" },
    { min: 13, max: 18, name: "Functional", description: "Motion is repeatable across sessions and environments" },
    { min: 19, max: 24, name: "Competitive", description: "Technique remains intact under match pressure" },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Technique holds even when tactically manipulated" },
    { min: 31, max: 100, name: "Tour Reference", description: "Technique is fully integrated and invisible in execution" },
  ],
};

const commonBands = {
  consistency: [
    { min: 0, max: 6, name: "Unstable", description: "Frequent errors caused by inconsistent contact, timing, or balance" },
    { min: 7, max: 12, name: "Conditional", description: "Reliable in controlled settings; breaks down under pace or movement" },
    { min: 13, max: 18, name: "Functional", description: "Sustains rallies vs peers with predictable miss patterns" },
    { min: 19, max: 24, name: "Competitive", description: "Shot reliability holds in match play and under pressure" },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Maintains consistency under pace, movement, and fatigue" },
    { min: 31, max: 100, name: "Tour Reference", description: "Consistency is assumed; outcomes driven by intent" },
  ],
  power: [
    { min: 0, max: 6, name: "Unstable", description: "Power attempts disrupt balance and contact quality" },
    { min: 7, max: 12, name: "Conditional", description: "Can add pace occasionally but not on demand" },
    { min: 13, max: 18, name: "Functional", description: "Adds pace intentionally on readable or short balls" },
    { min: 19, max: 24, name: "Competitive", description: "Power translates effectively into match play" },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Power is scaled based on situation and opponent" },
    { min: 31, max: 100, name: "Tour Reference", description: "Power consistently creates advantage" },
  ],
  accuracy: [
    { min: 0, max: 6, name: "Unstable", description: "Shot placement lacks clear intent or control" },
    { min: 7, max: 12, name: "Conditional", description: "Can hit broad zones but misses precise locations" },
    { min: 13, max: 18, name: "Functional", description: "Hits intended zones when balanced and prepared" },
    { min: 19, max: 24, name: "Competitive", description: "Placement holds under match pressure" },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Uses placement tactically to open space" },
    { min: 31, max: 100, name: "Tour Reference", description: "Placement consistently manipulates opponent positioning" },
  ],
  spin: [
    { min: 0, max: 6, name: "Unstable", description: "Spin production is unreliable or absent" },
    { min: 7, max: 12, name: "Conditional", description: "Can generate spin but not regulate depth or shape" },
    { min: 13, max: 18, name: "Functional", description: "Uses spin to manage pace and depth" },
    { min: 19, max: 24, name: "Competitive", description: "Spin supports both neutralization and offense" },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Varies spin intentionally to shape patterns" },
    { min: 31, max: 100, name: "Tour Reference", description: "Spin disguises intent and controls exchanges" },
  ],
  technique: [
    { min: 0, max: 6, name: "Unstable", description: "Mechanical execution varies significantly between reps" },
    { min: 7, max: 12, name: "Conditional", description: "Technique holds until rushed or pressured" },
    { min: 13, max: 18, name: "Functional", description: "Mechanics are repeatable across sessions" },
    { min: 19, max: 24, name: "Competitive", description: "Technique holds under match stress" },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Technique remains stable under tactical stress" },
    { min: 31, max: 100, name: "Tour Reference", description: "Technique is fully automated and invisible" },
  ],
};

const referenceKey: Record<string, Record<string, Band[]>> = {
  serve,
  // Return uses most common bands but return consistency has return-specific descriptions
  return: {
    consistency: [
      { min: 0, max: 6, name: "Unstable", description: "Frequent errors caused by inconsistent contact, timing, or balance" },
      { min: 7, max: 12, name: "Conditional", description: "Reliable in controlled settings; breaks down under pace or movement" },
      { min: 13, max: 18, name: "Functional", description: "Consistently gets returns in play vs peers; depth and direction vary under pressure" },
      { min: 19, max: 24, name: "Competitive", description: "Return reliability holds in match play and under pressure" },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Maintains consistency under pace, movement, and fatigue" },
      { min: 31, max: 100, name: "Tour Reference", description: "Consistency is assumed; outcomes driven by intent" },
    ],
    power: commonBands.power,
    accuracy: commonBands.accuracy,
    spin: commonBands.spin,
    technique: commonBands.technique,
  },
  forehand: commonBands,
  backhand: commonBands,
  volley: {
    consistency: [
      { min: 0, max: 6, name: "Unstable", description: "Frequent errors caused by inconsistent contact, timing, or balance" },
      { min: 7, max: 12, name: "Conditional", description: "Reliable in controlled settings; breaks down under pace or movement" },
      { min: 13, max: 18, name: "Functional", description: "Executes volleys reliably; shot outcomes are dependable with predictable miss patterns" },
      { min: 19, max: 24, name: "Competitive", description: "Shot reliability holds in match play and under pressure" },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Maintains consistency under pace, movement, and fatigue" },
      { min: 31, max: 100, name: "Tour Reference", description: "Consistency is assumed; outcomes driven by intent" },
    ],
    power: commonBands.power,
    accuracy: commonBands.accuracy,
    spin: commonBands.spin,
    technique: commonBands.technique,
  },
  overhead: {
    consistency: [
      { min: 0, max: 6, name: "Unstable", description: "Frequent errors caused by inconsistent contact, timing, or balance" },
      { min: 7, max: 12, name: "Conditional", description: "Reliable in controlled settings; breaks down under pace or movement" },
      { min: 13, max: 18, name: "Functional", description: "Executes overheads reliably; shot outcomes are dependable with predictable miss patterns" },
      { min: 19, max: 24, name: "Competitive", description: "Shot reliability holds in match play and under pressure" },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Maintains consistency under pace, movement, and fatigue" },
      { min: 31, max: 100, name: "Tour Reference", description: "Consistency is assumed; outcomes driven by intent" },
    ],
    power: commonBands.power,
    accuracy: commonBands.accuracy,
    spin: commonBands.spin,
    technique: commonBands.technique,
  },
  movement: {
    technique: [
      { min: 0, max: 6, name: "Unstable", description: "Arrives late or off-balance, compromising stroke execution" },
      { min: 7, max: 12, name: "Conditional", description: "Can reach the ball but recovery and balance are inconsistent" },
      { min: 13, max: 18, name: "Functional", description: "Arrives on time vs peers with generally adequate balance" },
      { min: 19, max: 24, name: "Competitive", description: "Consistently well positioned and supports stroke quality" },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Arrives early, balanced, and prepared for adjustments" },
      { min: 31, max: 100, name: "Tour Reference", description: "Movement is automatic; differentiation comes from anticipation and efficiency" },
    ],
  },
};

export function normalizeKey(s: string) {
  return String(s || "").trim().toLowerCase();
}

export function getBand(skill: string, component: string, value: number) {
  const sk = normalizeKey(skill);
  const comp = normalizeKey(component);
  const skillEntry = (referenceKey as any)[sk] || (referenceKey as any)[sk.replace(/\s+/g, '')];
  if (!skillEntry) return { name: 'Unknown', description: '' };
  const compMap: Record<string, string> = { c: 'consistency', p: 'power', a: 'accuracy', s: 'spin', t: 'technique' };
  const canonicalComp = compMap[comp] || comp;
  const bands = (skillEntry as any)[comp] || (skillEntry as any)[canonicalComp];
  if (!bands || !Array.isArray(bands)) return { name: 'Unknown', description: '' };
  const v = Number(value);
  for (const b of bands) {
    if (v >= b.min && v <= b.max) return { name: b.name, description: b.description };
  }
  return { name: 'Unknown', description: '' };
}

export default referenceKey;

