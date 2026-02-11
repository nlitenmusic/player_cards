const anchors: Record<string, Record<string, string[][]>> = {
  serve: {
    consistency: [
      [
        "Toss and contact feel inconsistent from rep to rep.",
        "Player often double-faults or shanks under basic pressure.",
        "Cannot reliably start points in drill or match situations."
      ],
      [
        "Serves are OK in warm-up but fall apart once scoring begins.",
        "Timing drifts when fatigued or under match pressure.",
        "Toss occasionally drifts, causing erratic contact."
      ],
      [
        "Starts points consistently in practice and low-pressure points.",
        "Occasional misses appear when under pressure or on a tight swing.",
        "Mechanics look mostly intact across reps."
      ],
      [
        "Second serve is trusted; double faults are rare (1–2 in long sets).",
        "Toss and contact remain stable during match play.",
        "Serve sets up easy patterns or first-serve points."
      ],
      [
        "Maintains serve quality late in sessions and during long points.",
        "Adapts placement and pace to opponents without losing repeatability.",
        "Mechanics stay consistent under fatigue."
      ],
      [
        "Serve motion and intent are automatic and repeatable.",
        "Uses disguise, pace and placement deliberately to win points.",
        "Very low error rate; serve functions as a weapon."
      ],
    ],
    overall: [
      [
        "Multiple components break down in the same session (power, accuracy, technique).",
        "Player struggles to produce a dependable outcome under any condition.",
        "Errors are frequent even in simple drill situations."
      ],
      [
        "Performs in calm, predictable environments but falls apart in matches.",
        "Needs controlled settings to hit acceptable serves consistently.",
        "Shows clear mechanical issues under pressure."
      ],
      [
        "Reliable in practice; motion and outcome are predictable across reps.",
        "May tighten or lose depth in decisive points, but recovers quickly.",
        "Useful first or second serve in casual competition."
      ],
      [
        "Delivers consistent service games in match play; sets up tactics.",
        "Low double fault frequency and solid toss mechanics.",
        "Makes opponents play defensive returns regularly."
      ],
      [
        "Remains consistent across long matches and under tactical shifts.",
        "Adjusts spin, placement, and power without mechanical compromise.",
        "Can execute under fatigue and strategic pressure."
      ],
      [
        "Serve is weaponized: disguises, variation, and near-automatic execution.",
        "Rarely loses serve hold; creates free points consistently.",
        "Execution is elite and repeatable in match settings."
      ],
    ],
    power: [
      ["Attempts to hit harder break timing and cause errors.", "Contact quality falls apart when trying to add pace.", "Player can't sustain a power-based serve."],
      ["Has bursts of pace in drills but can't repeat them reliably.", "Power comes unpredictably and without control.", "Not dependable when trying to finish points with power."],
      ["Adds intentional pace on readable balls with manageable risk.", "Can produce effective serves when set up properly.", "Power is useful but not fully weaponized."],
      ["Power is controlled and effective in match play.", "Player can maintain pace without sacrificing toss/contact.", "Power wins short points and pressures opponents."],
      ["Scales power deliberately based on situation and opponent.", "Power remains repeatable late in matches.", "Uses pace tactically to finish points."],
      ["Power is a consistent weapon while preserving accuracy.", "Generates elite-level pace with repeatable contact.", "Power creates direct winners regularly."]
    ],
    accuracy: [
      ["Targeting is unclear; serve placement varies widely.", "Often misses intended box or depth.", "Placement errors lead to free points."],
      ["Can hit broad areas but misses precise spots frequently.", "Depth and wide/inside targets are unreliable.", "Needs predictable toss to place consistently."],
      ["Places serves into intended zones regularly in practice.", "Depth and direction are usable but vary under pressure.", "Can target safe corners when set up."],
      ["Consistently finds tactical spots in match play.", "Placement creates weak returns or set-ups.", "Targets remain stable under stress."],
      ["Places with high intent and adjusts positionally to open angles.", "Uses placement to construct points reliably.", "Maintains placement under fatigue."],
      ["Placement is instinctive and used tactically to win points.", "Targets are precise and consistently executed.", "Elite-level placement and control."]
    ],
    spin: [
      ["Spin generation is accidental or absent; contact is inconsistent.", "Serves float or lack intended bite.", "Can't produce reliable spin-based outcomes."],
      ["Can produce occasional spin but cannot regulate depth/shape.", "Spin varies widely between reps.", "Struggles to use spin tactically."],
      ["Produces intentional spin types in practice with some variance.", "Uses spin to increase margin or safety when needed.", "Execution varies under match pressure."],
      ["Spin supports serve patterns and consistency in matches.", "Can combine spin and placement to create short returns.", "Regulates spin reliably under pace."],
      ["Varies spin deliberately to shape opponent reactions.", "Uses spin to open angles or change bounce consistently.", "Spin is a repeatable tactical tool."],
      ["Elite spin manipulation and disguise; controls opponent positioning.", "Spin is a precision tool for outcome manipulation.", "Disguises spin and intent at will."]
    ],
    technique: [
      ["Toss, leg drive and contact timing are inconsistent; recovery is slow.", "Motion is inefficient and often rushed.", "Basic sequencing is missing."],
      ["Toss quality and weight transfer are uneven; mechanics hold only in calm reps.", "Timing breaks under pressure.", "Needs more consistent rhythm and setup."],
      ["Repeatable toss and coordinated leg drive produce consistent contact in practice.", "Pronation and follow-through are serviceable.", "Recovery and balance are acceptable."],
      ["Precise toss, effective leg drive, and coordinated kinetic chain under pressure.", "Efficient sequencing and quick recovery in matches.", "Mechanics are compact and reliable."],
      ["Toss precision, explosive but controlled leg drive, and optimized pronation/uncoil.", "Minimizes wasted motion and recovers quickly.", "Technique adapts to tactical needs."],
      ["Toss, leg drive, timing, and wrist/pronation are finely tuned and automated.", "Technique is efficient, repeatable and weaponized.", "Near-perfect execution under pressure."]
    ],
  },

  // reuse similar structure for other skills; keep descriptions coach-observable
  return: {
    consistency: [
      ["Late to the ball, awkward contact, and weak returns.", "Often misses or gives easy balls back to opponents.", "Fails to handle simple serves reliably."],
      ["Gets returns back in calm practice but struggles with pace.", "Depth and direction vary when under pressure.", "Needs predictable feeds for good returns."],
      ["Consistently gets returns back in rallies; can redirect pace occasionally.", "Depth varies in pressure moments but generally stable.", "Usually recovers to a neutral position after returns."],
      ["Regularly neutralizes strong serves and keeps depth.", "Creates immediate opportunities to attack off returns.", "Maintains return quality in match play."],
      ["Anticipates serve patterns and returns with intention.", "Redirects pace effectively and places returns tactically.", "Very consistent under pace and movement."],
      ["Elite-level return reads and redirects; converts returns into offensive chances.", "Automatic reaction to serve variations.", "Consistently pressures servers with returns."]
    ],
    overall: [
      ["Weak footwork and contact on return; gives many free points.", "Struggles with basic depth and accuracy.", "Often beaten on serve returns."],
      ["Playable in calm settings but inconsistent in matches.", "Lacks depth or placement under pressure.", "Needs controlled environments to perform."],
      ["Regularly gets returns back with workable depth and direction.", "Can recover into rallies and occasionally create offense.", "May still vary in tense situations."],
      ["Neutralizes many serves and creates offensive opportunities.", "Consistent depth and tactical placement on returns.", "Reliable in match conditions."],
      ["Anticipates and redirects serve patterns with intent.", "Targets return placement deliberately to create chances.", "Handles pace and movement consistently."],
      ["Reads serves instinctively and turns returns into immediate pressure.", "Elite-level return quality and placement.", "Creates highest-probability offensive returns."]
    ],
  },

  forehand: {
    overall: [
      ["Late preparation, long swing, and frequent errors in rallies.", "Struggles to generate consistent power or placement.", "Mechanics break down under pressure."],
      ["Performs well in calm drills but loses aggression and control in matches.", "Inconsistent timing under stress.", "Needs better preparation for heavy balls."],
      ["Dependable rally shot with workable power; occasional lapses in tight moments.", "Solid mechanics in practice, slight tension in critical points.", "Can execute varied spins when set up."] ,
      ["Delivers tactical aggression with consistent timing and placement.", "Wins points through controlled power and direction.", "Reliable under match conditions."],
      ["Varies spin and direction to create and finish patterns.", "Consistent weapon under pressure.", "High repeatability and directional control."],
      ["Explosive, accurate forehand that defines rallies and creates winners.", "Elite-level ball striking and consistency.", "Produces winners under pressure."],
    ],
  },

  backhand: {
    overall: [
      ["Erratic preparation and weak defensive options.", "Slow recovery after backhand exchanges.", "Often forced to defend."],
      ["Works in calm settings but loses depth and reliability under pressure.", "Struggles to create offense consistently.", "Needs improved timing."] ,
      ["Reliable for rallies with occasional offensive shots.", "Solid technique, occasional shortball finishing.", "Can sustain rallies effectively."],
      ["Compact, reliable backhand that supports aggression and depth.", "Maintains under pressure and creates offensive chances.", "Good control and placement."],
      ["Backhand offers reliable disguise or power to finish points.", "Tactical variety and consistent execution.", "Handles high pace well."],
      ["Refined, powerful backhand executed with precision under pressure.", "Elite-level consistency and offensive capability.", "Reliable at the highest levels."]
    ],
  },

  volley: {
    overall: [
      ["Poor platform and inconsistent hand control at the net.", "Frequently beaten on basic volleys.", "Struggles to finish short points."],
      ["Executes simple volleys when stationary but falters on the move.", "Timing and economy break down under pressure.", "Needs to improve compactness."],
      ["Reliable net play with reasonable touch and balance.", "Can finish short points when positioned correctly.", "Recovery is generally adequate."],
      ["Compact, controlled volleys that can finish or redirect pace in matches.", "Consistent placement and touch under pressure.", "Often wins short net exchanges."],
      ["Varied touch and punch with precise placement to finish points.", "Conserves energy while finishing reliably.", "High-level net control."],
      ["Exceptional volley control: instant touch, timing and domination at the net.", "Wins net exchanges consistently.", "Elite-level finishing ability."]
    ],
  },

  overhead: {
    overall: [
      ["Footwork and setup are late or awkward; many miscues.", "Often mistimes overheads and gives easy points.", "Struggles with on-the-run overheads."],
      ["Can complete overheads in calm conditions but breaks under pace.", "Setup and economy degrade when rushed.", "Needs better positioning."],
      ["Reliable overheads with solid setup and contact in routine situations.", "Effective for finishing easy lobs.", "Conserves energy."],
      ["Efficient positioning and compact swing producing consistent overhead winners.", "Finishes points with authority in match play.", "Rarely miscues."],
      ["Optimized setup and timing producing authoritative overheads under pressure.", "High success rate on difficult lobs.", "Very consistent on the run."],
      ["Near-perfect overheads: automatic setup, compact mechanics and high finish rate.", "Dominates overhead exchanges.", "Elite-level reliability."]
    ],
  },

  movement: {
    overall: [
      ["Reactive and slow; arrives late and off-balance frequently.", "Poor recovery after shots.", "Struggles to cover simple rallies."],
      ["Reaches many balls but movement speed and recovery are inconsistent.", "Spacing degrades under fatigue.", "Needs to improve first-step quickness."],
      ["Adequate court coverage for most rallies; generally balanced recovery.", "Can execute routine shots with acceptable spacing.", "Occasional lapses under pressure."],
      ["Reliable speed, balance and recovery enabling good shot preparation.", "Consistent spacing and quick recovery.", "Supports high-quality shot execution."],
      ["Proactive anticipation and efficient footwork that enable aggressive choices.", "Arrives early with excellent spacing.", "Enables offensive movement patterns."],
      ["Automatic, anticipatory movement with elite spacing and recovery.", "Covers court instinctively and creates constant pressure.", "Elite-level footwork and anticipation."]
    ],
  },
};

export default anchors;
