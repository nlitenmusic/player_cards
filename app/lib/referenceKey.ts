export type Band = { min: number; max: number; name: string; description: string; anchors?: string[] };

const serve = {
  consistency: [
    {
      min: 0,
      max: 6,
      name: "Unstable",
      description:
        "Serve routine produces unpredictable results. Toss location, contact height, and timing change from attempt to attempt, causing frequent missed serves or defensive first balls.",
      anchors: [
        "Toss lands in visibly different locations each serve",
        "Contact height or body alignment changes each attempt",
        "Player misses serves or produces obvious sitter returns regularly",
      ],
    },
    {
      min: 7,
      max: 12,
      name: "Conditional",
      description:
        "Serve routine repeats during slow or cooperative reps but loses structure when speed, scoring pressure, or fatigue increases.",
      anchors: [
        "Serve looks repeatable during warm-ups or basket feeding",
        "Serve rhythm noticeably speeds up or collapses during point play",
        "Toss or contact drifts after multiple serves or during tight scores",
      ],
    },
    {
      min: 13,
      max: 18,
      name: "Functional",
      description:
        "Serve routine repeats reliably in practice and most low-pressure match situations, though visible breakdowns appear during important points or extended service games.",
      anchors: [
        "Coach can predict serve shape from routine most of the time",
        "Player starts points successfully in most service attempts",
        "Breakdowns appear mainly during pressure moments",
      ],
    },
    {
      min: 19,
      max: 24,
      name: "Competitive",
      description:
        "Serve routine repeats under match pressure. Toss and contact are visually identical across attempts, producing dependable serve outcomes and low service error rates.",
      anchors: [
        "Serve motion looks nearly identical across multiple games",
        "Player maintains serve quality during pressure points",
        "Double faults or obvious mis-contacts are uncommon",
      ],
    },
    {
      min: 25,
      max: 30,
      name: "Advanced / Pro-Track",
      description:
        "Serve routine remains repeatable across long matches, fatigue, and tactical adjustments. Player maintains serve structure while intentionally varying serve types.",
      anchors: [
        "Serve routine remains stable deep into matches or long sessions",
        "Player changes serve type without visible mechanical breakdown",
        "Toss and rhythm remain consistent despite tactical changes",
      ],
    },
    {
      min: 31,
      max: 100,
      name: "Tour Reference",
      description:
        "Serve routine is fully automated. Player maintains identical preparation and contact across all serve types, using subtle variation to disguise intent while preserving reliability.",
      anchors: [
        "Different serve types originate from nearly identical routines",
        "Opponents cannot anticipate serve type from preparation",
        "Serve quality remains unchanged regardless of score or fatigue",
      ],
    },
  ],
  overall: [
    {
      min: 0,
      max: 6,
      name: "Unstable",
      description: "Multiple failures across toss, contact, and intent leave the serve ineffective and error-prone.",
      anchors: ["Multiple failure points", "Low repeatability", "High error rate"],
    },
    {
      min: 7,
      max: 12,
      name: "Conditional",
      description: "Can produce basic serves but cannot combine pace, placement and repeatability under realistic pressure.",
      anchors: ["Performs in calm settings", "Breaks under stress", "Needs predictable conditions"],
    },
    {
      min: 13,
      max: 18,
      name: "Functional",
      description: "A usable serve that starts points reliably and occasionally creates advantage; match transfer is inconsistent.",
      anchors: ["Reliable baseline serve", "Occasional mismatch in pressure", "Good mechanics in reps"],
    },
    {
      min: 19,
      max: 24,
      name: "Competitive",
      description: "Serve reliably wins simple points or sets up tactical patterns through controlled power and placement.",
      anchors: ["Holds serve in matches", "Controlled power and placement", "Tactical consistency"],
    },
    {
      min: 25,
      max: 30,
      name: "Advanced / Pro-Track",
      description: "Serve is a dependable offensive weapon that can be varied intentionally to create openings.",
      anchors: ["Adapts under fatigue", "Purposeful variation", "High tactical reliability"],
    },
    {
      min: 31,
      max: 100,
      name: "Tour Reference",
      description: "Serve execution, disguise and decision-making are elite; outcomes are driven by intent rather than luck.",
      anchors: ["Automatic execution", "Elite disguise & intent", "Consistent weapon-level serve"],
    },
  ],
  power: [
    { min: 0, max: 6, name: "Unstable", description: "Attempts at pace destroy balance or timing: racquet speed and contact point vary and produce errors rather than winners." },
    { min: 7, max: 12, name: "Conditional", description: "Generates occasional pace in controlled reps but cannot access it reliably in match play." },
    { min: 13, max: 18, name: "Functional", description: "Adds pace on readable balls; produces winners occasionally when set-up is favorable." },
    { min: 19, max: 24, name: "Competitive", description: "Power is available and controlled in matches, creating pressure without a spike in errors." },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Scales power deliberately by score and opponent while preserving placement and control." },
    { min: 31, max: 100, name: "Tour Reference", description: "Power routinely creates openings; pace is elite while accuracy and disguise are maintained." },
  ],
  accuracy: [
    { min: 0, max: 6, name: "Unstable", description: "Placement is inconsistent: the ball often lands far from intended targets and direction varies unpredictably." },
    { min: 7, max: 12, name: "Conditional", description: "Hits broad zones but cannot reliably place to tight targets under match pressure." },
    { min: 13, max: 18, name: "Functional", description: "Placement holds in balanced situations; player finds targets when set-up is correct." },
    { min: 19, max: 24, name: "Competitive", description: "Placement is reliable in matches and used to construct points." },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Placement is intentionally varied to create openings without mechanical breakdown." },
    { min: 31, max: 100, name: "Tour Reference", description: "Placement is instinctive and tactical: player consistently hits sub-zones to manipulate opponent positioning." },
  ],
  spin: [
    { min: 0, max: 6, name: "Unstable", description: "Spin is absent or accidental; contact does not impart consistent rotation and trajectory is unpredictable." },
    { min: 7, max: 12, name: "Conditional", description: "Produces spin in controlled reps but cannot regulate depth or shape reliably in live play." },
    { min: 13, max: 18, name: "Functional", description: "Uses spin intentionally to manage depth and margin, though execution can wobble under pressure." },
    { min: 19, max: 24, name: "Competitive", description: "Spin reliably shapes patterns and supports both neutral and offensive play in matches." },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Varies spin deliberately to manipulate opponent timing and depth without mechanical compromise." },
    { min: 31, max: 100, name: "Tour Reference", description: "Spin is disguised and consistent; used to control opponent positioning and hide intent." },
  ],
  technique: [
    { min: 0, max: 6, name: "Unstable", description: "Timing, sequencing or grip change serve-to-serve; motion is inefficient and recovery suffers." },
    { min: 7, max: 12, name: "Conditional", description: "Mechanics hold in calm reps but fail when rushed, on the move, or under pressure." },
    { min: 13, max: 18, name: "Functional", description: "Repeatable toss and coordinated leg drive produce consistent contact and acceptable recovery." },
    { min: 19, max: 24, name: "Competitive", description: "Precise toss, effective leg drive and coordinated kinetic chain deliver consistent serves under match pressure." },
    { min: 25, max: 30, name: "Advanced / Pro-Track", description: "Toss precision and efficient leg drive produce powerful, economical serves with quick recovery." },
    { min: 31, max: 100, name: "Tour Reference", description: "Mechanics are finely tuned and automated; serves are efficient, repeatable and weaponized." },
  ],
};

