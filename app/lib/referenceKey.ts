export type Band = { min: number; max: number; name: string; description: string; anchors?: string[] };

const serve = {
  consistency: [
    { min: 0, max: 6, name: "Unstable", description: "Cannot initiate points reliably; toss, contact, and outcome vary rep to rep", anchors: ["Toss/contact vary heavily", "Frequent double faults or shanks", "Cannot start points reliably"] },
    { min: 7, max: 12, name: "Conditional", description: "Can start points in low-stress situations; reliability collapses under pressure or fatigue", anchors: ["Works in warm-up or drills", "Breaks under match pressure", "Timing drifts under fatigue"] },
    { min: 13, max: 18, name: "Functional", description: "Starts points consistently vs peers; misses increase under pressure but motion remains intact", anchors: ["Consistent in practice", "Some misses under stress", "Motion stays mostly intact"] },
    { min: 19, max: 24, name: "Competitive", description: "Second serve is trusted in matches; double faults are rare and contextual", anchors: ["Second serve reliable", "Few double faults", "Serve holds up in matches"] },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Serve reliability holds under fatigue, tactics, and match momentum swings", anchors: ["Maintains under fatigue", "Adapts to opponent tactics", "High repeatability"] },
    { min: 31, max: 100, name: "Tour Reference", description: "Serve reliability is assumed; differentiation comes from disguise, variation, and intent", anchors: ["Mechanics automated", "Uses variation and disguise", "Elite level consistency"] },
  ],
  overall: [
    { min: 0, max: 6, name: "Unstable", description: "Major gaps across reliability, power, placement, spin, and technique; performance is inconsistent and error-prone.", anchors: ["Multiple failure points", "Low repeatability", "High error rate"] },
    { min: 7, max: 12, name: "Conditional", description: "Can execute basic serves in low-pressure situations but struggles to combine pace, placement, and repeatable mechanics under stress.", anchors: ["Performs in calm settings", "Breaks under stress", "Needs predictable conditions"] },
    { min: 13, max: 18, name: "Functional", description: "Delivers service reliably with usable pace and placement in practice; may lose effectiveness under match pressure but motion remains serviceable.", anchors: ["Reliable baseline serve", "Occasional mismatch in pressure", "Good mechanics in reps"] },
    { min: 19, max: 24, name: "Competitive", description: "Serve is dependable in matches: consistent toss and contact, controlled power, and placement that wins easy points or sets up patterns.", anchors: ["Holds serve in matches", "Controlled power and placement", "Tactical consistency"] },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Combines reliable mechanics, tactical power and placement, and purposeful spin to hold serve under fatigue and tactical pressure.", anchors: ["Adapts under fatigue", "Purposeful variation", "High tactical reliability"] },
    { min: 31, max: 100, name: "Tour Reference", description: "Elite serve: automated mechanics, disguise, purposeful variation, and consistent execution create a high-level weapon.", anchors: ["Automatic execution", "Elite disguise & intent", "Consistent weapon-level serve"] },
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
    { min: 0, max: 6, name: "Unstable", description: "Frequent errors caused by inconsistent contact, timing, or balance", anchors: ["Frequent unforced errors", "Poor timing", "Weak recovery"] },
    { min: 7, max: 12, name: "Conditional", description: "Reliable in controlled settings; breaks down under pace or movement", anchors: ["Works in drills/warm-ups", "Breaks under pace/movement", "Needs predictable feeds"] },
    { min: 13, max: 18, name: "Functional", description: "Sustains rallies vs peers with predictable miss patterns", anchors: ["Reliable in rallies", "Occasional lapses under stress", "Predictable miss patterns"] },
    { min: 19, max: 24, name: "Competitive", description: "Shot reliability holds in match play and under pressure", anchors: ["Performs in matches", "Handles pressure", "Tactical reliability"] },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Maintains consistency under pace, movement, and fatigue", anchors: ["Maintains under fatigue", "High repetition reliability", "Handles pace & movement"] },
    { min: 31, max: 100, name: "Tour Reference", description: "Consistency is assumed; outcomes driven by intent", anchors: ["Automatic execution", "Elite-level consistency", "Outcome driven by intent"] },
  ],
  power: [
    { min: 0, max: 6, name: "Unstable", description: "Power attempts disrupt balance and contact quality", anchors: ["Power breaks mechanics", "Uncontrolled pace", "Creates errors"] },
    { min: 7, max: 12, name: "Conditional", description: "Can add pace occasionally but not on demand", anchors: ["Occasional pace bursts", "Not repeatable", "Inconsistent control"] },
    { min: 13, max: 18, name: "Functional", description: "Adds pace intentionally on readable or short balls", anchors: ["Delivers pace when ready", "Manageable risk", "Repeatable in practice"] },
    { min: 19, max: 24, name: "Competitive", description: "Power translates effectively into match play", anchors: ["Works in matches", "Controlled aggression", "Sustains under pressure"] },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Power is scaled based on situation and opponent", anchors: ["Scales by opponent", "Tactical use of pace", "High repeatability"] },
    { min: 31, max: 100, name: "Tour Reference", description: "Power consistently creates advantage", anchors: ["Consistent weaponized pace", "Creates openings", "Elite-level impact"] },
  ],
  accuracy: [
    { min: 0, max: 6, name: "Unstable", description: "Shot placement lacks clear intent or control", anchors: ["No clear targeting", "High variability", "Poor direction control"] },
    { min: 7, max: 12, name: "Conditional", description: "Can hit broad zones but misses precise locations", anchors: ["Broad zones only", "Misses tight targets", "Needs set-up for precision"] },
    { min: 13, max: 18, name: "Functional", description: "Hits intended zones when balanced and prepared", anchors: ["Accurate when balanced", "Partial transfer to match", "Usable placement"] },
    { min: 19, max: 24, name: "Competitive", description: "Placement holds under match pressure", anchors: ["Performs in matches", "Targets under pressure", "Consistent placement"] },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Uses placement tactically to open space", anchors: ["Creates angles", "Tactical precision", "Consistent target execution"] },
    { min: 31, max: 100, name: "Tour Reference", description: "Placement consistently manipulates opponent positioning", anchors: ["Manipulates opponent", "Elite precision", "Instinctive targeting"] },
  ],
  spin: [
    { min: 0, max: 6, name: "Unstable", description: "Spin production is unreliable or absent", anchors: ["No reliable spin", "Contact errors", "Unintended trajectory"] },
    { min: 7, max: 12, name: "Conditional", description: "Can generate spin but not regulate depth or shape", anchors: ["Produces spin sporadically", "Depth inconsistent", "Shape varies"] },
    { min: 13, max: 18, name: "Functional", description: "Uses spin to manage pace and depth", anchors: ["Uses spin for margin", "Manageable depth", "Some shape control"] },
    { min: 19, max: 24, name: "Competitive", description: "Spin supports both neutralization and offense", anchors: ["Neutralizes pace", "Adds offensive shape", "Controlled spin use"] },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Varies spin intentionally to shape patterns", anchors: ["Varies spin intentionally", "Shapes patterns", "High control"] },
    { min: 31, max: 100, name: "Tour Reference", description: "Spin disguises intent and controls exchanges", anchors: ["Disguises intent", "Controls opponent movement", "Elite spin mastery"] },
  ],
  technique: [
    { min: 0, max: 6, name: "Unstable", description: "Mechanical execution varies significantly between reps; often inefficient and wasteful of energy.", anchors: ["Inconsistent mechanics", "High energy waste", "Poor sequencing"] },
    { min: 7, max: 12, name: "Conditional", description: "Technique holds until rushed or pressured; efficiency is inconsistent and effort may spike.", anchors: ["Works in calm settings", "Breaks when rushed", "Inefficient under stress"] },
    { min: 13, max: 18, name: "Functional", description: "Mechanics are repeatable across sessions and performed with reasonable efficiency.", anchors: ["Repeatable mechanics", "Reasonable efficiency", "Consistent sequencing"] },
    { min: 19, max: 24, name: "Competitive", description: "Technique holds under match stress and is delivered with efficient energy use.", anchors: ["Efficient under pressure", "Good sequencing", "Quick recovery"] },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Technique remains stable under tactical stress and is economical in movement and effort.", anchors: ["Economical movement", "Stable under tactics", "Optimized sequencing"] },
    { min: 31, max: 100, name: "Tour Reference", description: "Technique is fully automated and invisible, maximizing efficiency and economy.", anchors: ["Automatic technique", "Minimal waste", "Effortless execution"] },
  ],
};

