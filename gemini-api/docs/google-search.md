---
title: Google 検索によるグラウンディング  |  Gemini API  |  Google AI for Developers
description: Google 検索のリアルタイム情報にモデルの回答をグラウンディングすることで、事実の精度を高め、引用を提供できます。
url: https://ai.google.dev/gemini-api/docs/google-search?hl=ja
image: https://ai.google.dev/static/site-assets/images/share-gemini-api-2.png?hl=ja
siteName: Google AI for Developers
type: website
twitterCard: summary_large_image
twitterSite: undefined
---
# Google 検索によるグラウンディング

Google 検索によるグラウンディングは、Gemini モデルをリアルタイムのウェブコンテンツに接続し、[利用可能なすべての言語](https://ai.google.dev/gemini-api/docs/models/gemini?hl=ja#available-languages)で機能します。これにより、Gemini はより正確な回答を提供し、知識のカットオフを超えて検証可能なソースを引用できます。

グラウンディングは、次のことができるアプリケーションの構築に役立ちます。

*   **事実の正確性を高める:** 実世界の情報を基に回答することで、モデルのハルシネーションを低減します。
*   **リアルタイムの情報にアクセスする:** 最近の出来事やトピックに関する質問に答えます。
*   **引用を提供する:** モデルの主張の出典を示すことで、ユーザーの信頼を築きます。

## コード例

### Python

```python
from google import genai
from google.genai import types

# Configure the client
client = genai.Client()

# Define the grounding tool
grounding_tool = types.Tool(
    google_search=types.GoogleSearch()
)

# Configure generation settings
config = types.GenerateContentConfig(
    tools=[grounding_tool]
)

# Make the request
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Who won the euro 2024?",
    config=config,
)

# Print the grounded response
print(response.text)
```

### JavaScript

```javascript
import { GoogleGenAI } from "@google/genai";

// Configure the client
const ai = new GoogleGenAI({});

// Define the grounding tool
const groundingTool = {
  googleSearch: {},
};

// Configure generation settings
const config = {
  tools: [groundingTool],
};

// Make the request
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "Who won the euro 2024?",
  config,
});

// Print the grounded response
console.log(response.text);
```

### REST

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {"text": "Who won the euro 2024?"}
        ]
      }
    ],
    "tools": [
      {
        "google_search": {}
      }
    ]
  }'
```

詳しくは、[検索ツール ノートブック](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Search_Grounding.ipynb?hl=ja)をご覧ください。

## Google 検索によるグラウンディングの仕組み

`google_search` ツールを有効にすると、モデルは情報の検索、処理、引用のワークフロー全体を自動的に処理します。

![Gemini API Google Search Tool Overview](https://ai.google.dev/static/gemini-api/docs/images/google-search-tool-overview.png?hl=ja)

1.  **ユーザー プロンプト:** アプリケーションは、`google_search` ツールを有効にして、ユーザーのプロンプトを Gemini API に送信します。
2.  **プロンプトの分析:** モデルがプロンプトを分析し、Google 検索で回答を改善できるかどうかを判断します。
3.  **Google 検索:** 必要に応じて、モデルは 1 つ以上の検索クエリを自動的に生成して実行します。
4.  **検索結果の処理:** モデルが検索結果を処理し、情報を合成して回答を作成します。
5.  **根拠のあるレスポンス:** API は、検索結果に基づいて最終的なユーザー フレンドリーなレスポンスを返します。このレスポンスには、モデルのテキスト回答と、検索クエリ、ウェブ検索結果、引用を含む `groundingMetadata` が含まれます。

## グラウンディング レスポンスについて

レスポンスが正常にグラウンディングされると、レスポンスに `groundingMetadata` フィールドが含まれます。この構造化データは、請求を検証し、アプリケーションでリッチな引用エクスペリエンスを構築するために不可欠です。

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Spain won Euro 2024, defeating England 2-1 in the final. This victory marks Spain's record fourth European Championship title."
          }
        ],
        "role": "model"
      },
      "groundingMetadata": {
        "webSearchQueries": [
          "UEFA Euro 2024 winner",
          "who won euro 2024"
        ],
        "searchEntryPoint": {
          "renderedContent": "<!-- HTML and CSS for the search widget -->"
        },
        "groundingChunks": [
          {"web": {"uri": "https://vertexaisearch.cloud.google.com.....", "title": "aljazeera.com"}},
          {"web": {"uri": "https://vertexaisearch.cloud.google.com.....", "title": "uefa.com"}}
        ],
        "groundingSupports": [
          {
            "segment": {"startIndex": 0, "endIndex": 85, "text": "Spain won Euro 2024, defeatin..."},
            "groundingChunkIndices": [0]
          },
          {
            "segment": {"startIndex": 86, "endIndex": 210, "text": "This victory marks Spain's..."},
            "groundingChunkIndices": [0, 1]
          }
        ]
      }
    }
  ]
}
```

