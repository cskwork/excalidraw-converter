const ELEMENT_SCHEMA = `
Each element in the JSON array MUST conform to one of these shapes:

### Shape Elements (rectangle, ellipse, diamond)
{
  "type": "rectangle" | "ellipse" | "diamond",
  "id": "<unique 8-char alphanumeric string>",
  "x": <number>,
  "y": <number>,
  "width": <number>,
  "height": <number>,
  "angle": 0,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "<hex color or 'transparent'>",
  "fillStyle": "solid" | "hachure" | "cross-hatch",
  "strokeWidth": 2,
  "roughness": 1,
  "opacity": 100,
  "seed": <random integer>,
  "version": 1,
  "isDeleted": false,
  "groupIds": [],
  "boundElements": [{"id": "<text-element-id>", "type": "text"}, {"id": "<arrow-id>", "type": "arrow"}] | null,
  "link": null,
  "locked": false,
  "roundness": {"type": 3}
}

### Text Elements
{
  "type": "text",
  "id": "<unique 8-char alphanumeric string>",
  "x": <number>,
  "y": <number>,
  "width": <number>,
  "height": <number>,
  "angle": 0,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "roughness": 1,
  "opacity": 100,
  "seed": <random integer>,
  "version": 1,
  "isDeleted": false,
  "groupIds": [],
  "boundElements": null,
  "link": null,
  "locked": false,
  "text": "<label text>",
  "fontSize": 20,
  "fontFamily": 1,
  "textAlign": "center",
  "verticalAlign": "middle",
  "containerId": "<parent-shape-id>" | null,
  "originalText": "<same as text>",
  "autoResize": true,
  "lineHeight": 1.25
}

### Arrow Elements
{
  "type": "arrow",
  "id": "<unique 8-char alphanumeric string>",
  "x": <start-x>,
  "y": <start-y>,
  "width": <end-x minus start-x>,
  "height": <end-y minus start-y>,
  "angle": 0,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "roughness": 1,
  "opacity": 100,
  "seed": <random integer>,
  "version": 1,
  "isDeleted": false,
  "groupIds": [],
  "boundElements": null,
  "link": null,
  "locked": false,
  "points": [[0, 0], [<dx>, <dy>]],
  "startBinding": {"elementId": "<source-shape-id>", "focus": 0, "gap": 8} | null,
  "endBinding": {"elementId": "<target-shape-id>", "focus": 0, "gap": 8} | null,
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "roundness": {"type": 2}
}

### Line Elements
Same as Arrow but with type "line", startArrowhead: null, endArrowhead: null, startBinding: null, endBinding: null.
`;

const LAYOUT_RULES = `
## Layout Rules
- Start the first element at position (100, 100).
- Space elements at least 200px apart horizontally and 150px apart vertically.
- Use a grid layout: arrange related items in rows and columns.
- Keep the diagram reading order: top-to-bottom and left-to-right.
- Rectangles should be at least 160px wide and 80px tall.
- Center text labels inside their parent shapes using containerId.
- Arrows should connect shape centers; use startBinding and endBinding to reference shape IDs.
- For bound text elements, set width and height to match the text content roughly (10px per character width, 25px height per line).
- All IDs must be unique 8-character alphanumeric strings.
- Every shape that has a label must list its text element in boundElements: [{"id": "<text-id>", "type": "text"}].
- Every shape connected by an arrow must list that arrow in boundElements: [{"id": "<arrow-id>", "type": "arrow"}].
`;

const STRATEGY_TEXT = `
## Strategy: Text Input
Analyze the text to identify:
1. Key concepts, entities, or topics mentioned.
2. Relationships between them (causes, depends-on, leads-to, contains, etc.).
3. Any hierarchical structure (parent-child, category-subcategory).

Then produce a flowchart or mind map:
- Each concept becomes a rectangle with a text label inside.
- Each relationship becomes an arrow connecting the relevant rectangles.
- Group related concepts spatially.
- Use color coding: primary concepts in "#a5d8ff", secondary in "#d0bfff", actions in "#b2f2bb".
`;

const STRATEGY_IMAGE = `
## Strategy: Image Input
Examine the image carefully and identify:
1. Visual elements: shapes, icons, text, diagrams, charts, UI elements.
2. Spatial relationships: what is next to what, containment, flow direction.
3. Labels and annotations visible in the image.

Then recreate the visual content as editable Excalidraw elements:
- Convert each distinct visual region into a shape (rectangle, ellipse, or diamond).
- Preserve approximate layout and relative positioning.
- Add text labels matching any visible text.
- Connect related elements with arrows if the image shows flow or connections.
- Use colors that approximate the original: map dominant colors to hex values.
`;

const STRATEGY_FILE = `
## Strategy: File/Document Input
Parse the document structure and identify:
1. Sections, headings, and their hierarchy.
2. Key data points, lists, or tables.
3. Logical flow or process steps described.

Then produce an organizational chart or structured flowchart:
- Top-level headings become primary rectangles (colored "#a5d8ff").
- Sub-sections become secondary rectangles (colored "#d0bfff") connected by arrows.
- Lists or steps become a vertical chain of rectangles connected by arrows.
- Tables become a grid of rectangles.
- Use diamond shapes for decision points if the content describes conditions.
`;

const strategies: Record<string, string> = {
  text: STRATEGY_TEXT,
  image: STRATEGY_IMAGE,
  file: STRATEGY_FILE,
};

export function buildConversionPrompt(inputType: string): string {
  const strategy = strategies[inputType] ?? strategies.text;

  return `You are an expert diagram generator. Your task is to analyze the provided input and produce an Excalidraw-compatible diagram as a JSON array of elements.

## Output Format
Return ONLY a valid JSON array of Excalidraw element objects. No markdown, no code fences, no explanation — just the raw JSON array starting with [ and ending with ].

## Excalidraw Element Schema
${ELEMENT_SCHEMA}

${LAYOUT_RULES}

${strategy}

## Critical Rules
1. Return ONLY the JSON array. No other text.
2. Every ID must be unique (8 alphanumeric characters).
3. Every shape with a text label must have the text element's id in its boundElements array.
4. Every text element inside a shape must set containerId to that shape's id.
5. Arrow startBinding/endBinding elementId must reference existing shape IDs.
6. Shapes connected by arrows must list those arrows in their boundElements.
7. Positions must not overlap — follow the layout rules strictly.
8. Produce at least 3 elements and no more than 50 elements.
9. Use seed values between 1 and 2000000000.
`;
}