import anchors from './anchorKey';

const referenceKey: Record<string, Record<string, Band[]>> = {
  serve,
  // Return uses most common bands but return consistency has return-specific descriptions
  return: {
    consistency: [
      { min: 0, max: 6, name: "Unstable", description: "Frequent errors caused by inconsistent contact, timing, or balance", anchors: ["Late to ball", "Weak contact", "Poor footwork"] },
      { min: 7, max: 12, name: "Conditional", description: "Reliable in controlled settings; breaks down under pace or movement", anchors: ["Works in calm returns", "Breaks under pace", "Needs predictable feed"] },
      { min: 13, max: 18, name: "Functional", description: "Consistently gets returns in play vs peers; depth and direction vary under pressure", anchors: ["Gets returns back","Depth varies under pressure","Can reset rallies"] },
      { min: 19, max: 24, name: "Competitive", description: "Return reliability holds in match play and under pressure", anchors: ["Neutralizes serve regularly","Maintains depth","Creates chances to attack"] },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Maintains consistency under pace, movement, and fatigue", anchors: ["Anticipates patterns","Consistent under pace","High-level reaction"] },
      { min: 31, max: 100, name: "Tour Reference", description: "Consistency is assumed; outcomes driven by intent", anchors: ["Elite anticipation","Automatic returns","Controls direction under pressure"] },
    ],
    power: commonBands.power,
    accuracy: commonBands.accuracy,
    spin: commonBands.spin,
    technique: commonBands.technique,
    overall: [
      { min: 0, max: 6, name: "Unstable", description: "Returns are erratic: weak footwork, poor timing and placement lead to lost opportunities and easy points for opponents.", anchors: ["Weak footwork","Missed contact","Gives easy points"] },
      { min: 7, max: 12, name: "Conditional", description: "Can produce playable returns in calm settings but lacks consistent depth, placement, or power under pressure.", anchors: ["Playable in calm settings","Struggles under pressure","Depth inconsistent"] },
      { min: 13, max: 18, name: "Functional", description: "Regularly gets returns back into play with workable depth and direction; return quality may vary in tense situations.", anchors: ["Gets returns in play","Works vs peers","Occasional misses under stress"] },
      { min: 19, max: 24, name: "Competitive", description: "Reliable returns in match play that neutralize many serves and create chances to initiate offense.", anchors: ["Neutralizes serve","Creates offense","Consistent depth"] },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Anticipates serve patterns, consistently returns with depth and intent, and often sets up tactical advantage.", anchors: ["Anticipates patterns","Targets placement","Creates tactical chances"] },
      { min: 31, max: 100, name: "Tour Reference", description: "Elite returner: reads serves, redirects pace and placement to seize control and generate immediate pressure on serve.", anchors: ["Reads serve instinctively","Redirects pace","Immediate pressure on serve"] },
    ],
  },
  forehand: {
    ...commonBands,
    overall: [
      { min: 0, max: 6, name: "Unstable", description: "Forehand mechanics and timing are inconsistent; power and placement are unreliable, producing frequent errors.", anchors: ["Poor timing","Weak footwork","Frequent errors"] },
      { min: 7, max: 12, name: "Conditional", description: "Can hit effective forehands in easy situations but struggles to maintain aggression and control under pressure.", anchors: ["Effective in calm drills","Struggles under pressure","Inconsistent aggression"] },
      { min: 13, max: 18, name: "Functional", description: "Forehand is a dependable rally tool with usable power and placement; effectiveness can vary in tight match moments.", anchors: ["Dependable rally shot","Usable power","Variable under stress"] },
      { min: 19, max: 24, name: "Competitive", description: "Delivers controlled aggression: consistent timing, tactical power and placement that win points in matches.", anchors: ["Tactical aggression","Consistent timing","Wins points"] },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Combines refined technique, directional control, and varied spin to create and finish attacking patterns.", anchors: ["Varied spin","Directional control","Finishes patterns"] },
      { min: 31, max: 100, name: "Tour Reference", description: "High-level weapon: explosive, accurate, and varied forehand that consistently defines rallies and produces winners.", anchors: ["Explosive & accurate","Defines rallies","Consistent winner"] },
    ],
    technique: [
      { min: 0, max: 6, name: "Unstable", description: "Preparation and weight transfer are inconsistent; swings are long and wasteful, reducing power and recovery.", anchors: ["Late preparation","Inefficient weight transfer","Long swing"] },
      { min: 7, max: 12, name: "Conditional", description: "Preparation is sometimes adequate but breaks under pressure; weight transfer and timing can be inefficient.", anchors: ["Inconsistent prep","Breaks under pressure","Timing issues"] },
      { min: 13, max: 18, name: "Functional", description: "Prepares early with solid weight transfer and efficient follow-through, enabling consistent recovery.", anchors: ["Early prep","Solid weight transfer","Efficient recovery"] },
      { min: 19, max: 24, name: "Competitive", description: "Compact preparation, reliable weight transfer, and efficient footwork allow sustained aggression without wasted motion.", anchors: ["Compact prep","Efficient footwork","Sustained aggression"] },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Maximizes kinetic chain use with minimal excess movement; adjusts swing length for control and efficiency.", anchors: ["Optimized kinetic chain","Minimal excess motion","Adjusts swing length"] },
      { min: 31, max: 100, name: "Tour Reference", description: "Swing timing, energy use, and recovery are optimized; movement and stroke are economical and effortless.", anchors: ["Optimized timing","Effortless recovery","Economical movement"] },
    ],
    
  },
  backhand: {
    ...commonBands,
    overall: [
      { min: 0, max: 6, name: "Unstable", description: "Backhand timing and preparation are erratic; defensive shots are weak and recovery is slow.", anchors: ["Erratic preparation","Weak defensive shots","Slow recovery"] },
      { min: 7, max: 12, name: "Conditional", description: "Executes usable backhands in calm situations but loses reliability and depth under pressure.", anchors: ["Works calm settings","Loses depth under pressure","Inconsistent offense"] },
      { min: 13, max: 18, name: "Functional", description: "Backhand is consistent for rallies with solid technique and occasional offensive options.", anchors: ["Consistent rally tool","Occasional offense","Reliable technique"] },
      { min: 19, max: 24, name: "Competitive", description: "Compact and reliable backhand that supports aggression and maintains depth under match conditions.", anchors: ["Compact & reliable","Supports aggression","Maintains depth"] },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Backhand offers tactical variety and dependable power or disguise when needed to finish or set up points.", anchors: ["Tactical variety","Dependable disguise","Finishes points"] },
      { min: 31, max: 100, name: "Tour Reference", description: "A refined, powerful, and precise backhand that operates as a consistent offensive and defensive tool at elite levels.", anchors: ["Refined & precise","Elite-level tool","Consistent winner"] },
    ],
    technique: [
      { min: 0, max: 6, name: "Unstable", description: "Swing mechanics are inconsistent; motion is inefficient and recovery is slow.", anchors: ["Inconsistent grips","Inefficient motion","Slow recovery"] },
      { min: 7, max: 12, name: "Conditional", description: "Mechanics hold in controlled settings but efficiency degrades under pressure or when stretched.", anchors: ["Holds in calm settings","Degrades under pressure","Efficiency drops when stretched"] },
      { min: 13, max: 18, name: "Functional", description: "Mechanics are repeatable and use efficient core and arm sequencing for reliable recovery.", anchors: ["Repeatable sequencing","Efficient core use","Reliable recovery"] },
      { min: 19, max: 24, name: "Competitive", description: "Compact preparation, strong core engagement, and efficient footwork support consistent, economical execution.", anchors: ["Compact prep","Strong core engagement","Economical execution"] },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Optimizes kinetic chain and minimal unnecessary movement; adapts grip and swing length efficiently.", anchors: ["Optimizes kinetic chain","Minimal excess motion","Adaptive grip/swing"] },
      { min: 31, max: 100, name: "Tour Reference", description: "Backhand is delivered with precise timing, efficiency, and effortless recovery under pressure.", anchors: ["Precise timing","Effortless recovery","Elite execution"] },
    ],
  },
  volley: {
    consistency: [
      { min: 0, max: 6, name: "Unstable", description: "Frequent errors caused by inconsistent contact, timing, or balance", anchors: ["Poor platform","Bad hand control","Frequent errors at net"] },
      { min: 7, max: 12, name: "Conditional", description: "Reliable in controlled settings; breaks down under pace or movement", anchors: ["Works stationary","Breaks when on the move","Timing issues"] },
      { min: 13, max: 18, name: "Functional", description: "Executes volleys reliably; shot outcomes are dependable with predictable miss patterns", anchors: ["Reliable at net","Predictable misses","Good touch"] },
      { min: 19, max: 24, name: "Competitive", description: "Shot reliability holds in match play and under pressure", anchors: ["Performs in matches","Finishes short points","Consistent placement"] },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Maintains consistency under pace, movement, and fatigue", anchors: ["Maintains under movement","High touch control","Consistent finishing"] },
      { min: 31, max: 100, name: "Tour Reference", description: "Consistency is assumed; outcomes driven by intent", anchors: ["Automatic net control","Elite touch & timing","Dominates net exchanges"] },
    ],
    power: [
      { min: 0, max: 6, name: "Unstable", description: "Power attempts disrupt balance and contact quality; swinging for pace often causes errors on volleys.", anchors: ["Swinging causes errors","Loss of platform","Poor contact"] },
      { min: 7, max: 12, name: "Conditional", description: "Can add pace occasionally but not on demand; timing and compactness are inconsistent.", anchors: ["Occasional punch","Not repeatable","Timing inconsistent"] },
      { min: 13, max: 18, name: "Functional", description: "Adds compact punch on short or readable balls to finish points or force weak replies.", anchors: ["Compact punch","Finishes short balls","Useful in transition"] },
      { min: 19, max: 24, name: "Competitive", description: "Uses controlled acceleration and placement so volley pace translates into match play advantage.", anchors: ["Controlled acceleration","Match-effective pace","Places with intent"] },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Scales punch by situation and opponent, mixing soft and firm touches to finish or create openings.", anchors: ["Scales punch","Mixes touch","High control"] },
      { min: 31, max: 100, name: "Tour Reference", description: "Volley pace is leveraged precisely to create openings and finish points without sacrificing control.", anchors: ["Precise pace control","Finishes reliably","Elite-level placement"] },
    ],
    accuracy: commonBands.accuracy,
    spin: [
      { min: 0, max: 6, name: "Unstable", description: "Spin production is accidental; contact is floaty or unstable.", anchors: ["Accidental spin","Floaty contact","Unstable touch"] },
      { min: 7, max: 12, name: "Conditional", description: "Can apply spin inconsistently; depth and shape often break down.", anchors: ["Inconsistent spin","Depth varies","Shape breaks down"] },
      { min: 13, max: 18, name: "Functional", description: "Uses spin to manage pace and depth; volleys stay controlled under moderate pressure.", anchors: ["Manages pace with spin","Controlled under moderate pressure","Predictable spin"] },
      { min: 19, max: 24, name: "Competitive", description: "Redirects spin intentionally to neutralize or apply pressure; reliable touch in exchanges.", anchors: ["Redirects spin","Neutralizes opponents","Reliable touch"] },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Varies spin with intent to shape angles, depth, and pace; disguises soft vs firm touch.", anchors: ["Varies spin intentionally","Shapes angles","Disguises contact"] },
      { min: 31, max: 100, name: "Tour Reference", description: "Elite spin control; uses disguise and redirection to command exchanges under pressure.", anchors: ["Elite spin control","Disguised intent","Commands exchanges"] },
    ],
    technique: [
      { min: 0, max: 6, name: "Unstable", description: "Platform and hand control are inconsistent; volleys lack compactness and are energy-inefficient.", anchors: ["Poor platform","Loose hand control","Energy-inefficient swings"] },
      { min: 7, max: 12, name: "Conditional", description: "Can execute simple volleys but timing and economy suffer under pressure or on the move.", anchors: ["Simple volleys only","Timing suffers when moving","Economy degrades under pressure"] },
      { min: 13, max: 18, name: "Functional", description: "Uses a short punch, maintains balance, and recovers with reasonable efficiency.", anchors: ["Short punch","Maintains balance","Reasonable recovery"] },
      { min: 19, max: 24, name: "Competitive", description: "Compact backswing, stable platform, and economical footwork produce reliable, low-effort volleys.", anchors: ["Compact backswing","Stable platform","Economical footwork"] },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Varies contact and minimal backswing to control pace and angles while conserving energy.", anchors: ["Varies contact","Minimal backswing","Conserves energy"] },
      { min: 31, max: 100, name: "Tour Reference", description: "Volleys are executed with precise economy of motion, exceptional hand control, and immediate recovery.", anchors: ["Precise economy","Exceptional hand control","Immediate recovery"] },
    ],
    overall: [
      { min: 0, max: 6, name: "Unstable", description: "Volley execution lacks compactness and touch; poor platform and timing cause frequent errors at the net.", anchors: ["Poor touch","Bad timing","Frequent net errors"] },
      { min: 7, max: 12, name: "Conditional", description: "Can execute simple volleys but timing and economy break down under pressure or on the move.", anchors: ["Simple volleys only","Timing/economy break down","Struggles when moving"] },
      { min: 13, max: 18, name: "Functional", description: "Reliable net play with reasonable touch and balance; can finish short points when positioned well.", anchors: ["Reasonable touch","Finishes short points","Balanced position"] },
      { min: 19, max: 24, name: "Competitive", description: "Compact, controlled volleys with consistent placement and the ability to finish or redirect pace in matches.", anchors: ["Consistent placement","Finishes/redirects pace","Compact control"] },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Varied touch and punch, precise placement, and economical motion enable consistent finishing at the net.", anchors: ["Varied touch","Precise placement","Consistent finishing"] },
      { min: 31, max: 100, name: "Tour Reference", description: "Exceptional volleying: instant control, perfect touch and timing, and the ability to dominate net exchanges.", anchors: ["Instant control","Perfect timing","Dominate net"] },
    ],
  },
  overhead: {
    consistency: [
      { min: 0, max: 6, name: "Unstable", description: "Frequent errors caused by inconsistent contact, timing, or balance", anchors: ["Late setup","Poor footwork","Mistimed contact"] },
      { min: 7, max: 12, name: "Conditional", description: "Reliable in controlled settings; breaks down under pace or movement", anchors: ["Works on routine overheads","Breaks under pace","Unstable on the move"] },
      { min: 13, max: 18, name: "Functional", description: "Executes overheads reliably; shot outcomes are dependable with predictable miss patterns", anchors: ["Reliable setup","Predictable misses","Good contact on set-ups"] },
      { min: 19, max: 24, name: "Competitive", description: "Shot reliability holds in match play and under pressure", anchors: ["Finishes lobs","Holds under pressure","Consistent contact"] },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Maintains consistency under pace, movement, and fatigue", anchors: ["Maintains on the run","High contact quality","Efficient recovery"] },
      { min: 31, max: 100, name: "Tour Reference", description: "Consistency is assumed; outcomes driven by intent", anchors: ["Automatic overhead setup","Elite finishing","Near-automatic execution"] },
    ],
    power: commonBands.power,
    accuracy: commonBands.accuracy,
    spin: commonBands.spin,
    technique: [
      { min: 0, max: 6, name: "Unstable", description: "Footwork and setup are inconsistent; the motion is long and energy-intensive.", anchors: ["Long motion","Poor setup","High energy cost"] },
      { min: 7, max: 12, name: "Conditional", description: "Can complete overheads but setup and economy break down under pressure or when rushed.", anchors: ["Completes when calm","Breaks when rushed","Inefficient under pressure"] },
      { min: 13, max: 18, name: "Functional", description: "Sets up reliably with balanced footing and a compact swing that conserves energy.", anchors: ["Balanced footwork","Compact swing","Conserves energy"] },
      { min: 19, max: 24, name: "Competitive", description: "Efficient positioning, compact backswing, and forward momentum allow powerful, economical overheads.", anchors: ["Efficient positioning","Compact backswing","Powerful & economical"] },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Optimizes movement into contact and minimizes wasted motion while delivering authoritative overheads.", anchors: ["Optimized movement","Minimal wasted motion","Authoritative contact"] },
      { min: 31, max: 100, name: "Tour Reference", description: "Overheads are executed with perfect setup, compact mechanics, and maximal efficiency under pressure.", anchors: ["Perfect setup","Compact mechanics","Maximal efficiency"] },
    ],
    overall: [
      { min: 0, max: 6, name: "Unstable", description: "Footwork and setup are inconsistent; overheads are often mistimed or error-prone." },
      { min: 7, max: 12, name: "Conditional", description: "Can complete overheads but setup and economy break down under pressure or when rushed." },
      { min: 13, max: 18, name: "Functional", description: "Reliable overheads with generally good setup and contact; effective in routine match situations." },
      { min: 19, max: 24, name: "Competitive", description: "Efficient positioning and compact swing deliver powerful, consistent overheads that finish points." },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Optimized setup and timing produce authoritative overheads with economy and high success under pressure." },
      { min: 31, max: 100, name: "Tour Reference", description: "Elite overheads: perfect setup, explosive but controlled contact, and near-automatic finishing capability." },
    ],
  },
  movement: {
      overall: [
        { min: 0, max: 6, name: "Unstable", description: "Reactive, slow, and often off-balance; movement limits shot preparation and recovery.", anchors: ["Late reactions","Off-balance arrivals","Poor recovery"] },
        { min: 7, max: 12, name: "Conditional", description: "Can reach balls but lacks consistent speed, recovery, and spacing; movement degrades under fatigue or pressure.", anchors: ["Reaches but slow","Recovery inconsistent","Degrades with fatigue"] },
        { min: 13, max: 18, name: "Functional", description: "Adequate court coverage and recovery for most rally situations; allows routine shot execution.", anchors: ["Adequate coverage","Balanced recovery","Routine execution"] },
        { min: 19, max: 24, name: "Competitive", description: "Reliable speed, balance, and recovery that supports high-quality shot preparation in match play.", anchors: ["Reliable speed","Consistent spacing","Good recovery"] },
        { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Proactive anticipation, efficient footwork, and consistent spacing that enable aggressive tactical choices.", anchors: ["Proactive anticipation","Efficient footwork","Enables aggression"] },
        { min: 31, max: 100, name: "Tour Reference", description: "Automatic, anticipatory movement that maximizes options and executes elite court coverage.", anchors: ["Anticipatory movement","Automatic coverage","Elite options"] },
      ],
    technique: [
      { min: 0, max: 6, name: "Unstable", description: "Slow or reactive movement; often arrives late or off-balance and cannot cover the court quickly or create proper spacing for shot execution.", anchors: ["Slow/reactive","Late arrival","Poor spacing"] },
      { min: 7, max: 12, name: "Conditional", description: "Can reach many balls but movement speed, recovery, and spacing are inconsistent, reducing shot preparation quality.", anchors: ["Reaches inconsistently","Recovery varies","Spacing inconsistent"] },
      { min: 13, max: 18, name: "Functional", description: "Covers the court adequately vs peers and typically arrives balanced with sufficient spacing to execute standard shots.", anchors: ["Adequate coverage","Balanced arrivals","Executes standard shots"] },
      { min: 19, max: 24, name: "Competitive", description: "Moves with reliable speed and balance, consistently arriving in positions that enable high-quality shot execution and effective spacing.", anchors: ["Reliable speed","Consistent balance","Good spacing"] },
      { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Anticipates and covers court proactively, arriving early with superior spacing to set up aggressive and varied shot options.", anchors: ["Proactive anticipation","Arrives early","Superior spacing"] },
      { min: 31, max: 100, name: "Tour Reference", description: "Movement is automatic: covers court efficiently, anticipates positioning, and consistently creates ideal spacing to maximize shot choice and execution.", anchors: ["Automatic movement","Perfect spacing","Elite anticipation"] },
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
  const vRaw = Number(value);
  const v = Number.isFinite(vRaw) ? vRaw : 0;
  // Use floored integer value for band matching so decimals map to their integer band
  const vLookup = Math.floor(Math.max(0, v));
  for (let i = 0; i < bands.length; i++) {
    const b = bands[i];
    if (vLookup >= b.min && vLookup <= b.max) {
      const skillAnchors = (anchors as any)[sk] || (anchors as any)[sk.replace(/\s+/g, '')] || {};
      const compAnchors = skillAnchors[canonicalComp] || skillAnchors[comp] || [];
      const foundAnchors = Array.isArray(compAnchors[i]) ? compAnchors[i] : (b as any).anchors || [];
      const mid = (b.max >= 100) ? 38 : Math.round((b.min + b.max) / 2);
      return { name: b.name, description: b.description, min: b.min, max: b.max, mid, anchors: foundAnchors };
    }
  }
  return { name: 'Unknown', description: '' };
}

export default referenceKey;

