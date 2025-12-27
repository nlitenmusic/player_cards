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
    { min: 0, max: 6, name: "Unstable", description: "Toss, leg drive, and contact timing are inconsistent; motion is inefficient and recovery is slow." },
    { min: 7, max: 12, name: "Conditional", description: "Toss quality and weight transfer are uneven; serve mechanics hold in practice but fail under pressure, reducing efficiency." },
    { min: 13, max: 18, name: "Functional", description: "Repeatable toss and coordinated leg drive produce consistent contact; pronation and follow-through are efficient enough for reliable serves." },
    { min: 19, max: 24, name: "Competitive", description: "Precise toss, effective leg drive, and coordinated kinetic chain deliver consistent serves under match pressure with minimal wasted motion." },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Toss precision, explosive but controlled leg drive, and optimized pronation/uncoil produce powerful yet economical serves with quick recovery." },
    { min: 31, max: 100, name: "Tour Reference", description: "Toss, leg drive, timing, and wrist/pronation are finely tuned; serves are maximally efficient, repeatable, and weaponized." },
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
    { min: 0, max: 6, name: "Unstable", description: "Mechanical execution varies significantly between reps; often inefficient and wasteful of energy." },
    { min: 7, max: 12, name: "Conditional", description: "Technique holds until rushed or pressured; efficiency is inconsistent and effort may spike." },
    { min: 13, max: 18, name: "Functional", description: "Mechanics are repeatable across sessions and performed with reasonable efficiency." },
    { min: 19, max: 24, name: "Competitive", description: "Technique holds under match stress and is delivered with efficient energy use." },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Technique remains stable under tactical stress and is economical in movement and effort." },
    { min: 31, max: 100, name: "Tour Reference", description: "Technique is fully automated and invisible, maximizing efficiency and economy." },
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
  forehand: {
    ...commonBands,
    technique: [
      { min: 0, max: 6, name: "Unstable", description: "Preparation and weight transfer are inconsistent; swings are long and wasteful, reducing power and recovery." },
      { min: 7, max: 12, name: "Conditional", description: "Preparation is sometimes adequate but breaks under pressure; weight transfer and timing can be inefficient." },
      { min: 13, max: 18, name: "Functional", description: "Prepares early with solid weight transfer and efficient follow-through, enabling consistent recovery." },
      { min: 19, max: 24, name: "Competitive", description: "Compact preparation, reliable weight transfer, and efficient footwork allow sustained aggression without wasted motion." },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Maximizes kinetic chain use with minimal excess movement; adjusts swing length for control and efficiency." },
      { min: 31, max: 100, name: "Tour Reference", description: "Swing timing, energy use, and recovery are optimized; movement and stroke are economical and effortless." },
    ],
  },
  backhand: {
    ...commonBands,
    technique: [
      { min: 0, max: 6, name: "Unstable", description: "Swing mechanics and grip changes are inconsistent; motion is inefficient and recovery is slow." },
      { min: 7, max: 12, name: "Conditional", description: "Mechanics hold in controlled settings but efficiency degrades under pressure or when stretched." },
      { min: 13, max: 18, name: "Functional", description: "Mechanics are repeatable and use efficient core and arm sequencing for reliable recovery." },
      { min: 19, max: 24, name: "Competitive", description: "Compact preparation, strong core engagement, and efficient footwork support consistent, economical execution." },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Optimizes kinetic chain and minimal unnecessary movement; adapts grip and swing length efficiently." },
      { min: 31, max: 100, name: "Tour Reference", description: "Backhand is delivered with precise timing, efficiency, and effortless recovery under pressure." },
    ],
  },
  volley: {
    consistency: [
      { min: 0, max: 6, name: "Unstable", description: "Frequent errors caused by inconsistent contact, timing, or balance" },
      { min: 7, max: 12, name: "Conditional", description: "Reliable in controlled settings; breaks down under pace or movement" },
      { min: 13, max: 18, name: "Functional", description: "Executes volleys reliably; shot outcomes are dependable with predictable miss patterns" },
      { min: 19, max: 24, name: "Competitive", description: "Shot reliability holds in match play and under pressure" },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Maintains consistency under pace, movement, and fatigue" },
      { min: 31, max: 100, name: "Tour Reference", description: "Consistency is assumed; outcomes driven by intent" },
    ],
    power: [
      { min: 0, max: 6, name: "Unstable", description: "Power attempts disrupt balance and contact quality; swinging for pace often causes errors on volleys." },
      { min: 7, max: 12, name: "Conditional", description: "Can add pace occasionally but not on demand; timing and compactness are inconsistent." },
      { min: 13, max: 18, name: "Functional", description: "Adds compact punch on short or readable balls to finish points or force weak replies." },
      { min: 19, max: 24, name: "Competitive", description: "Uses controlled acceleration and placement so volley pace translates into match play advantage." },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Scales punch by situation and opponent, mixing soft and firm touches to finish or create openings." },
      { min: 31, max: 100, name: "Tour Reference", description: "Volley pace is leveraged precisely to create openings and finish points without sacrificing control." },
    ],
    accuracy: commonBands.accuracy,
    spin: [
      { min: 0, max: 6, name: "Unstable", description: "Spin production is accidental; contact is floaty or unstable." },
      { min: 7, max: 12, name: "Conditional", description: "Can apply spin inconsistently; depth and shape often break down." },
      { min: 13, max: 18, name: "Functional", description: "Uses spin to manage pace and depth; volleys stay controlled under moderate pressure." },
      { min: 19, max: 24, name: "Competitive", description: "Redirects spin intentionally to neutralize or apply pressure; reliable touch in exchanges." },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Varies spin with intent to shape angles, depth, and pace; disguises soft vs firm touch." },
      { min: 31, max: 100, name: "Tour Reference", description: "Elite spin control; uses disguise and redirection to command exchanges under pressure." },
    ],
    technique: [
      { min: 0, max: 6, name: "Unstable", description: "Platform and hand control are inconsistent; volleys lack compactness and are energy-inefficient." },
      { min: 7, max: 12, name: "Conditional", description: "Can execute simple volleys but timing and economy suffer under pressure or on the move." },
      { min: 13, max: 18, name: "Functional", description: "Uses a short punch, maintains balance, and recovers with reasonable efficiency." },
      { min: 19, max: 24, name: "Competitive", description: "Compact backswing, stable platform, and economical footwork produce reliable, low-effort volleys." },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Varies contact and minimal backswing to control pace and angles while conserving energy." },
      { min: 31, max: 100, name: "Tour Reference", description: "Volleys are executed with precise economy of motion, exceptional hand control, and immediate recovery." },
    ],
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
    technique: [
      { min: 0, max: 6, name: "Unstable", description: "Footwork and setup are inconsistent; the motion is long and energy-intensive." },
      { min: 7, max: 12, name: "Conditional", description: "Can complete overheads but setup and economy break down under pressure or when rushed." },
      { min: 13, max: 18, name: "Functional", description: "Sets up reliably with balanced footing and a compact swing that conserves energy." },
      { min: 19, max: 24, name: "Competitive", description: "Efficient positioning, compact backswing, and forward momentum allow powerful, economical overheads." },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Optimizes movement into contact and minimizes wasted motion while delivering authoritative overheads." },
      { min: 31, max: 100, name: "Tour Reference", description: "Overheads are executed with perfect setup, compact mechanics, and maximal efficiency under pressure." },
    ],
  },
  movement: {
    technique: [
      { min: 0, max: 6, name: "Unstable", description: "Slow or reactive movement; often arrives late or off-balance and cannot cover the court quickly or create proper spacing for shot execution." },
      { min: 7, max: 12, name: "Conditional", description: "Can reach many balls but movement speed, recovery, and spacing are inconsistent, reducing shot preparation quality." },
      { min: 13, max: 18, name: "Functional", description: "Covers the court adequately vs peers and typically arrives balanced with sufficient spacing to execute standard shots." },
      { min: 19, max: 24, name: "Competitive", description: "Moves with reliable speed and balance, consistently arriving in positions that enable high-quality shot execution and effective spacing." },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Anticipates and covers court proactively, arriving early with superior spacing to set up aggressive and varied shot options." },
      { min: 31, max: 100, name: "Tour Reference", description: "Movement is automatic: covers court efficiently, anticipates positioning, and consistently creates ideal spacing to maximize shot choice and execution." },
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