const commonBands = {
  consistency: [
    {
      min: 0,
      max: 6,
      name: "Unstable",
      description: "Routine produces unpredictable results: toss, contact and timing shift serve-to-serve, causing frequent missed serves or soft returns.",
      anchors: ["Toss/contact vary visibly", "Frequent missed serves or sitters", "Coach cannot predict serve outcome from setup"],
    },
    {
      min: 7,
      max: 12,
      name: "Conditional",
      description: "Routine repeats in calm reps but breaks under scoring pressure, pace, or fatigue.",
      anchors: ["Repeatable in warm-up or feeding", "Rhythm collapses in live points", "Toss/contact drift during pressure"],
    },
    {
      min: 13,
      max: 18,
      name: "Functional",
      description: "Routine repeats in practice and most match moments; visible breakdowns occur during high-pressure points or long service games.",
      anchors: ["Predictable serve shape most attempts", "Starts points reliably in routine play", "Breakdowns limited to pressure moments"],
    },
    {
      min: 19,
      max: 24,
      name: "Competitive",
      description: "Routine holds under match pressure: toss and contact are consistent and service errors are rare.",
      anchors: ["Motion nearly identical across games", "Maintains quality in pressure points", "Few double faults or mis-contacts"],
    },
    {
      min: 25,
      max: 30,
      name: "Advanced / Pro-Track",
      description: "Routine remains stable across long matches and tactical shifts; player varies serve type without mechanical breakdown.",
      anchors: ["Stable deep into sessions", "Changes serve type without visible loss of mechanics", "Consistent toss/rhythm under fatigue"],
    },
    {
      min: 31,
      max: 100,
      name: "Tour Reference",
      description: "Routine is automated: identical preparation across serve types, subtle variation for disguise, and consistent outcomes regardless of context.",
      anchors: ["Different serves originate from same routine", "Opponents cannot read serve type from setup", "Mechanical execution appears automatic"],
    },
  ],
  power: [
    {
      min: 0,
      max: 6,
      name: "Unstable",
      description: "Attempts at pace destroy balance or timing: racquet speed and contact point vary and produce errors rather than winners.",
      anchors: ["Swinged-for power causes mistimed contact", "Inconsistent racquet speed", "Few or no successful aggressive serves"],
    },
    {
      min: 7,
      max: 12,
      name: "Conditional",
      description: "Player can generate pace in controlled reps but cannot access it reliably during match-play or under pressure.",
      anchors: ["Pace appears in feeding drills", "Not repeatable in point play", "Power attempts raise error rate under stress"],
    },
    {
      min: 13,
      max: 18,
      name: "Functional",
      description: "Adds pace on readable balls and short opportunities; winners occur occasionally when set-up is favorable.",
      anchors: ["Produces pace on short/weak returns", "Occasional service winners", "Manageable risk when aggressive"],
    },
    {
      min: 19,
      max: 24,
      name: "Competitive",
      description: "Power is available and controlled in match situations, producing consistent pressure without a spike in errors.",
      anchors: ["Sustained racquet speed in matches", "Creates pressure without frequent errors", "Uses pace tactically"],
    },
    {
      min: 25,
      max: 30,
      name: "Advanced / Pro-Track",
      description: "Player scales power deliberately by score, opponent and serve type while preserving control and placement.",
      anchors: ["Scales pace by situation", "Controlled winners from power", "Maintains placement with pace"],
    },
    {
      min: 31,
      max: 100,
      name: "Tour Reference",
      description: "Power is weaponized: pace consistently wins points while accuracy and disguise remain intact.",
      anchors: ["Power routinely creates openings", "Elite-level pace with maintained control", "Uses pace as primary tactic when needed"],
    },
  ],
  accuracy: [
    {
      min: 0,
      max: 6,
      name: "Unstable",
      description: "Placement is inconsistent: the ball frequently lands far from intended targets and direction varies unpredictably.",
      anchors: ["No clear targeting", "High directional variability", "Misses intended zones often"],
    },
    {
      min: 7,
      max: 12,
      name: "Conditional",
      description: "Player can hit broad zones but cannot reliably place to tight targets under match conditions.",
      anchors: ["Hits general areas only", "Fails to hit tight targets", "Needs ideal setup for precision"],
    },
    {
      min: 13,
      max: 18,
      name: "Functional",
      description: "Placement holds in balanced situations; player finds targets when set-up is correct but may lose it under extreme pressure.",
      anchors: ["Targets hit when balanced", "Usable placement in rallies", "Occasional misses under pressure"],
    },
    {
      min: 19,
      max: 24,
      name: "Competitive",
      description: "Placement is reliable in matches: player hits intended areas consistently and uses placement to construct points.",
      anchors: ["Targets maintained during match play", "Creates angles with placement", "Consistent directional control"],
    },
    {
      min: 25,
      max: 30,
      name: "Advanced / Pro-Track",
      description: "Placement is intentionally varied to create openings and is executed without mechanical breakdown.",
      anchors: ["Chooses exact targets", "Creates space with placement", "High repeatability of targeted serves"],
    },
    {
      min: 31,
      max: 100,
      name: "Tour Reference",
      description: "Placement is instinctive and tactical: player consistently hits sub-zones to manipulate opponent positioning.",
      anchors: ["Manipulates opponent positioning", "Elite-level precision", "Targets change with intent"],
    },
  ],
  spin: [
    {
      min: 0,
      max: 6,
      name: "Unstable",
      description: "Spin production is accidental or absent: contact does not impart consistent rotation and trajectory is unpredictable.",
      anchors: ["No consistent rotation", "Flat or accidental spin", "Unreliable ball trajectory"],
    },
    {
      min: 7,
      max: 12,
      name: "Conditional",
      description: "Player can produce spin in controlled reps but cannot regulate depth or shape reliably in live play.",
      anchors: ["Spin appears in drills", "Depth/shape vary in points", "Cannot regulate spin under pressure"],
    },
    {
      min: 13,
      max: 18,
      name: "Functional",
      description: "Spin is used intentionally to manage depth and margin, though execution can wobble under pressure.",
      anchors: ["Uses spin to increase margin", "Controls depth in practice", "Some variability in tight moments"],
    },
    {
      min: 19,
      max: 24,
      name: "Competitive",
      description: "Spin reliably shapes patterns and supports both neutral and offensive play in matches.",
      anchors: ["Spin supports tactical patterns", "Consistent shape and depth", "Used to neutralize or attack"],
    },
    {
      min: 25,
      max: 30,
      name: "Advanced / Pro-Track",
      description: "Player varies spin deliberately to manipulate opponent timing and depth without mechanical compromise.",
      anchors: ["Deliberate spin variation", "Shapes opponent movement", "High control over spin depth/shape"],
    },
    {
      min: 31,
      max: 100,
      name: "Tour Reference",
      description: "Spin is an elite tool: disguised and consistent, used to control opponent positioning and disguise intent.",
      anchors: ["Spin used for disguise", "Controls opponent movement", "Elite-level spin mastery"],
    },
  ],
  technique: [
    {
      min: 0,
      max: 6,
      name: "Unstable",
      description: "Mechanical execution varies significantly between reps: timing, sequencing or grips change and energy is wasted.",
      anchors: ["Inconsistent grips/timing", "Visible sequencing errors", "High energy waste"],
    },
    {
      min: 7,
      max: 12,
      name: "Conditional",
      description: "Mechanics hold in calm reps but break down when rushed, under pressure, or when movement is required.",
      anchors: ["Holds under calm conditions", "Breaks when rushed", "Efficiency drops under stress"],
    },
    {
      min: 13,
      max: 18,
      name: "Functional",
      description: "Mechanics are repeatable across sessions and allow reliable recovery and shot production in routine match play.",
      anchors: ["Repeatable sequencing", "Reasonable efficiency", "Consistent recovery"],
    },
    {
      min: 19,
      max: 24,
      name: "Competitive",
      description: "Technique holds under match stress with efficient sequencing and quick recovery, supporting tactical play.",
      anchors: ["Efficient under pressure", "Good sequencing", "Quick recovery"],
    },
    {
      min: 25,
      max: 30,
      name: "Advanced / Pro-Track",
      description: "Technique is economical and stable under tactical stress, with minimal wasted motion and consistent execution.",
      anchors: ["Economical movement", "Stable under tactics", "Optimized sequencing"],
    },
    {
      min: 31,
      max: 100,
      name: "Tour Reference",
      description: "Technique is automated and invisible: execution is consistent, efficient and repeatable under all conditions.",
      anchors: ["Automatic technique", "Minimal waste", "Effortless execution"],
    },
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

