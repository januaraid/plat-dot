---
title: 画像の理解  |  Gemini API  |  Google AI for Developers
description: Gemini API で Gemini のマルチモーダル機能を使用して構築を開始する
url: https://ai.google.dev/gemini-api/docs/image-understanding?hl=ja
image: https://ai.google.dev/static/site-assets/images/vision.png?hl=ja
siteName: Google AI for Developers
type: website
twitterCard: summary_large_image
twitterSite: undefined
---
# 画像の理解

Gemini モデルはマルチモーダルとしてゼロから構築されているため、画像キャプション、分類、視覚的な質問応答など、幅広い画像処理とコンピュータ ビジョンのタスクを、専用の ML モデルをトレーニングすることなく実行できます。

**ヒント:** Gemini モデル（2.0 以降）は、一般的なマルチモーダル機能に加えて、追加のトレーニングにより、[オブジェクト検出](#object-detection)や[セグメンテーション](#segmentation)などの特定のユースケースで**精度が向上**しています。詳しくは、[機能](#capabilities)セクションをご覧ください。

## Gemini に画像を渡す

Gemini に画像を渡す方法は 2 つあります。

*   [インライン画像データの渡し方](#inline-image): 小さいファイル（プロンプトを含むリクエストの合計サイズが 20 MB 未満）に最適です。
*   [File API を使用した画像のアップロード](#upload-image): 大きなファイルや、複数のリクエストで画像を再利用する場合におすすめです。

### インライン画像データの渡し方

`generateContent` へのリクエストでインライン画像データを渡すことができます。画像データは、Base64 エンコード文字列として提供するか、ローカルファイルを直接読み取って提供できます（言語によって異なります）。

以下の例は、ローカル ファイルから画像を読み取り、処理のために `generateContent` API に渡す方法を示しています。

#### Python

```python
from google.genai import types

with open('path/to/small-sample.jpg', 'rb') as f:
    image_bytes = f.read()

response = client.models.generate_content(
  model='gemini-2.5-flash',
  contents=[
    types.Part.from_bytes(
      data=image_bytes,
      mime_type='image/jpeg',
    ),
    'Caption this image.'
  ]
)

print(response.text)
```

#### JavaScript

```javascript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

const ai = new GoogleGenAI({});
const base64ImageFile = fs.readFileSync("path/to/small-sample.jpg", {
  encoding: "base64",
});

const contents = [
  {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64ImageFile,
    },
  },
  { text: "Caption this image." },
];

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: contents,
});
console.log(response.text);
```

#### Go

```go
package main

import (
  "context"
  "fmt"
  "log"
  "os"

  "google.golang.org/api/option"
  "github.com/google/generative-ai-go/genai"
)

func main() {
  ctx := context.Background()
  // Access your API key as an environment variable (see "Set up your API key").
  client, err := genai.NewClient(ctx, option.WithAPIKey(os.Getenv("GEMINI_API_KEY")))
  if err != nil {
      log.Fatal(err)
  }
  defer client.Close()

  bytes, err := os.ReadFile("path/to/small-sample.jpg")
  if err != nil {
      log.Fatal(err)
  }

  parts := []*genai.Part{
    genai.NewPartFromBytes(bytes, "image/jpeg"),
    genai.NewPartFromText("Caption this image."),
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

#### REST

```bash
IMG_PATH="/path/to/your/image1.jpg"

if [[ "$(base64 --version 2>&1)" = *"FreeBSD"* ]]; then
B64FLAGS="--input"
else
B64FLAGS="-w0"
fi

curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
-H "x-goog-api-key: $GEMINI_API_KEY" \
-H 'Content-Type: application/json' \
-X POST \
-d '{
    "contents": [{
    "parts":[
        {
            "inline_data": {
            "mime_type":"image/jpeg",
            "data": "'"$(base64 $B64FLAGS $IMG_PATH)"'"
            }
        },
        {"text": "Caption this image."},
    ]
    }]
}' 2> /dev/null
```

次の例に示すように、URL から画像を取得してバイトに変換し、`generateContent` に渡すこともできます。

#### Python

```python
from google import genai
from google.genai import types

import requests

image_path = "https://goo.gle/instrument-img"
image_bytes = requests.get(image_path).content
image = types.Part.from_bytes(
  data=image_bytes, mime_type="image/jpeg"
)

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=["What is this image?", image],
)

print(response.text)
```

#### JavaScript

```javascript
import { GoogleGenAI } from "@google/genai";

async function main() {
  const ai = new GoogleGenAI({});

  const imageUrl = "https://goo.gle/instrument-img";

  const response = await fetch(imageUrl);
  const imageArrayBuffer = await response.arrayBuffer();
  const base64ImageData = Buffer.from(imageArrayBuffer).toString('base64');

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64ImageData,
      },
    },
    { text: "Caption this image." }
  ],
  });
  console.log(result.text);
}

