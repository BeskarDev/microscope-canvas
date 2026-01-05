/**
 * Scene questions - What to explore in a scene (100+ entries)
 * Uses combinatorial approach for variety
 */

// Question starters
export const QUESTION_STARTERS = [
	'What',
	'Who',
	'Why',
	'How',
	'When',
	'Where'
];

// Question cores for 'What' questions
export const WHAT_QUESTIONS = [
	'choice must be made here?',
	'secret is revealed?',
	'changes everything?',
	'old wound reopens?',
	'alliance forms or breaks?',
	'is sacrificed?',
	'hope dies or is born?',
	'truth is finally spoken?',
	'mask falls away?',
	'is remembered or forgotten?',
	'boundary is crossed?',
	'power shifts?',
	'cycle begins or ends?',
	'unexpected consequence emerges?',
	'tradition is kept or broken?',
	'promise is made or broken?',
	'impossible thing becomes possible?',
	'price must be paid?',
	'lesson is learned?',
	'warning is ignored?',
	'opportunity is seized or lost?',
	'line is crossed?',
	'debt is called due?',
	'gift becomes a curse?',
	'strength becomes weakness?'
];

// Question cores for 'Who' questions
export const WHO_QUESTIONS = [
	'pays the price?',
	'makes the sacrifice?',
	'reveals the truth?',
	'breaks the silence?',
	'takes the first step?',
	'makes the hard choice?',
	'stands alone?',
	'refuses to yield?',
	'betrays their principles?',
	'changes sides?',
	'sees what others miss?',
	'speaks for the voiceless?',
	'holds the power here?',
	'loses everything?',
	'gains unexpected allies?',
	'is not who they seem?',
	'carries the burden?',
	'inherits the consequences?',
	'breaks the cycle?',
	'remembers what was forgotten?'
];

// Question cores for 'Why' questions
export const WHY_QUESTIONS = [
	'does this matter?',
	'now, after all this time?',
	'did no one see this coming?',
	'must it end this way?',
	'do they refuse to listen?',
	'is the truth hidden?',
	'do old wounds resurface?',
	'does the past refuse to stay buried?',
	'is change so hard?',
	'do they cling to tradition?',
	'does power corrupt?',
	'can\'t they let go?',
	'do enemies become allies?',
	'do the good suffer?',
	'does justice fail?'
];

// Question cores for 'How' questions
export const HOW_QUESTIONS = [
	'far will they go?',
	'much are they willing to sacrifice?',
	'did it come to this?',
	'can trust be rebuilt?',
	'do they live with this choice?',
	'does the truth emerge?',
	'is the impossible achieved?',
	'do they find the strength?',
	'does hope survive?',
	'is the cycle broken?',
	'do they face the consequences?',
	'does change begin?',
	'is peace achieved?',
	'does justice prevail?',
	'do they move forward?'
];

// Complete standalone questions
export const SCENE_QUESTIONS = [
	// Discovery
	'What choice must be made here?',
	'What secret is revealed?',
	'What truth comes to light?',
	'What have they been hiding?',
	'What does this change?',
	
	// Consequence
	'Who pays the price?',
	'What is the cost?',
	'What are the consequences?',
	'How does this affect everything else?',
	'What can never be undone?',
	
	// Character
	'What do they discover about themselves?',
	'What unlikely hero or villain emerges?',
	'Who is not who they seemed?',
	'What changes someone forever?',
	'Who makes the ultimate sacrifice?',
	
	// Conflict
	'What alliance forms or breaks?',
	'Who stands against whom?',
	'What battle is fought here?',
	'How is the conflict resolved?',
	'Who wins and who loses?',
	
	// Change
	'What old wound reopens?',
	'What boundary is crossed?',
	'What power shifts?',
	'What cycle begins or ends?',
	'What tradition is kept or broken?',
	
	// Truth
	'What truth is finally spoken?',
	'What mask falls away?',
	'What lie is exposed?',
	'What was always true?',
	'What is finally acknowledged?',
	
	// Memory
	'What is remembered or forgotten?',
	'What from the past returns?',
	'What lesson is learned?',
	'What warning is ignored?',
	'What pattern repeats?',
	
	// Hope & Despair
	'What hope dies or is born?',
	'What unexpected possibility emerges?',
	'What seems impossible?',
	'What gives them strength?',
	'What breaks their spirit?',
	
	// Relationships
	'How does this affect their relationship?',
	'What bond is tested?',
	'Who betrays whom?',
	'Who stands with whom?',
	'What forgiveness is given or withheld?',
	
	// Fate
	'What promise is made or broken?',
	'What impossible thing becomes possible?',
	'What was always inevitable?',
	'What fate is sealed?',
	'What destiny is revealed?',
	
	// Stakes
	'What is at stake?',
	'What will be lost if they fail?',
	'What will be gained if they succeed?',
	'What sacrifice is required?',
	'What price must be paid?',
	
	// Action
	'What bold action is taken?',
	'What desperate measure is employed?',
	'What risk is taken?',
	'What gamble is made?',
	'What stand is taken?',
	
	// Emotion
	'What emotion drives them?',
	'What fear holds them back?',
	'What love or hate motivates them?',
	'What regret haunts them?',
	'What hope sustains them?',
	
	// Power
	'Who holds the power here?',
	'How is power used or abused?',
	'What authority is challenged?',
	'What control is lost?',
	'What influence is wielded?',
	
	// Legacy
	'What legacy is created or destroyed?',
	'What will be remembered?',
	'What will be forgotten?',
	'What example is set?',
	'What precedent is established?'
];

/**
 * Generate a scene question
 */
export function generateSceneQuestion(): string {
	// Sometimes use combinatorial approach
	if (Math.random() > 0.7) {
		const starter = QUESTION_STARTERS[Math.floor(Math.random() * QUESTION_STARTERS.length)];
		let core: string;
		
		switch (starter) {
			case 'What':
				core = WHAT_QUESTIONS[Math.floor(Math.random() * WHAT_QUESTIONS.length)];
				break;
			case 'Who':
				core = WHO_QUESTIONS[Math.floor(Math.random() * WHO_QUESTIONS.length)];
				break;
			case 'Why':
				core = WHY_QUESTIONS[Math.floor(Math.random() * WHY_QUESTIONS.length)];
				break;
			case 'How':
				core = HOW_QUESTIONS[Math.floor(Math.random() * HOW_QUESTIONS.length)];
				break;
			default:
				core = WHAT_QUESTIONS[Math.floor(Math.random() * WHAT_QUESTIONS.length)];
		}
		
		return `${starter} ${core}`;
	}
	
	// Use standalone question
	return SCENE_QUESTIONS[Math.floor(Math.random() * SCENE_QUESTIONS.length)];
}
