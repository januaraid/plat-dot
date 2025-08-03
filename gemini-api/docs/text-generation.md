---
title: テキスト生成  |  Gemini API  |  Google AI for Developers
description: Gemini API を使用してチャットアプリとテキスト生成アプリの構築を開始する
url: https://ai.google.dev/gemini-api/docs/text-generation?hl=ja
image: https://ai.google.dev/static/site-assets/images/text-generation.png?hl=ja
siteName: Google AI for Developers
type: website
twitterCard: summary_large_image
twitterSite: undefined
---
# Gemini API によるテキスト生成

Gemini API を使用すると、Gemini モデルを活用して、テキスト、画像、動画、音声など、さまざまな入力からテキスト出力を生成できます。

## 基本的なテキスト生成

単一のテキスト入力を受け取る基本的な例を以下に示します。

### Python

```python
from google import genai

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="How does AI work?"
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
    contents: "How does AI work?",
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
  "log" // log パッケージを追加 
  "os"
  "google.golang.org/genai"
)

func main() {
  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err) // log.Fatal を使用
  }

  result, err := client.Models.GenerateContent( // err を追加
      ctx,
      "gemini-2.5-flash",
      genai.Text("Explain how AI works in a few words"),
      nil,
  )
  if err != nil { // err をチェック
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
            "text": "How does AI work?"
          }
        ]
      }
    ]
  }'
```

### Apps Script

```javascript
// See https://developers.google.com/apps-script/guides/properties
// for instructions on how to set the API key.
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function main() {
  const payload = {
    contents: [
      {
        parts: [
          { text: 'How AI does work?' },
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

## Gemini 2.5 による思考

Gemini 2.5 Flash および Pro モデルでは、品質向上のために **思考 (Thinking)** がデフォルトで有効になっています。これにより、処理に時間がかかり、トークン消費量が増加する可能性があります。

2.5 Flash モデルを使用する場合、思考予算をゼロに設定することで思考を無効にできます。

詳細については、[思考ガイド](https://ai.google.dev/gemini-api/docs/thinking?hl=ja#set-budget)を参照してください。

### Python

```python
from google import genai
from google.genai import types

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="How does AI work?",
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
    contents: "How does AI work?",
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
  "log" // log パッケージを追加
  "os"
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
      genai.Text("How does AI work?"),
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
            "text": "How does AI work?"
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
// See https://developers.google.com/apps-script/guides/properties
// for instructions on how to set the API key.
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function main() {
  const payload = {
    contents: [
      {
        parts: [
          { text: 'How AI does work?' },
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

## システム指示とその他の設定

**システム指示**を使用して Gemini モデルの動作を制御できます。これを行うには、[`GenerateContentConfig`](https://ai.google.dev/api/generate-content?hl=ja#v1beta.GenerationConfig) オブジェクトを渡します。

### Python

```python
from google import genai
from google.genai import types

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    config=types.GenerateContentConfig(
        system_instruction="You are a cat. Your name is Neko."),
    contents="Hello there"
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
    contents: "Hello there",
    config: {
      systemInstruction: "You are a cat. Your name is Neko.",
    },
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
  "log" // log パッケージを追加
  "os"
  "google.golang.org/genai"
)

func main() {
  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  config := &genai.GenerateContentConfig{
      SystemInstruction: genai.NewContentFromText("You are a cat. Your name is Neko.", genai.RoleUser),
  }

  result, err := client.Models.GenerateContent(
      ctx,
      "gemini-2.5-flash",
      genai.Text("Hello there"),
      config,
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
  -d '{
    "system_instruction": {
      "parts": [
        {
          "text": "You are a cat. Your name is Neko."
        }
      ]
    },
    "contents": [
      {
        "parts": [
          {
            "text": "Hello there"
          }
        ]
      }
    ]
  }'
```

### Apps Script

```javascript
// See https://developers.google.com/apps-script/guides/properties
// for instructions on how to set the API key.
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function main() {
  const systemInstruction = {
    parts: [{
      text: 'You are a cat. Your name is Neko.'
    }]
  };

  const payload = {
    systemInstruction,
    contents: [
      {
        parts: [
          { text: 'Hello there' },
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

[`GenerateContentConfig`](https://ai.google.dev/api/generate-content?hl=ja#v1beta.GenerationConfig) オブジェクトを使用すると、[温度 (temperature)](https://ai.google.dev/api/generate-content?hl=ja#v1beta.GenerationConfig) などのデフォルトの生成パラメータをオーバーライドすることもできます。

### Python

```python
from google import genai
from google.genai import types

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=["Explain how AI works"],
    config=types.GenerateContentConfig(
        temperature=0.1
    )
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
    contents: "Explain how AI works",
    config: {
      temperature: 0.1,
    },
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
  "log" // log パッケージを追加
  "os"
  "google.golang.org/genai"
)

func main() {
  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  // float32 型の変数を定義
  temp := float32(0.9)
  topP := float32(0.5)
  topK := float32(20.0)

  config := &genai.GenerateContentConfig{
    Temperature:       &temp,
    TopP:              &topP,
    TopK:              &topK,
    ResponseMIMEType:  "application/json",
  }

  result, err := client.Models.GenerateContent(
    ctx,
    "gemini-2.5-flash",
    genai.Text("What is the average size of a swallow?"),
    config,
  )
  if err != nil {
      log.Fatal(err)
  }

  fmt.Println(result.Text())
}
```

### REST

```bash
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works"
          }
        ]
      }
    ],
    "generationConfig": {
      "stopSequences": [
        "Title"
      ],
      "temperature": 1.0,
      "topP": 0.8,
      "topK": 10
    }
  }'
