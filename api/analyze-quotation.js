// Vercel Serverless Function
// 견적 비교 데이터를 Claude API로 전달해 AI 분석 결과(JSON)를 반환한다.
// ANTHROPIC_API_KEY는 반드시 Vercel 프로젝트 환경변수로만 설정한다. 클라이언트 코드에는 절대 노출하지 않는다.

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const ANTHROPIC_VERSION = '2023-06-01';

const SYSTEM_PROMPT = `당신은 강구조(철골) 조달 견적 비교를 검토하는 AI 분석 어시스턴트입니다.
반드시 아래 JSON 스키마로만 응답하세요. 그 외 설명 텍스트를 앞뒤에 절대 붙이지 마세요.

{
  "missingOrErrorItems": [
    { "supplier": string, "boqItem": string, "type": "누락"|"단위 불일치"|"이상 단가"|"Budget 초과"|"기타", "detail": string, "confidence": "확인됨"|"확인 필요" }
  ],
  "abnormalPriceItems": [
    { "boqItem": string, "supplier": string, "unitPrice": number, "secondSupplier": string, "secondPrice": number, "pctCheaper": number, "queryDraftEn": string }
  ],
  "recommendations": [
    { "rank": 1, "procurementMode": string, "supplierCombo": string, "expectedTotalUsd": number, "budgetVariancePct": number, "reasons": [string], "cautions": [string] },
    { "rank": 2, "procurementMode": string, "supplierCombo": string, "expectedTotalUsd": number, "budgetVariancePct": number, "reasons": [string], "cautions": [string] }
  ],
  "notes": [string]
}

반드시 준수할 규칙:
1. recommendations는 정확히 2개를 제시하며, 서로 다른 발주방식 또는 협력사 조합이어야 한다.
2. 데이터로 단정할 수 없거나 불확실한 값·판단은 confidence를 "확인 필요"로 표시하고, 관련 cautions/notes에도 "확인 필요"라는 표현을 그대로 포함한다.
3. 이상 단가 판정 기준: 최저가가 2번째 최저가 대비 30% 이상 저렴하면 이상 단가로 판정한다. abnormalPriceItems의 queryDraftEn은 반드시 영문으로, 공급사에 단가 확인을 요청하는 정중한 이메일 형식으로 작성한다.
4. notes 배열의 마지막 항목은 반드시 다음 문장을 그대로 포함해야 한다: "본 분석은 AI 참고 의견이며, 최종 발주방식 및 협력사 선정은 담당 Buyer의 권한입니다."
5. 숫자는 입력된 데이터를 근거로 계산하고, 근거 없는 추정은 피한다.`;

function buildUserContent(payload) {
  const { project, modeLabel, mode, budgetTotal, rows, summaryRows, matchStatus, abnormalItems } = payload || {};
  return `다음은 프로젝트의 견적 비교 데이터입니다. 이 데이터를 바탕으로 분석하세요.

프로젝트: ${project || '(미지정)'}
선택된 발주방식: ${modeLabel || mode || '(미지정)'}
전체 Budget(USD): ${budgetTotal != null ? budgetTotal : '(미지정)'}

[BOQ 세부 비교 데이터]
${JSON.stringify(rows || [])}

[공종별 Summary 데이터]
${JSON.stringify(summaryRows || [])}

[참여 업체 매칭 현황]
${JSON.stringify(matchStatus || [])}

[사전 계산된 이상 단가 후보 (참고용 - 검증 후 사용)]
${JSON.stringify(abnormalItems || [])}`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'ANTHROPIC_API_KEY 환경변수가 설정되어 있지 않습니다. Vercel 프로젝트 Settings > Environment Variables에 등록한 뒤 다시 배포해주세요.'
    });
    return;
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch (e) {
      res.status(400).json({ error: '요청 본문을 파싱할 수 없습니다.' });
      return;
    }
  }
  payload = payload || {};

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserContent(payload) }]
      })
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      res.status(502).json({
        error: `Claude API 호출에 실패했습니다 (HTTP ${upstream.status}).`,
        detail: errText.slice(0, 500)
      });
      return;
    }

    const data = await upstream.json();
    const text = (data.content || []).map((b) => b.text || '').join('').trim();

    let parsed;
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      parsed = JSON.parse(text.slice(start, end + 1));
    } catch (e) {
      res.status(502).json({ error: 'AI 응답을 JSON으로 해석하지 못했습니다.', raw: text.slice(0, 1000) });
      return;
    }

    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: '서버 오류로 AI 분석 요청에 실패했습니다.', detail: String((e && e.message) || e) });
  }
};
