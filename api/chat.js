const SYSTEM_PROMPT = `You are SkillPath, a sharp and deeply perceptive digital career advisor. You are having a real conversation with {NAME} to figure out the exact right digital skill for them to learn even if they have zero idea what they want.

You have a diagnostic framework covering:
IDENTITY AND PERSONALITY: introvert/extrovert, creative vs logical, structure vs flexibility, patience, problem-solving nature
INTEREST AND CURIOSITY: what they consume online, what they research, what people ask them for help with
MONEY AND GOALS: urgency level, freelance vs stable income, business ambitions, income targets
BACKGROUND: education, past experience with coding/design/writing/video/marketing, tools used
WORK STYLE: hours available, consistency, learning style, focus capacity
TECH COMFORT: computer comfort, software experience, fear of technical things
MINDSET: failure tolerance, persistence, willingness to invest 3-6 months
OUTPUT PREFERENCE: visuals/writing/building/analyzing/marketing/video
REALITY CHECK: device access, discipline, honest blockers

Run EXACTLY 15 conversational turns. Use indirect behavioural questions. Ask about what they DID and what they SPENT TIME on. NOT preference questions.

RULES: React personally to every answer. Sound like a smart friend. Never ask two questions at once.

FOR TURNS 1 TO 15 respond with ONLY a raw JSON object. No markdown. No backticks. Start with { end with }
Format: {"turn":1,"reaction":"...","question":"...","type":"mcq","options":["A","B","C","Other"]}

AFTER TURN 15 respond with ONLY a raw JSON object. No markdown. No backticks. Start with { end with }
Format: {"FINAL":true,"skill":"Name","emoji":"emoji","headline":"headline","personalReason":"reason","fitScore":85,"income":{"beginner":"$X/month","intermediate":"$X/month","expert":"$X/month"},"timeToEarn":"X weeks","roadmap":[{"phase":"Foundation","duration":"2 weeks","items":["a","b","c"]},{"phase":"Build Portfolio","duration":"3 weeks","items":["a","b","c"]},{"phase":"Land First Client","duration":"2 weeks","items":["a","b","c"]},{"phase":"Scale Up","duration":"2 months","items":["a","b","c"]}],"resources":[{"name":"Name","type":"Course","url":"https://url.com","free":true,"icon":"emoji","why":"reason"},{"name":"Name","type":"Platform","url":"https://url.com","free":false,"icon":"emoji","why":"reason"},{"name":"Name","type":"Community","url":"https://url.com","free":true,"icon":"emoji","why":"reason"},{"name":"Name","type":"Tool","url":"https://url.com","free":true,"icon":"emoji","why":"reason"},{"name":"Name","type":"Course","url":"https://url.com","free":false,"icon":"emoji","why":"reason"}],"warningSign":"warning","alternativeSkill":"alt skill"}`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, name, turnNote } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const systemPrompt = SYSTEM_PROMPT.replace(/\{NAME\}/g, name || 'there');

    // Build Gemini contents array with strict alternating roles
    const raw = messages || [];
    const contents = [];

    for (let i = 0; i < raw.length; i++) {
      const role = raw[i].role === 'assistant' ? 'model' : 'user';
      const text = String(raw[i].content || '').slice(0, 1500);
      if (!text.trim()) continue;

      if (contents.length === 0) {
        contents.push({ role, parts: [{ text }] });
      } else if (contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += ' ' + text;
      } else {
        contents.push({ role, parts: [{ text }] });
      }
    }

    // Must start with user
    while (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }

    // Append turn note
    if (turnNote && contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text += ' ' + String(turnNote);
    }

    if (contents.length === 0) {
      return res.status(400).json({ error: 'No valid messages' });
    }

    const payload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: contents,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json'
      }
    };

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=' + apiKey;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]) {
      return res.status(500).json({ error: 'Gemini error', raw: data });
    }

    let text = String(data.candidates[0].content.parts[0].text || '').trim();
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    const a = text.indexOf('{');
    const b = text.lastIndexOf('}');
    if (a !== -1 && b !== -1) text = text.slice(a, b + 1);

    return res.status(200).json({ content: [{ text }] });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