Gemini API は、`groundingMetadata` とともに次の情報を返します。

*   `webSearchQueries`: 使用された検索クエリの配列。これは、モデルの推論プロセスをデバッグして理解するのに役立ちます。
*   `searchEntryPoint`: 必要な検索候補をレンダリングするための HTML と CSS が含まれています。使用要件の詳細は、[利用規約](https://ai.google.dev/gemini-api/terms?hl=ja#grounding-with-google-search)をご覧ください。
*   `groundingChunks`: ウェブソース（`uri` と `title`）を含むオブジェクトの配列。
*   `groundingSupports`: モデル レスポンス `text` を `groundingChunks` のソースに接続するチャンクの配列。各チャンクは、テキスト `segment`（`startIndex` と `endIndex` で定義）を 1 つ以上の `groundingChunkIndices` にリンクします。これがインライン引用を作成するうえで重要なポイントです。

Google 検索によるグラウンディングは、[URL コンテキスト ツール](https://ai.google.dev/gemini-api/docs/url-context?hl=ja)と組み合わせて使用することもできます。これにより、一般公開のウェブデータと指定した特定の URL の両方でレスポンスをグラウンディングできます。

## インライン引用によるソースの帰属

API は構造化された引用データを返すため、ユーザー インターフェースでソースを表示する方法を完全に制御できます。`groundingSupports` フィールドと `groundingChunks` フィールドを使用して、モデルのステートメントをソースに直接リンクできます。以下は、メタデータを処理して、インラインのクリック可能な引用を含むレスポンスを作成する一般的なパターンです。

### Python

```python
def add_citations(response):
    text = response.text
    supports = response.candidates[0].grounding_metadata.grounding_supports
    chunks = response.candidates[0].grounding_metadata.grounding_chunks

    # Sort supports by end_index in descending order to avoid shifting issues when inserting.
    sorted_supports = sorted(supports, key=lambda s: s.segment.end_index, reverse=True)

    for support in sorted_supports:
        end_index = support.segment.end_index
        if support.grounding_chunk_indices:
            # Create citation string like [1](link1)[2](link2)
            citation_links = []
            for i in support.grounding_chunk_indices:
                if i < len(chunks):
                    uri = chunks[i].web.uri
                    citation_links.append(f"[{i + 1}]({uri})")

            citation_string = ", ".join(citation_links)
            text = text[:end_index] + citation_string + text[end_index:]

    return text

# Assuming response with grounding metadata
text_with_citations = add_citations(response)
print(text_with_citations)
```

### JavaScript

```javascript
function addCitations(response) {
    let text = response.text;
    const supports = response.candidates[0]?.groundingMetadata?.groundingSupports;
    const chunks = response.candidates[0]?.groundingMetadata?.groundingChunks;

    // Sort supports by end_index in descending order to avoid shifting issues when inserting.
    const sortedSupports = [...supports].sort(
        (a, b) => (b.segment?.endIndex ?? 0) - (a.segment?.endIndex ?? 0),
    );

    for (const support of sortedSupports) {
        const endIndex = support.segment?.endIndex;
        if (endIndex === undefined || !support.groundingChunkIndices?.length) {
        continue;
        }

        const citationLinks = support.groundingChunkIndices
        .map(i => {
            const uri = chunks[i]?.web?.uri;
            if (uri) {
            return `[${i + 1}](${uri})`;
            }
            return null;
        })
        .filter(Boolean);

        if (citationLinks.length > 0) {
        const citationString = citationLinks.join(", ");
        text = text.slice(0, endIndex) + citationString + text.slice(endIndex);
        }
    }

    return text;
}

const textWithCitations = addCitations(response);
console.log(textWithCitations);
```

インライン引用を含む新しいレスポンスは次のようになります。

```
Spain won Euro 2024, defeating England 2-1 in the final.[1](https:/...), [2](https:/...), [4](https:/...), [5](https:/...) This victory marks Spain's record-breaking fourth European Championship title.[5]((https:/...), [2](https:/...), [3](https:/...), [4](https:/...)
```

## 料金

Google 検索でグラウンディングを使用すると、`google_search` ツールを含む API リクエストごとにプロジェクトに課金されます。モデルが単一のプロンプトに回答するために複数の検索クエリを実行すると判断した場合（たとえば、同じ API 呼び出し内で `"UEFA Euro 2024 winner"` と `"Spain vs England Euro 2024 final score"` を検索する場合）、このリクエストに対するツールの課金対象の使用は 1 回とカウントされます。

料金の詳細については、[Gemini API の料金ページ](https://ai.google.dev/gemini-api/docs/pricing?hl=ja)をご覧ください。

## サポートされているモデル

試験運用版とプレビュー版のモデルは含まれません。各モデルの機能については、[モデルの概要](https://ai.google.dev/gemini-api/docs/models?hl=ja)ページをご覧ください。

| モデル               | Google 検索によるグラウンディング |
| :------------------- | :------------------------------- |
| Gemini 2.5 Pro       | ✔️                               |
| Gemini 2.5 Flash     | ✔️                               |
| Gemini 2.0 Flash     | ✔️                               |
| Gemini 1.5 Pro       | ✔️                               |
| Gemini 1.5 Flash     | ✔️                               |

**注:** 古いモデルでは `google_search_retrieval` ツールを使用します。現在のすべてのモデルで、例に示すように `google_search` ツールを使用します。

## Gemini 1.5 モデルを使用したグラウンディング（以前のバージョン）

Gemini 2.0 以降では `google_search` ツールが推奨されますが、Gemini 1.5 では `google_search_retrieval` というレガシー ツールがサポートされています。このツールには、プロンプトに新しい情報が必要であるという確信に基づいて、検索を実行するかどうかをモデルが判断できる `dynamic` モードが用意されています。モデルの信頼度が設定した `dynamic_threshold`（0.0 ～ 1.0 の値）を超えると、検索が実行されます。

### Python

```python
# Note: This is a legacy approach for Gemini 1.5 models.
# The 'google_search' tool is recommended for all new development.
import os
from google import genai
from google.genai import types

client = genai.Client()

retrieval_tool = types.Tool(
    google_search_retrieval=types.GoogleSearchRetrieval(
        dynamic_retrieval_config=types.DynamicRetrievalConfig(
            mode=types.DynamicRetrievalConfigMode.MODE_DYNAMIC,
            dynamic_threshold=0.7 # Only search if confidence > 70%
        )
    )
)

config = types.GenerateContentConfig(
    tools=[retrieval_tool]
)

response = client.models.generate_content(
    model='gemini-1.5-flash',
    contents="Who won the euro 2024?",
    config=config,
)
print(response.text)
if not response.candidates[0].grounding_metadata:
  print("\nModel answered from its own knowledge.")
```

### JavaScript

```javascript
// Note: This is a legacy approach for Gemini 1.5 models.
// The 'googleSearch' tool is recommended for all new development.
import { GoogleGenAI, DynamicRetrievalConfigMode } from "@google/genai";

const ai = new GoogleGenAI({});

const retrievalTool = {
  googleSearchRetrieval: {
    dynamicRetrievalConfig: {
      mode: DynamicRetrievalConfigMode.MODE_DYNAMIC,
      dynamicThreshold: 0.7, // Only search if confidence > 70%
    },
  },
};

const config = {
  tools: [retrievalTool],
};

const response = await ai.models.generateContent({
  model: "gemini-1.5-flash",
  contents: "Who won the euro 2024?",
  config,
});

console.log(response.text);
if (!response.candidates?.[0]?.groundingMetadata) {
  console.log("\nModel answered from its own knowledge.");
}
```

### REST

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "contents": [
      {"parts": [{"text": "Who won the euro 2024?"}]}
    ],
    "tools": [{
      "google_search_retrieval": {
        "dynamic_retrieval_config": {
          "mode": "MODE_DYNAMIC",
          "dynamic_threshold": 0.7
        }
      }
    }]
  }'
```

## 次のステップ

*   [Gemini API クックブックの Google 検索によるグラウンディング](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Search_Grounding.ipynb?hl=ja)を試す。
*   [関数呼び出し](https://ai.google.dev/gemini-api/docs/function-calling?hl=ja)など、その他の利用可能なツールについて学習する。
*   [URL コンテキスト ツール](https://ai.google.dev/gemini-api/docs/url-context?hl=ja)を使用して、特定の URL でプロンプトを拡張する方法について説明します。