main();
```

#### Go

```go
package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

func main() {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(os.Getenv("GEMINI_API_KEY")))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	// Download the image.
	imageResp, err := http.Get("https://goo.gle/instrument-img")
	if err != nil {
		log.Fatal(err)
	}
	defer imageResp.Body.Close()

	imageBytes, err := io.ReadAll(imageResp.Body)
	if err != nil {
		log.Fatal(err)
	}

	parts := []*genai.Part{
		genai.NewPartFromBytes(imageBytes, "image/jpeg"),
		genai.NewPartFromText("Caption this image."),
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

#### REST

```bash
IMG_URL="https://goo.gle/instrument-img"

MIME_TYPE=$(curl -sIL "$IMG_URL" | grep -i '^content-type:' | awk -F ': ' '{print $2}' | sed 's/\r$//' | head -n 1)
if [[ -z "$MIME_TYPE" || ! "$MIME_TYPE" == image/* ]]; then
  MIME_TYPE="image/jpeg"
fi

# Check for macOS
if [[ "$(uname)" == "Darwin" ]]; then
  IMAGE_B64=$(curl -sL "$IMG_URL" | base64 -b 0)
elif [[ "$(base64 --version 2>&1)" = *"FreeBSD"* ]]; then
  IMAGE_B64=$(curl -sL "$IMG_URL" | base64)
else
  IMAGE_B64=$(curl -sL "$IMG_URL" | base64 -w0)
fi

curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
      "contents": [{
        "parts":[
            {
              "inline_data": {
                "mime_type":"'"$MIME_TYPE"'",
                "data": "'"$IMAGE_B64"'"
              }
            },
            {"text": "Caption this image."}
        ]
      }]
    }' 2> /dev/null
```

**注:** インライン画像データを使用すると、リクエストの合計サイズ（テキスト プロンプト、システム指示、インライン バイト）が 20 MB に制限されます。リクエストが大きい場合は、File API を使用して[画像ファイルをアップロード](#upload-image)します。Files API は、同じ画像を繰り返し使用するシナリオでも効率的です。

### File API を使用した画像のアップロード

大きなファイルの場合や、同じ画像ファイルを繰り返し使用できるようにするには、Files API を使用します。次のコードは、画像ファイルをアップロードし、`generateContent` の呼び出しでそのファイルを使用します。詳細と例については、[Files API ガイド](https://ai.google.dev/gemini-api/docs/files?hl=ja)を参照してください。

#### Python

```python
from google import genai

client = genai.Client()

my_file = client.files.upload(file="path/to/sample.jpg")

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[my_file, "Caption this image."],
)

print(response.text)
```

#### JavaScript

```javascript
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const myfile = await ai.files.upload({
    file: "path/to/sample.jpg",
    config: { mimeType: "image/jpeg" },
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: createUserContent([
      createPartFromUri(myfile.uri, myfile.mimeType),
      "Caption this image.",
    ]),
  });
  console.log(response.text);
}

await main();
```

#### Go

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

func main() {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(os.Getenv("GEMINI_API_KEY")))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	uploadedFile, err := client.Files.UploadFromPath(ctx, "path/to/sample.jpg", nil)
	if err != nil {
		log.Fatal(err)
	}

	parts := []*genai.Part{
		genai.NewPartFromText("Caption this image."),
		genai.NewPartFromURI(uploadedFile.URI, uploadedFile.MIMEType),
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

#### REST

```bash
IMAGE_PATH="path/to/sample.jpg"
MIME_TYPE=$(file -b --mime-type "${IMAGE_PATH}")
NUM_BYTES=$(wc -c < "${IMAGE_PATH}")
DISPLAY_NAME=IMAGE

tmp_header_file=upload-header.tmp

# Initial resumable request defining metadata.
# The upload url is in the response headers dump them to a file.
curl "https://generativelanguage.googleapis.com/upload/v1beta/files" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -D upload-header.tmp \
  -H "X-Goog-Upload-Protocol: resumable" \
  -H "X-Goog-Upload-Command: start" \
  -H "X-Goog-Upload-Header-Content-Length: ${NUM_BYTES}" \
  -H "X-Goog-Upload-Header-Content-Type: ${MIME_TYPE}" \
  -H "Content-Type: application/json" \
  -d "{'file': {'display_name': '${DISPLAY_NAME}'}}" 2> /dev/null

upload_url=$(grep -i "x-goog-upload-url: " "${tmp_header_file}" | cut -d" " -f2 | tr -d "\r")
rm "${tmp_header_file}"

# Upload the actual bytes.
curl "${upload_url}" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Length: ${NUM_BYTES}" \
  -H "X-Goog-Upload-Offset: 0" \
  -H "X-Goog-Upload-Command: upload, finalize" \
  --data-binary "@${IMAGE_PATH}" 2> /dev/null > file_info.json

file_uri=$(jq -r ".file.uri" file_info.json)
echo file_uri=$file_uri

# Now generate content using that file
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
      "contents": [{
        "parts":[
          {"file_data":{"mime_type": "'"${MIME_TYPE}"'", "file_uri": "'"${file_uri}"'"}},
          {"text": "Caption this image."}
        ]
      }]
    }' 2> /dev/null > response.json

cat response.json
echo

jq ".candidates[].content.parts[].text" response.json
```

## 複数の画像を使用したプロンプト

`contents` 配列に複数の画像 `Part` オブジェクトを含めることで、1 つのプロンプトで複数の画像を指定できます。インライン データ（ローカル ファイルまたは URL）と File API 参照を混在させることができます。

#### Python

```python
from google import genai
from google.genai import types

client = genai.Client()

# Upload the first image
image1_path = "path/to/image1.jpg"
uploaded_file = client.files.upload(file=image1_path)

# Prepare the second image as inline data
image2_path = "path/to/image2.png"
with open(image2_path, 'rb') as f:
    img2_bytes = f.read()

# Create the prompt with text and multiple images
response = client.models.generate_content(

    model="gemini-2.5-flash",
    contents=[
        "What is different between these two images?",
        uploaded_file,  # Use the uploaded file reference
        types.Part.from_bytes(
            data=img2_bytes,
            mime_type='image/png'
        )
    ]
)

print(response.text)
```

#### JavaScript

```javascript
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import * as fs from "node:fs";

const ai = new GoogleGenAI({});

async function main() {
  // Upload the first image
  const image1_path = "path/to/image1.jpg";
  const uploadedFile = await ai.files.upload({
    file: image1_path,
    config: { mimeType: "image/jpeg" },
  });

  // Prepare the second image as inline data
  const image2_path = "path/to/image2.png";
  const base64Image2File = fs.readFileSync(image2_path, {
    encoding: "base64",
  });

  // Create the prompt with text and multiple images

  const response = await ai.models.generateContent({

    model: "gemini-2.5-flash",
    contents: createUserContent([
      "What is different between these two images?",
      createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
      {
        inlineData: {
          mimeType: "image/png",
          data: base64Image2File,
        },
      },
    ]),
  });
  console.log(response.text);
}

await main();
```

#### Go

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

func main() {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(os.Getenv("GEMINI_API_KEY")))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	// Upload the first image
	image1Path := "path/to/image1.jpg"
	uploadedFile, err := client.Files.UploadFromPath(ctx, image1Path, nil)
	if err != nil {
		log.Fatal(err)
	}

	// Prepare the second image as inline data
	image2Path := "path/to/image2.jpeg"
	imgBytes, err := os.ReadFile(image2Path)
	if err != nil {
		log.Fatal(err)
	}

	parts := []*genai.Part{
		genai.NewPartFromText("What is different between these two images?"),
		genai.NewPartFromBytes(imgBytes, "image/jpeg"),
		genai.NewPartFromURI(uploadedFile.URI, uploadedFile.MIMEType),
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

#### REST

```bash
# Upload the first image
IMAGE1_PATH="path/to/image1.jpg"
MIME1_TYPE=$(file -b --mime-type "${IMAGE1_PATH}")
NUM1_BYTES=$(wc -c < "${IMAGE1_PATH}")
DISPLAY_NAME1=IMAGE

tmp_header_file1=upload-header1.tmp

curl "https://generativelanguage.googleapis.com/upload/v1beta/files" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -D upload-header1.tmp \
  -H "X-Goog-Upload-Protocol: resumable" \
  -H "X-Goog-Upload-Command: start" \
  -H "X-Goog-Upload-Header-Content-Length: ${NUM1_BYTES}" \
  -H "X-Goog-Upload-Header-Content-Type: ${MIME1_TYPE}" \
  -H "Content-Type: application/json" \
  -d "{'file': {'display_name': '${DISPLAY_NAME1}'}}" 2> /dev/null

upload_url1=$(grep -i "x-goog-upload-url: " "${tmp_header_file1}" | cut -d" " -f2 | tr -d "\r")
rm "${tmp_header_file1}"

curl "${upload_url1}" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Length: ${NUM1_BYTES}" \
  -H "X-Goog-Upload-Offset: 0" \
  -H "X-Goog-Upload-Command: upload, finalize" \
  --data-binary "@${IMAGE1_PATH}" 2> /dev/null > file_info1.json

file1_uri=$(jq ".file.uri" file_info1.json)
echo file1_uri=$file1_uri

# Prepare the second image (inline)
IMAGE2_PATH="path/to/image2.png"
MIME2_TYPE=$(file -b --mime-type "${IMAGE2_PATH}")

if [[ "$(base64 --version 2>&1)" = *"FreeBSD"* ]]; then
  B64FLAGS="--input"
else
  B64FLAGS="-w0"
fi
IMAGE2_BASE64=$(base64 $B64FLAGS $IMAGE2_PATH)

# Now generate content using both images
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
      "contents": [{
        "parts":[
          {"text": "What is different between these two images?"},
          {"file_data":{"mime_type": "'"${MIME1_TYPE}"'", "file_uri": '$file1_uri'}},
          {
            "inline_data": {
              "mime_type":"'"${MIME2_TYPE}"'",
              "data": "'"$IMAGE2_BASE64"'"
            }
          }
        ]
      }]
    }' 2> /dev/null > response.json

cat response.json
echo

jq ".candidates[].content.parts[].text" response.json
```

## オブジェクト検出

Gemini 2.0 以降では、画像内のオブジェクトを検出し、そのバウンディング ボックスの座標を取得するようにモデルがさらにトレーニングされています。画像の寸法を基準とした座標は、\[0, 1000\] にスケーリングされます。元の画像サイズに基づいて、これらの座標をスケールダウンする必要があります。

#### Python

```python
from google import genai
from google.genai import types
from PIL import Image, ImageDraw
import json
import numpy as np
import os

client = genai.Client()
prompt = "Detect the all of the prominent items in the image. The box_2d should be [ymin, xmin, ymax, xmax] normalized to 0-1000."

image = Image.open("/path/to/image.png")

config = types.GenerateContentConfig(
  response_mime_type="application/json"
  )

response = client.models.generate_content(model="gemini-2.5-flash",
                                          contents=[image, prompt],
                                          config=config
                                          )

width, height = image.size
bounding_boxes = json.loads(response.text)

converted_bounding_boxes = []
for bounding_box in bounding_boxes:
    abs_y1 = int(bounding_box["box_2d"][0]/1000 * height)
    abs_x1 = int(bounding_box["box_2d"][1]/1000 * width)
    abs_y2 = int(bounding_box["box_2d"][2]/1000 * height)
    abs_x2 = int(bounding_box["box_2d"][3]/1000 * width)
    converted_bounding_boxes.append([abs_x1, abs_y1, abs_x2, abs_y2])

print("Image size: ", width, height)
print("Bounding boxes:", converted_bounding_boxes)
```

**注:**
*   このモデルは、「この画像内のすべての緑色のオブジェクトの境界ボックスを表示する」などのカスタム指示に基づいて境界ボックスを生成することもサポートしています。
*   「アレルゲンを含む可能性のあるアイテムにラベルを付ける」などのカスタムラベルもサポートしています。

その他の例については、[Gemini クックブック](https://github.com/google-gemini/cookbook) の次のノートブックを参照してください。

*   [2D 空間認識ノートブック](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Spatial_understanding.ipynb?hl=ja)
*   [試験運用版の 3D ポインティング ノートブック](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/examples/Spatial_understanding_3d.ipynb?hl=ja)

## セグメンテーション

Gemini 2.5 以降では、モデルはアイテムを検出するだけでなく、セグメント化して輪郭マスクを提供します。

モデルは JSON リストを予測します。各項目はセグメンテーション マスクを表します。各アイテムには、0 ～ 1,000 の正規化された座標を持つ `[y0, x0, y1, x1]` 形式の境界ボックス（「`box_2d`」）、オブジェクトを識別するラベル（「`label`」）、境界ボックス内のセグメンテーション マスク（0 ～ 255 の値を持つ確率マップである base64 エンコードされた PNG）があります。マスクのサイズをバウンディング ボックスのサイズに合わせて変更し、信頼度のしきい値（中間点の 127）でバイナリ化する必要があります。

**注:** より良い結果を得るには、思考予算を 0 に設定して思考を無効にします。[思考について](https://ai.google.dev/gemini-api/docs/thinking?hl=ja)を参照してください。例については、以下のコード サンプルを参照してください。

#### Python

```python
from google import genai
from google.genai import types
from PIL import Image, ImageDraw
import io
import base64
import json
import numpy as np
import os

client = genai.Client()

def parse_json(json_output: str):
  # Parsing out the markdown fencing
  lines = json_output.splitlines()
  for i, line in enumerate(lines):
    if line == "```json":
      json_output = "\n".join(lines[i+1:])  # Remove everything before "```json"
      output = json_output.split("```")[0]  # Remove everything after the closing "```"
      break  # Exit the loop once "```json" is found
  return output

def extract_segmentation_masks(image_path: str, output_dir: str = "segmentation_outputs"):
  # Load and resize image
  im = Image.open(image_path)
  im.thumbnail([1024, 1024], Image.Resampling.LANCZOS)

  prompt = """
  Give the segmentation masks for the wooden and glass items.
  Output a JSON list of segmentation masks where each entry contains the 2D
  bounding box in the key "box_2d", the segmentation mask in key "mask", and
  the text label in the key "label". Use descriptive labels.
  """

  config = types.GenerateContentConfig(
    thinking_config=types.ThinkingConfig(thinking_budget=0) # set thinking_budget to 0 for better results in object detection
  )

  response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[prompt, im], # Pillow images can be directly passed as inputs (which will be converted by the SDK)
    config=config
  )

  # Parse JSON response
  items = json.loads(parse_json(response.text))

  # Create output directory
  os.makedirs(output_dir, exist_ok=True)

  # Process each mask
  for i, item in enumerate(items):
      # Get bounding box coordinates
      box = item["box_2d"]
      y0 = int(box[0] / 1000 * im.size[1])
      x0 = int(box[1] / 1000 * im.size[0])
      y1 = int(box[2] / 1000 * im.size[1])
      x1 = int(box[3] / 1000 * im.size[0])

      # Skip invalid boxes
      if y0 >= y1 or x0 >= x1:
          continue

      # Process mask
      png_str = item["mask"]
      if not png_str.startswith("data:image/png;base64,"):
          continue

      # Remove prefix
      png_str = png_str.removeprefix("data:image/png;base64,")
      mask_data = base64.b64decode(png_str)
      mask = Image.open(io.BytesIO(mask_data))

      # Resize mask to match bounding box
      mask = mask.resize((x1 - x0, y1 - y0), Image.Resampling.BILINEAR)

      # Convert mask to numpy array for processing
      mask_array = np.array(mask)

      # Create overlay for this mask
      overlay = Image.new('RGBA', im.size, (0, 0, 0, 0))
      overlay_draw = ImageDraw.Draw(overlay)

      # Create overlay for the mask
      color = (255, 255, 255, 200)
      for y in range(y0, y1):
          for x in range(x0, x1):
              if mask_array[y - y0, x - x0] > 128:  # Threshold for mask
                  overlay_draw.point((x, y), fill=color)

      # Save individual mask and its overlay
      mask_filename = f"{item['label']}_{i}_mask.png"
      overlay_filename = f"{item['label']}_{i}_overlay.png"

      mask.save(os.path.join(output_dir, mask_filename))

      # Create and save overlay
      composite = Image.alpha_composite(im.convert('RGBA'), overlay)
      composite.save(os.path.join(output_dir, overlay_filename))
      print(f"Saved mask and overlay for {item['label']} to {output_dir}")

# Example usage
if __name__ == "__main__":
  extract_segmentation_masks("path/to/image.png")
```

詳細な例については、クックブック ガイドの[セグメンテーションの例](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Spatial_understanding.ipynb?hl=ja#scrollTo=WQJTJ8wdGOKx)を参照してください。

![テーブルに並べられたカップケーキ。木材とガラスのオブジェクトがハイライト表示されている](https://ai.google.dev/static/gemini-api/docs/images/segmentation.jpg?hl=ja)
*オブジェクトとセグメンテーション マスクを含むセグメンテーション出力の例*

## サポートされている画像形式

Gemini は、次の画像形式の MIME タイプをサポートしています。

*   PNG - `image/png`
*   JPEG - `image/jpeg`
*   WEBP - `image/webp`
*   HEIC - `image/heic`
*   HEIF - `image/heif`

## 機能

すべての Gemini モデル バージョンはマルチモーダルであり、画像キャプション、Visual Question & Answering、画像分類、オブジェクト検出、セグメンテーションなど、幅広い画像処理タスクやコンピュータ ビジョン タスクで使用できます。

Gemini を使用すると、品質とパフォーマンスの要件に応じて、特殊な ML モデルを使用する必要性が軽減されます。

後続のモデル バージョンの一部は、一般的な機能に加えて、特殊なタスクの精度を高めるように特別にトレーニングされています。

*   **Gemini 2.0 モデル**は、[オブジェクト検出](#object-detection)の強化をサポートするようにさらにトレーニングされています。
*   **Gemini 2.5 モデル**は、[オブジェクト検出](#object-detection)に加えて、高度な[セグメンテーション](#segmentation)をサポートするようにさらにトレーニングされています。

## 制限事項と主な技術情報

### ファイルの上限

*   **Gemini 2.5 Pro/Flash, 2.0 Flash, 1.5 Pro, 1.5 Flash**: リクエストごとに最大 3,600 個の画像ファイルをサポートしています。

### トークンの計算

*   **Gemini 1.5 Flash および Gemini 1.5 Pro**:
    *   両方のディメンションが 384 ピクセル以下の場合は 258 トークン。
    *   大きな画像はタイル化されます（最小タイル 256 ピクセル、最大 768 ピクセル、768x768 にサイズ変更）。各タイルには 258 トークンが必要です。
*   **Gemini 2.0 Flash、Gemini 2.5 Flash/Pro**:
    *   両方のディメンションが 384 ピクセル以下の場合は 258 トークン。
    *   大きな画像は 768x768 ピクセルのタイルに分割され、それぞれ 258 トークンを消費します。

## おすすめの方法とお役立ち情報

*   画像が正しく回転していることを確認してください。
*   鮮明でぼやけていない画像を使用してください。
*   テキスト付きの画像を 1 つ使用する場合は、`contents` 配列の画像部分の**後**にテキスト プロンプトを配置してください。

## 次のステップ

このガイドでは、画像ファイルをアップロードし、画像入力からテキスト出力を生成する方法について説明しました。詳細については、次のリソースを参照してください。

*   [Files API](https://ai.google.dev/gemini-api/docs/files?hl=ja): Gemini で使用するファイルのアップロードと管理について説明します。
*   [システム指示](https://ai.google.dev/gemini-api/docs/text-generation?hl=ja#system-instructions): システム指示を使用すると、特定のニーズやユースケースに基づいてモデルの動作を制御できます。
*   [ファイル プロンプト戦略](https://ai.google.dev/gemini-api/docs/files?hl=ja#prompt-guide): Gemini API は、テキスト、画像、音声、動画データを使用したプロンプト（マルチモーダル プロンプトとも呼ばれます）をサポートしています。
*   [安全に関するガイダンス](https://ai.google.dev/gemini-api/docs/safety-guidance?hl=ja): 生成 AI モデルは、不正確、偏見的、不快な出力など、予期しない出力を生成することがあります。このような出力による危害のリスクを軽減するには、後処理と人間による評価が不可欠です。