export type ElementType =
  | "rectangle"
  | "ellipse"
  | "diamond"
  | "text"
  | "arrow"
  | "line";

export interface BaseElement {
  readonly id: string;
  readonly type: ElementType;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly angle: number;
  readonly strokeColor: string;
  readonly backgroundColor: string;
  readonly fillStyle: "hachure" | "cross-hatch" | "solid";
  readonly strokeWidth: number;
  readonly roughness: number;
  readonly opacity: number;
  readonly seed: number;
  readonly version: number;
  readonly isDeleted: boolean;
  readonly groupIds: readonly string[];
  readonly boundElements: readonly BoundElement[] | null;
  readonly link: string | null;
  readonly locked: boolean;
}

export interface BoundElement {
  readonly id: string;
  readonly type: "arrow" | "text";
}

export interface Binding {
  readonly elementId: string;
  readonly focus: number;
  readonly gap: number;
}

export interface ShapeElement extends BaseElement {
  readonly type: "rectangle" | "ellipse" | "diamond";
  readonly roundness: { readonly type: number; readonly value?: number } | null;
}

export interface TextElement extends BaseElement {
  readonly type: "text";
  readonly text: string;
  readonly fontSize: number;
  readonly fontFamily: number;
  readonly textAlign: "left" | "center" | "right";
  readonly verticalAlign: "top" | "middle";
  readonly containerId: string | null;
  readonly originalText: string;
  readonly autoResize: boolean;
  readonly lineHeight: number;
}

export interface ArrowElement extends BaseElement {
  readonly type: "arrow";
  readonly points: readonly [readonly number[], readonly number[]];
  readonly startBinding: Binding | null;
  readonly endBinding: Binding | null;
  readonly startArrowhead: "arrow" | null;
  readonly endArrowhead: "arrow" | null;
  readonly roundness: { readonly type: number } | null;
}

export interface LineElement extends BaseElement {
  readonly type: "line";
  readonly points: readonly [readonly number[], readonly number[]];
  readonly startBinding: null;
  readonly endBinding: null;
  readonly startArrowhead: null;
  readonly endArrowhead: null;
  readonly roundness: { readonly type: number } | null;
}

export type ExcalidrawElement =
  | ShapeElement
  | TextElement
  | ArrowElement
  | LineElement;

export type InputType = "text" | "image" | "file";

export interface ConversionRequest {
  readonly file?: File;
  readonly text?: string;
  readonly type: InputType;
}

export interface ConversionResponse {
  readonly elements: readonly ExcalidrawElement[];
  readonly summary: string;
}