```

### Apps Script

```javascript
// See https://developers.google.com/apps-script/guides/properties
// for instructions on how to set the API key.
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function main() {
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    responseMimeType: 'text/plain',
  };

  const payload = {
    generationConfig,
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

構成可能なパラメータとその説明の完全なリストについては、API リファレンスの [`GenerateContentConfig`](https://ai.google.dev/api/generate-content?hl=ja#v1beta.GenerationConfig) を参照してください。

## マルチモーダル入力

Gemini API はマルチモーダル入力をサポートしており、テキストとメディア ファイルを組み合わせることができます。以下は、画像を提供する方法の例です。

### Python

```python
from PIL import Image
from google import genai

client = genai.Client()

image = Image.open("/path/to/organ.png")
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[image, "Tell me about this instrument"]
)
print(response.text)
```

### JavaScript

```javascript
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const image = await ai.files.upload({
    file: "/path/to/organ.png",
  });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      createUserContent([
        "Tell me about this instrument",
        createPartFromUri(image.uri, image.mimeType),
      ]),
    ],
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
  "log" // log パッケージを追加
  "os"
  "google.golang.org/genai"
)

func main() {
  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  imagePath := "/path/to/organ.jpg"
  imgData, err := os.ReadFile(imagePath)
  if err != nil { // err をチェック
      log.Fatal(err)
  }

  parts := []*genai.Part{
      genai.NewPartFromText("Tell me about this instrument"),
      &genai.Part{
          InlineData: &genai.Blob{
              MIMEType: "image/jpeg",
              Data:     imgData,
          },
      },
  }

  contents := []*genai.Content{
      genai.NewContentFromParts(parts, genai.RoleUser),
  }

  result, err := client.Models.GenerateContent(
      ctx,
      "gemini-2.5-flash",
      contents,
      nil,
  )
  if err != nil {
      log.Fatal(err)
  }

  fmt.Println(result.Text())
}
```

### REST

```bash
# Base64 エンコードされた画像データを保持する一時ファイルを使用
TEMP_B64=$(mktemp)
trap 'rm -f "$TEMP_B64"' EXIT
base64 $B64FLAGS $IMG_PATH > "$TEMP_B64"

# JSON ペイロードを保持する一時ファイルを使用
TEMP_JSON=$(mktemp)
trap 'rm -f "$TEMP_JSON"' EXIT

cat > "$TEMP_JSON" << EOF
{
  "contents": [
    {
      "parts": [
        {
          "text": "Tell me about this instrument"
        },
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "$(cat "$TEMP_B64")"
          }
        }
      ]
    }
  ]
}
EOF

curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d "@$TEMP_JSON"
```

### Apps Script

```javascript
// See https://developers.google.com/apps-script/guides/properties
// for instructions on how to set the API key.
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function main() {
  const imageUrl = 'http://image/url';
  const image = getImageData(imageUrl);
  const payload = {
    contents: [
      {
        parts: [
          { image },
          { text: 'Tell me about this instrument' },
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

function getImageData(url) {
  const blob = UrlFetchApp.fetch(url).getBlob();

  return {
    mimeType: blob.getContentType(),
    data: Utilities.base64Encode(blob.getBytes())
  };
}
```

画像を提供する別の方法や、より高度な画像処理については、[画像認識ガイド](https://ai.google.dev/gemini-api/docs/image-understanding?hl=ja)を参照してください。この API は、[ドキュメント](https://ai.google.dev/gemini-api/docs/document-processing?hl=ja)、[動画](https://ai.google.dev/gemini-api/docs/video-understanding?hl=ja)、[音声](https://ai.google.dev/gemini-api/docs/audio?hl=ja)の入力と理解もサポートしています。

## ストリーミング レスポンス

デフォルトでは、モデルは生成プロセス全体が完了した後にのみレスポンスを返します。

よりスムーズなインタラクションを実現するには、ストリーミングを使用して、[`GenerateContentResponse`](https://ai.google.dev/api/generate-content?hl=ja#v1beta.GenerateContentResponse) インスタンスが生成されるたびに増分で受信します。

### Python

```python
from google import genai

client = genai.Client()

response = client.models.generate_content_stream(
    model="gemini-2.5-flash",
    contents=["Explain how AI works"]
)
for chunk in response:
    print(chunk.text, end="")
```

### JavaScript

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works",
  });

  for await (const chunk of response) {
    console.log(chunk.text);
  }
}

await main();
```

### Go

```go
package main

import (
  "context"
  "fmt"
  "log" // log パッケージを追加
  "os"
  "google.golang.org/genai"
)

func main() {
  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  stream, err := client.Models.GenerateContentStream(
      ctx,
      "gemini-2.5-flash",
      genai.Text("Write a story about a magic backpack."),
      nil,
  )
  if err != nil { // err をチェック
      log.Fatal(err)
  }

  for chunk := range stream {
      if len(chunk.Candidates) > 0 && len(chunk.Candidates[0].Content.Parts) > 0 {
          part := chunk.Candidates[0].Content.Parts[0]
          fmt.Print(part.Text)
      }
  }
}
```

### REST

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  --no-buffer \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works"
          }
        ]
      }
    ]
  }'
```

### Apps Script

```javascript
// See https://developers.google.com/apps-script/guides/properties
// for instructions on how to set the API key.
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function main() {
  const payload = {
    contents: [
      {
        parts: [
          { text: 'Explain how AI works' },
        ],
      },
    ],
  };

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent';
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

## マルチターン会話（チャット）

Google の SDK には、複数のプロンプトとレスポンスをチャットに収集する機能が用意されています。これにより、会話の履歴を簡単に追跡できます。

**注:** チャット機能は SDK の一部としてのみ実装されています。バックグラウンドでは、引き続き [`generateContent`](https://ai.google.dev/api/generate-content?hl=ja#method:-models.generatecontent) API が使用されます。マルチターンの会話では、後続のターンごとに会話履歴全体がモデルに送信されます。

### Python

```python
from google import genai

client = genai.Client()
chat = client.chats.create(model="gemini-2.5-flash")

response = chat.send_message("I have 2 dogs in my house.")
print(response.text)

response = chat.send_message("How many paws are in my house?")
print(response.text)

for message in chat.get_history():
    print(f'role - {message.role}',end=": ")
    print(message.parts[0].text)
```

### JavaScript

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: [
      {
        role: "user",
        parts: [{ text: "Hello" }],
      },
      {
        role: "model",
        parts: [{ text: "Great to meet you. What would you like to know?" }],
      },
    ],
  });

  const response1 = await chat.sendMessage({
    message: "I have 2 dogs in my house.",
  });
  console.log("Chat response 1:", response1.text);

  const response2 = await chat.sendMessage({
    message: "How many paws are in my house?",
  });
  console.log("Chat response 2:", response2.text);
}

await main();
```

### Go

```go
package main

import (
  "context"
  "fmt"
  "log" // log パッケージを追加
  "os"
  "google.golang.org/genai"
)

func main() {
  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  history := []*genai.Content{
      genai.NewContentFromText("Hi nice to meet you! I have 2 dogs in my house.", genai.RoleUser),
      genai.NewContentFromText("Great to meet you. What would you like to know?", genai.RoleModel),
  }

  chat, err := client.Chats.Create(ctx, "gemini-2.5-flash", nil, history)
  if err != nil { // err をチェック
      log.Fatal(err)
  }

  res, err := chat.SendMessage(ctx, genai.Part{Text: "How many paws are in my house?"})
  if err != nil { // err をチェック
      log.Fatal(err)
  }


  if len(res.Candidates) > 0 && len(res.Candidates[0].Content.Parts) > 0 {
      fmt.Println(res.Candidates[0].Content.Parts[0].Text)
  }
}
```

### REST

```bash
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": "Hello"
          }
        ]
      },
      {
        "role": "model",
        "parts": [
          {
            "text": "Great to meet you. What would you like to know?"
          }
        ]
      },
      {
        "role": "user",
        "parts": [
          {
            "text": "I have two dogs in my house. How many paws are in my house?"
          }
        ]
      }
    ]
  }'
```

### Apps Script

```javascript
// See https://developers.google.com/apps-script/guides/properties
// for instructions on how to set the API key.
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function main() {
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: 'Hello' },
        ],
      },
      {
        role: 'model',
        parts: [
          { text: 'Great to meet you. What would you like to know?' },
        ],
      },
      {
        role: 'user',
        parts: [
          { text: 'I have two dogs in my house. How many paws are in my house?' },
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

ストリーミングは、マルチターンの会話にも使用できます。

### Python

```python
from google import genai

client = genai.Client()
chat = client.chats.create(model="gemini-2.5-flash")

response = chat.send_message_stream("I have 2 dogs in my house.")
for chunk in response:
    print(chunk.text, end="")

response = chat.send_message_stream("How many paws are in my house?")
for chunk in response:
    print(chunk.text, end="")

for message in chat.get_history():
    print(f'role - {message.role}', end=": ")
    print(message.parts[0].text)
```

### JavaScript

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: [
      {
        role: "user",
        parts: [{ text: "Hello" }],
      },
      {
        role: "model",
        parts: [{ text: "Great to meet you. What would you like to know?" }],
      },
    ],
  });

  const stream1 = await chat.sendMessageStream({
    message: "I have 2 dogs in my house.",
  });
  for await (const chunk of stream1) {
    console.log(chunk.text);
    console.log("_".repeat(80));
  }

  const stream2 = await chat.sendMessageStream({
    message: "How many paws are in my house?",
  });
  for await (const chunk of stream2) {
    console.log(chunk.text);
    console.log("_".repeat(80));
  }
}

await main();
```

### Go

```go
package main

import (
  "context"
  "fmt"
  "log" // log パッケージを追加
  "os"
  "google.golang.org/genai"
)

func main() {
  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  history := []*genai.Content{
      genai.NewContentFromText("Hi nice to meet you! I have 2 dogs in my house.", genai.RoleUser),
      genai.NewContentFromText("Great to meet you. What would you like to know?", genai.RoleModel),
  }

  chat, err := client.Chats.Create(ctx, "gemini-2.5-flash", nil, history)
  if err != nil {
      log.Fatal(err)
  }

  stream := chat.SendMessageStream(ctx, genai.Part{Text: "How many paws are in my house?"})

  for chunk := range stream {
      if len(chunk.Candidates) > 0 && len(chunk.Candidates[0].Content.Parts) > 0 {
          part := chunk.Candidates[0].Content.Parts[0]
          fmt.Print(part.Text)
      }
  }
}
```

### REST

```bash
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": "Hello"
          }
        ]
      },
      {
        "role": "model",
        "parts": [
          {
            "text": "Great to meet you. What would you like to know?"
          }
        ]
      },
      {
        "role": "user",
        "parts": [
          {
            "text": "I have two dogs in my house. How many paws are in my house?"
          }
        ]
      }
    ]
  }'
```

### Apps Script

```javascript
// See https://developers.google.com/apps-script/guides/properties
// for instructions on how to set the API key.
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function main() {
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: 'Hello' },
        ],
      },
      {
        role: 'model',
        parts: [
          { text: 'Great to meet you. What would you like to know?' },
        ],
      },
      {
        role: 'user',
        parts: [
          { text: 'I have two dogs in my house. How many paws are in my house?' },
        ],
      },
    ],
  };

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent';
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

## サポートされているモデル

Gemini ファミリーのすべてのモデルは、テキスト生成をサポートしています。モデルとその機能の詳細については、[モデル](https://ai.google.dev/gemini-api/docs/models?hl=ja)のページを参照してください。

## ベスト プラクティス

### プロンプトに関するヒント

基本的なテキスト生成では、例、システム指示、特定の形式がなくても、[ゼロショット (zero-shot)](https://ai.google.dev/gemini-api/docs/prompting-strategies?hl=ja#few-shot) プロンプトで十分なことがよくあります。

よりカスタマイズされた出力の場合：

*   [システム指示](#system-instructions)を使用してモデルをガイドします。
*   モデルをガイドするために、入力と出力の例をいくつか提供します。これは、[少数ショット (few-shot)](https://ai.google.dev/gemini-api/docs/prompting-strategies?hl=ja#few-shot) プロンプトと呼ばれることがあります。

その他のヒントについては、[プロンプト エンジニアリング ガイド](https://ai.google.dev/gemini/docs/prompting-strategies?hl=ja)を参照してください。

### 構造化出力

場合によっては、JSON などの構造化された出力が必要になることがあります。方法については、[構造化出力](https://ai.google.dev/gemini-api/docs/structured-output?hl=ja)ガイドを参照してください。

## 次のステップ

*   [Gemini API のスタートガイドの Colab](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Get_started.ipynb?hl=ja) を試す。
*   Gemini の[画像](https://ai.google.dev/gemini-api/docs/image-understanding?hl=ja)、[動画](https://ai.google.dev/gemini-api/docs/video-understanding?hl=ja)、[音声](https://ai.google.dev/gemini-api/docs/audio?hl=ja)、[ドキュメントの理解機能をご覧ください。](https://ai.google.dev/gemini-api/docs/document-processing?hl=ja)
*   マルチモーダル [ファイル プロンプト戦略](https://ai.google.dev/gemini-api/docs/files?hl=ja#prompt-guide)について学習する。