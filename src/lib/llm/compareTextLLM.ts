export async function compareTextLLM(text1: string, text2: string): Promise<'identique' | 'modifié légèrement' | 'totalement différent'> {
    const prompt = `
  Compare les deux textes ci-dessous et indique s’ils sont :
  1. identiques
  2. modifiés légèrement (reformulation, synonyme…)
  3. totalement différents
  
  Texte 1:
  """${text1}"""
  
  Texte 2:
  """${text2}"""
  
  Réponds uniquement par : identique / modifié légèrement / totalement différent.
    `.trim();
  
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4', // ou 'gpt-3.5-turbo'
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
      }),
    });
  
    const data = await res.json();
    const output = data.choices?.[0]?.message?.content?.toLowerCase() ?? '';
  
    if (output.includes('identique')) return 'identique';
    if (output.includes('modifié')) return 'modifié légèrement';
    return 'totalement différent';
  }
  