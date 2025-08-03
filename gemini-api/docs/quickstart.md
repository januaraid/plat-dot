---
title: Gemini API のクイックスタート  |  Google AI for Developers
description: デベロッパー向け Gemini API を使ってみる
url: https://ai.google.dev/gemini-api/docs/quickstart?hl=ja
image: https://ai.google.dev/static/site-assets/images/quickstart.png?hl=ja
siteName: Google AI for Developers
type: website
twitterCard: summary_large_image
twitterSite: undefined
---
# Gemini API クイックスタート

このクイックスタートでは、Google GenAI SDK をインストールし、最初の Gemini API リクエストを送信する方法について説明します。

## 始める前に

Gemini API キーが必要です。キーがない場合は、[Google AI Studio で無料で取得](https://aistudio.google.com/app/apikey?hl=ja)してください。

## Google GenAI SDK のインストール

### Python

Python 3.9 以降をお使いの場合は、以下の `pip` コマンドで [`google-genai` パッケージ](https://pypi.org/project/google-genai/) をインストールします。

```bash
pip install -q -U google-genai
```

### JavaScript

Node.js v18 以降をお使いの場合は、以下の `npm` コマンドで [Google Gen AI SDK for TypeScript and JavaScript](https://www.npmjs.com/package/@google/genai) をインストールします。

```bash
npm install @google/genai
```

### Go

`go get` コマンドで、モジュールディレクトリに [google.golang.org/genai](https://pkg.go.dev/google.golang.org/genai) をインストールします。

```bash
go get google.golang.org/genai
```

### Java

Maven を使用している場合は、依存関係に以下を追加して [google-genai](https://github.com/googleapis/java-genai) をインストールできます。

```xml
<dependencies>
  <dependency>
    <groupId>com.google.genai</groupId>
    <artifactId>google-genai</artifactId>
    <version>1.0.0</version>
  </dependency>
</dependencies>
```

### Apps Script

1.  新しい Apps Script プロジェクトを作成するには、[script.new](https://script.google.com/u/0/home/projects/create?hl=ja) にアクセスします。
2.  「**無題のプロジェクト**」をクリックします。
3.  プロジェクトの名前を「**AI Studio**」に変更し、「**名前を変更**」をクリックします。
4.  [API キー](https://developers.google.com/apps-script/guides/properties?hl=ja#manage_script_properties_manually)を設定します。
    1.  左側の \[**プロジェクト設定**] アイコンをクリックします。
    2.  \[**スクリプト プロパティ**] で \[**スクリプト プロパティを追加**] をクリックします。
    3.  \[**プロパティ**] にキー名 `GEMINI_API_KEY` を入力します。
    4.  \[**値**] にAPI キーの値を入力します。
    5.  \[**スクリプト プロパティを保存**] をクリックします。
5.  `Code.gs` ファイルの内容を以下のコードに置き換えます。

## 最初の API リクエスト

以下の例では、[`generateContent`](https://ai.google.dev/api/generate-content?hl=ja#method:-models.generatecontent) メソッドを使用して、Gemini 2.5 Flash モデルで Gemini API にリクエストを送信します。

API キーを環境変数 `GEMINI_API_KEY` として設定すると、[Gemini API ライブラリ](https://ai.google.dev/gemini-api/docs/libraries?hl=ja)がクライアントによって自動的に取得されます。それ以外の場合は、クライアントを初期化する際に引数として [API キーを渡す](https://ai.google.dev/gemini-api/docs/api-key?hl=ja#provide-api-key-explicitly)必要があります。

Gemini API ドキュメントのすべてのコードサンプルでは、環境変数 `GEMINI_API_KEY` が設定されていると仮定しています。

### Python

```python
from google import genai

# API キーは環境変数 `GEMINI_API_KEY` から取得されます。
client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Explain how AI works in a few words"
)
print(response.text)
```

### JavaScript

```javascript
import { GoogleGenAI } from "@google/genai";

// API キーは環境変数 `GEMINI_API_KEY` から取得されます。
const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

main();
```

### Go

```go
package main

import (
	"context"
	"fmt"
	"log"

	"google.golang.org/genai"
)

func main() {
	ctx := context.Background()
	// API キーは環境変数 `GEMINI_API_KEY` から取得されます。
	client, err := genai.NewClient(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	result, err := client.Models.GenerateContent(
		ctx,
		"gemini-2.5-flash",
		genai.Text("Explain how AI works in a few words"),
		nil,
	)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(result.Text())
}
```

### Java

```java
package com.example;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;

public class GenerateTextFromTextInput {
  public static void main(String[] args) {
    // API キーは環境変数 `GEMINI_API_KEY` から取得されます。
    Client client = new Client();

    GenerateContentResponse response =
        client.models.generateContent(
            "gemini-2.5-flash",
            "Explain how AI works in a few words",
            null);

    System.out.println(response.text());
  }
}
```

### Apps Script

```javascript
// API キーの設定方法については、https://developers.google.com/apps-script/guides/properties を参照してください。
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
function main() {
  const payload = {
    contents: [
      {
        parts: [
          { text: 'Explain how AI works in a few words' },
        ],
      },
    ],
  };

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: {
      'x-goog-api-key': apiKey,
    },
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response);
  const content = data['candidates'][0]['content']['parts'][0]['text'];
  console.log(content);
}
```

### REST

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }'
```

## 「思考」機能について

このサイトの多くのコードサンプルでは、Gemini 2.5 Flash モデルを使用しています。このモデルでは、回答の質を高めるために「思考」機能がデフォルトで有効になっています。これにより、応答時間とトークン使用量が増加する可能性があります。スピードを優先する場合や、費用を最小限に抑えたい場合は、以下の例のように思考予算をゼロに設定してこの機能を無効にできます。詳細については、[思考ガイド](https://ai.google.dev/gemini-api/docs/thinking?hl=ja#set-budget)を参照してください。

**注:** 「思考」機能は Gemini 2.5 シリーズのモデルでのみ利用可能であり、Gemini 2.5 Pro では無効にできません。

### Python

```python
from google import genai
from google.genai import types

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Explain how AI works in a few words",
    config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=0) # 思考を無効化
    ),
)
print(response.text)
```

### JavaScript

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works in a few words",
    config: {
      thinkingConfig: {
        thinkingBudget: 0, // 思考を無効化
      },
    }
  });
  console.log(response.text);
}

await main();
```

### Go

```go
package main

import (
	"context"
	"fmt"
	"log"

	"google.golang.org/genai"
)

func main() {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	result, err := client.Models.GenerateContent(
		ctx,
		"gemini-2.5-flash",
		genai.Text("Explain how AI works in a few words"),
		&genai.GenerateContentConfig{
			ThinkingConfig: &genai.ThinkingConfig{
				ThinkingBudget: 0, // 思考を無効化
			},
		},
	)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(result.Text())
}

```

### REST

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ],
    "generationConfig": {
      "thinkingConfig": {
        "thinkingBudget": 0
      }
    }
  }'
```

### Apps Script

```javascript
// API キーの設定方法については、https://developers.google.com/apps-script/guides/properties を参照してください。
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function main() {
  const payload = {
    contents: [
      {
        parts: [
          { text: 'Explain how AI works in a few words' },
        ],
      },
    ],
  };

  // 「思考」を無効にするための `generationConfig` を追加
  const config = {
    generationConfig: {
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  };

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: {
      'x-goog-api-key': apiKey,
    },
    payload: JSON.stringify({...payload, ...config}) // payload と config をマージ
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response);
  const content = data['candidates'][0]['content']['parts'][0]['text'];
  console.log(content);
}
```

## 次のステップ

最初の API リクエストを作成できたら、Gemini の機能をさらに深く理解するために、以下のガイドを参照してください。

*   [思考](https://ai.google.dev/gemini-api/docs/thinking?hl=ja)
*   [テキスト生成](https://ai.google.dev/gemini-api/docs/text-generation?hl=ja)
*   [画像認識 (Vision)](https://ai.google.dev/gemini-api/docs/vision?hl=ja)
*   [長いコンテキスト](https://ai.google.dev/gemini-api/docs/long-context?hl=ja)
*   [エンベディング](https://ai.google.dev/gemini-api/docs/embeddings?hl=ja)