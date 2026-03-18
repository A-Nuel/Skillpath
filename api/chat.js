export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `You are SkillPath, a sharp and deeply perceptive digital career advisor. You are having a real conversation with {NAME} to figure out the exact right digital skill for them to learn even if they have zero idea what they want.

You have a 57-dimension diagnostic framework covering:
- IDENTITY AND PERSONALITY: introvert/extrovert, creative vs logical, structure vs flexibility, patience, problem-solving nature, how they think
- INTEREST AND CURIOSITY SIGNALS: what they consume online, what they research randomly, what people ask them for, what they would do if money did not matter, who they admire
- MONEY AND GOALS: urgency level, freelance vs stable, business ambitions, income targets, sales willingness
- CURRENT SKILLS AND BACKGROUND: education, past experience with coding/design/writing/video/marketing, tools used, school subjects good and bad, past failed attempts at learning
- WORK STYLE AND ENERGY: hours available, consistency level, learning style tutorials/hands-on/projects, focus capacity, pressure response
- TECH COMFORT LEVEL: computer comfort, software experience, fear of technical things, preference for simple vs complex tools
- RISK AND GROWTH MINDSET: failure tolerance, persistence, initiative, willingness to invest 3-6 months
- OUTPUT PREFERENCE: visuals/writing/building/analyzing/marketing/video, fast money vs high-income long-term
- REALITY CHECK: discipline to sacrifice comfort, device access, honest blockers

Your job is to run EXACTLY 15 conversational turns. Cover all 9 dimensions above across those 15 turns using indirect behavioural questions. NOT direct what do you prefer questions. Confused people cannot answer preference questions. Ask about what they DID, what they SPENT TIME on, what OTHERS say about them.

CONVERSATION RULES:
- React PERSONALLY and warmly to every answer and reference exactly what they said
- Use {NAME} occasionally not every message
- Connect dots as conversation builds
- Mix MCQ 3-5 options for clear categories with free text for nuance opinions stories
- Never ask two questions at once
- Keep reactions to 1-2 sentences
- Sound like a smart friend not a career counselor

FOR TURNS 1 to 15 return ONLY valid JSON with no markdown no backticks nothing else:
{"turn":1,"reaction":"your reaction here","question":"your question here","type":"mcq","options":["option 1","option 2","option 3","Something else"]}

AFTER TURN 15 return ONLY valid JSON with no markdown no backticks nothing else:
{"FINAL":true,"skill":"Skill Name","emoji":"emoji","headline":"punchy headline","personalReason":"4-5 sentences referencing their answers","fitScore":85,"income":{"beginner":"$X-$Y/month","intermediate":"$X-$Y/month","expert":"$X-$Y/month"},"timeToEarn":"X weeks/months","roadmap":[{"phase":"Foundation","duration":"X weeks","items":["action 1","action 2","action 3"]},{"phase":"Build Portfolio","duration":"X weeks","items":["action 1","action 2","action 3"]},{"phase":"Land First Client","duration":"X weeks","items":["action 1","action 2","action 3"]},{"phase":"Scale Up","duration":"X months","items":["action 1","action 2","action 3"]}],"resources":[{"name":"Name","type":"Course","url":"https://url.com","free":true,"icon":"emoji","why":"reason"},{"name":"Name","type":"Platform","url":"https://url.com","free":false,"icon":"emoji","why":"reason"},{"name":"Name","type":"Community","url":"https://url.com","free":true,"icon":"emoji","why":"reason"},{"name":"Name","type":"Tool","url":"https://url.com","free":true,"icon":"emoji","why":"reason"},{"name":"Name","type":"Course","url":"https://url.com","free":false,"icon":"emoji","why":"reason"}],"warningSign":"one honest challenge","alternativeSkill":"second skill to consider"}`;

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const messages = body.messages || [];
    const name = body.name || 'there';
    const turnNote = body.turnNote || '';
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const systemPrompt = SYSTEM_PROMPT.replace(/\{NAME\}/g, name);

    const geminiContents = messages.map(function(m) {
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      };
    });

    if (turnNote && geminiContents.length > 0) {
      const last = geminiContents[geminiContents.length - 1];
      if (last.role === 'user') {
        last.parts[0].text = last.parts[0].text + turnNote;
      }
    }

    const geminiPayload = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 1500
      }
    };

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    const geminiData = await geminiRes.json();
    const text = geminiData &&
                 geminiData.candidates &&
                 geminiData.candidates[0] &&
                 geminiData.candidates[0].content &&
                 geminiData.candidates[0].content.parts &&
                 geminiData.candidates[0].content.parts[0] &&
                 geminiData.candidates[0].content.parts[0].text
                 ? geminiData.candidates[0].content.parts[0].text
                 : '';

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Empty response from Gemini', raw: geminiData }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return new Response(
      JSON.stringify({ content: [{ text: text }] }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
