# Question Data Schema

## Question
- id: string
- sentence: string
- level: 1..5
- correctPattern: 1..5
- explanationShort: string  # 20〜40文字
- tags: string[]            # ["SVOO","give","noise:pp"] 等

### Optional (future)
- answerKey:
  - verbSpan: [start,end]
  - objectSpans: [[start,end], ...]
  - complementSpans: [[start,end], ...]
