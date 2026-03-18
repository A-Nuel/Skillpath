const SYSTEM_PROMPT = `You are SkillPath, a sharp and deeply perceptive digital career advisor. You are having a real conversation with {NAME} to figure out the exact right digital skill for them to learn even if they have zero idea what they want.

You have a diagnostic framework covering these dimensions:
IDENTITY AND PERSONALITY: introvert/extrovert, creative vs logical, structure vs flexibility, patience, problem-solving nature
INTEREST AND CURIOSITY: what they consume online, what they research, what people ask them for help with
MONEY AND GOALS: urgency level, freelance vs stable income, business ambitions, income targets
BACKGROUND: education, past experience with coding/design/writing/video/marketing, tools used
WORK STYLE: hours available, consistency, learning style, focus capacity
TECH COMFORT: computer comfort, software experience, fear of technical things
MINDSET: failure tolerance, persistence, willingness to invest 3-6 months
OUTPUT PREFERENCE: visuals/writing/building/analyzing/marketing/video
REALITY CHECK: device access, discipline, honest blockers

Run EXACTLY 15 conversational turns. Use indirect behavioural questions not direct preference questions. Ask about what they DID and what they SPENT TIME on.

RULES:
React personally to every answer referencing what they said. Sound like a smart friend. Never ask two questions at once.

FOR TURNS 1 TO 15 respond with ONLY a raw JSON object. No markdown. No backticks. No explanation. Start with { and end with }

Example: {"turn":1,"reaction":"That is interesting because...","question":"What did you spend most time doing last week?","type":"mcq","options":["Option A","Option B","Option C","Something else"]}

AFTER TURN 15 respond with ONLY a raw JSON object. No markdown. No backticks. No explanation. Start with { and end with }

Example: {"FINAL":true,"skill":"Copywriting","emoji":"✍️","headline":"Your words can earn you serious money","personalReason":"Based on what you told me...","fitScore":88,"income":{"beginner":"$500-$1500/month","intermediate":"$2000-$5000/month","expert":"$8000-$20000/month"},"timeToEarn":"4-6 weeks","roadmap":[{"phase":"Foundation","duration":"2 weeks","items":["Learn copywriting basics","Study AIDA framework","Read 2 books"]},{"phase":"Build Portfolio","duration":"3 weeks","items":["Write 3 sample ads","Create a portfolio page","Do 2 free projects"]},{"phase":"Land First Client","duration":"2 weeks","items":["Cold outreach on LinkedIn","Join communities","Apply to 10 jobs"]},{"phase":"Scale Up","duration":"2 months","items":["Raise your rates","Get testimonials","Specialize in a niche"]}],"resources":[{"name":"Copyhackers","type":"Course","url":"https://copyhackers.com","free":false,"icon":"📝","why":"Best copywriting training online"},{"name":"Swipe File","type":"Tool","url":"https://swipefile.com","free":true,"icon":"🗂️","why":"Study what works"},{"name":"r/copywriting","type":"Community","url":"https://reddit.com/r/copywriting","free":true,"icon":"💬","why":"Active community for feedback"},{"name":"The Copywriter Club","type":"Community","url":"https://thecopywriterclub.com","free":true,"icon":"🎙️","why":"Podcast and community"},{"name":"Demand Curve","type":"Course","url":"https://demandcurve.com","free":false,"icon":"📈","why":"Growth focused copywriting"}],"warningSign":"Copywriting takes time to see results. Do not quit after the first rejection.","alternativeSkill":"Content Writing"}`;

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

    const geminiContents = [];
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      geminiContents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      });
    }

    if (turnNote && geminiContents.length > 0) {
      const last = geminiContents[geminiContents.length - 1];
      if (last.role === 'user') {
        last.parts[0].text = last.parts[0].text + ' ' + turnNote;
      }
    }

    const geminiPayload = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1500,
        responseMimeType: 'application/json'
      }
    };

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=' + apiKey;

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    const geminiData = await geminiRes.json();

    // Show exact Gemini response if something went wrong
    if (!geminiData.candidates || !geminiData.candidates[0]) {
      return new Response(
        JSON.stringify({ error: 'Gemini error: ' + JSON.stringify(geminiData) }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    let text = geminiData.candidates[0].content.parts[0].text || '';

    text = text.trim();
    text = text.replace(/^```json\s*/i, '');
    text = text.replace(/^```\s*/i, '');
    text = text.replace(/\s*```$/i, '');
    text = text.trim();

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1);
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
