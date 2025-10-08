// src/lib/ai-fallback-templates.ts - FALLBACK PLANS FOR AI QUOTA LIMITS

export interface FallbackTemplate {
  mood: string[];
  learningGoal: string[];
  plan: string[];
}

/**
 * Fallback learning plans organized by mood and learning style
 * Used when AI API is unavailable or quota exceeded
 */
export const FALLBACK_TEMPLATES: FallbackTemplate[] = [
  // Energetic + Technical Learning
  {
    mood: ['energized', 'motivated', 'focused', 'excited'],
    learningGoal: ['programming', 'coding', 'javascript', 'python', 'web development', 'software'],
    plan: [
      'Complete 2 coding challenges on your preferred platform (30-45 minutes)',
      'Watch one technical tutorial video and take notes (25 minutes)',
      'Build a small feature for your practice project (45-60 minutes)',
      'Review and refactor code you wrote yesterday (20 minutes)',
      'Read documentation for a new library or framework (15 minutes)'
    ]
  },
  
  // Tired/Low Energy + Technical
  {
    mood: ['tired', 'exhausted', 'low energy', 'sleepy'],
    learningGoal: ['programming', 'coding', 'javascript', 'python', 'web development', 'software'],
    plan: [
      'Watch an educational coding video while taking notes (30 minutes)',
      'Read through code examples and analyze them (20 minutes)',
      'Organize your learning resources and bookmarks (15 minutes)',
      'Review concepts you learned this week (light revision)',
      'Plan tomorrow\'s learning goals in detail'
    ]
  },
  
  // Stressed/Anxious + Any Goal
  {
    mood: ['stressed', 'anxious', 'overwhelmed', 'nervous'],
    learningGoal: ['any'],
    plan: [
      'Start with 5-minute breathing exercise or short walk',
      'Break your learning into 15-minute focused sessions',
      'Review something you already know well (confidence boost)',
      'Practice one simple, achievable task',
      'End with listing 3 things you accomplished today'
    ]
  },
  
  // Energetic + Creative Learning
  {
    mood: ['energized', 'creative', 'inspired', 'motivated'],
    learningGoal: ['design', 'ui/ux', 'art', 'creative', 'writing'],
    plan: [
      'Create 3 quick design sketches or concepts (30 minutes)',
      'Study and analyze work from designers you admire (20 minutes)',
      'Work on your main creative project (45-60 minutes)',
      'Get feedback on your work from online community',
      'Experiment with a new tool or technique (25 minutes)'
    ]
  },
  
  // Moderate Energy + Language Learning
  {
    mood: ['calm', 'relaxed', 'moderate', 'balanced'],
    learningGoal: ['language', 'english', 'spanish', 'french', 'german', 'speaking'],
    plan: [
      'Complete 20 minutes of vocabulary practice with flashcards',
      'Watch 15-minute video in target language with subtitles',
      'Practice speaking exercises or record yourself (15 minutes)',
      'Read a short article or story in target language',
      'Review grammar notes and create example sentences'
    ]
  },
  
  // Energetic + Business/Professional
  {
    mood: ['energized', 'motivated', 'ambitious', 'focused'],
    learningGoal: ['business', 'marketing', 'management', 'entrepreneurship', 'finance'],
    plan: [
      'Read one chapter from business book or case study (30 minutes)',
      'Watch educational video on current topic (20 minutes)',
      'Practice new skill: create presentation, spreadsheet, or analysis',
      'Network: comment on industry posts or connect with professionals',
      'Write summary of key learnings and action items'
    ]
  },
  
  // Low Energy + General Learning
  {
    mood: ['tired', 'low energy', 'unmotivated'],
    learningGoal: ['any'],
    plan: [
      'Watch 20-minute educational video (passive learning)',
      'Listen to podcast related to your learning goal',
      'Organize your learning materials and notes (15 minutes)',
      'Do light reading - articles or blog posts (20 minutes)',
      'Set clear, achievable goals for tomorrow'
    ]
  },
  
  // Busy Schedule + Quick Learning
  {
    mood: ['busy', 'rushed', 'limited time'],
    learningGoal: ['any'],
    plan: [
      '15-minute focused practice session on core skill',
      'Quick review of flashcards or notes (10 minutes)',
      'Listen to educational podcast during commute/chores',
      'Read one article or watch one short video',
      '5-minute reflection: what did you learn today?'
    ]
  },
  
  // Default Generic Plan
  {
    mood: ['any'],
    learningGoal: ['any'],
    plan: [
      'Start with 25-minute focused learning session (Pomodoro)',
      'Take 5-minute break, then do practical exercises (20 minutes)',
      'Review what you learned and take notes (15 minutes)',
      'Watch educational content or read articles (20 minutes)',
      'End with reflection: write 3 key takeaways from today'
    ]
  }
];

/**
 * Find best matching fallback template based on mood and learning goal
 */
export function getFallbackPlan(mood: string, learningGoal: string): string[] {
  const moodLower = mood.toLowerCase();
  const goalLower = learningGoal.toLowerCase();
  
  // Try to find exact match
  let bestMatch = FALLBACK_TEMPLATES.find(template => 
    template.mood.some(m => moodLower.includes(m)) &&
    template.learningGoal.some(g => goalLower.includes(g))
  );
  
  // If no exact match, try mood only
  if (!bestMatch) {
    bestMatch = FALLBACK_TEMPLATES.find(template =>
      template.mood.some(m => moodLower.includes(m)) &&
      template.learningGoal.includes('any')
    );
  }
  
  // If still no match, try goal only
  if (!bestMatch) {
    bestMatch = FALLBACK_TEMPLATES.find(template =>
      template.mood.includes('any') &&
      template.learningGoal.some(g => goalLower.includes(g))
    );
  }
  
  // Return default plan if nothing matches
  return bestMatch?.plan || FALLBACK_TEMPLATES[FALLBACK_TEMPLATES.length - 1].plan;
}

/**
 * Check if error is quota-related
 */
export function isQuotaError(error: any): boolean {
  const errorMsg = error?.message?.toLowerCase() || '';
  const errorStr = error?.toString()?.toLowerCase() || '';
  
  return (
    errorMsg.includes('quota') ||
    errorMsg.includes('rate limit') ||
    errorMsg.includes('429') ||
    errorMsg.includes('resource exhausted') ||
    errorStr.includes('quota') ||
    errorStr.includes('rate limit')
  );
}