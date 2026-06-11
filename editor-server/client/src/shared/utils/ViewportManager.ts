export class ViewportManager {
  private _matrix: DOMMatrix;
  private _inverseMatrix: DOMMatrix | null = null;
  private _cssMatrix: DOMMatrix;
  private _position: { x: number; y: number };
  private _scale: number;
  private _viewBoxOffset: { x: number; y: number };

  constructor(
    position: { x: number; y: number },
    scale: number,
    viewBoxOffset: { x: number; y: number } = { x: 0, y: 0 }
  ) {
    this._position = position;
    this._scale = scale;
    this._viewBoxOffset = viewBoxOffset;

    this._cssMatrix = new DOMMatrix()
      .translateSelf(position.x, position.y)
      .scaleSelf(scale);

    this._matrix = new DOMMatrix()
      .translateSelf(position.x, position.y)
      .scaleSelf(scale)
      .translateSelf(-viewBoxOffset.x, -viewBoxOffset.y);
  }

  get matrix(): DOMMatrix {
    return this._matrix;
  }

  get inverseMatrix(): DOMMatrix {
    if (!this._inverseMatrix) {
      this._inverseMatrix = this._matrix.inverse();
    }
    return this._inverseMatrix;
  }

  get scale(): number {
    return this._scale;
  }

  get position(): { x: number; y: number } {
    return this._position;
  }

  get viewBoxOffset(): { x: number; y: number } {
    return this._viewBoxOffset;
  }

  toWorldPoint(viewportX: number, viewportY: number): { x: number; y: number } {
    const p = new DOMPoint(viewportX, viewportY).matrixTransform(this.inverseMatrix);
    return { x: p.x, y: p.y };
  }

  toViewportPoint(worldX: number, worldY: number): { x: number; y: number } {
    const p = new DOMPoint(worldX, worldY).matrixTransform(this._matrix);
    return { x: p.x, y: p.y };
  }

  toWorldPointWithOffset(
    localX: number,
    localY: number,
    offsetX: number,
    offsetY: number
  ): { x: number; y: number } {
    return this.toWorldPoint(localX + offsetX, localY + offsetY);
  }

  toViewportPointWithOffset(
    worldX: number,
    worldY: number,
    offsetX: number,
    offsetY: number
  ): { x: number; y: number } {
    const vp = this.toViewportPoint(worldX, worldY);
    return { x: vp.x - offsetX, y: vp.y - offsetY };
  }

  toWorldSize(viewportSize: number): number {
    return viewportSize / this._scale;
  }

  toViewportSize(worldSize: number): number {
    return worldSize * this._scale;
  }

  getTransformString(): string {
    return `translate(${this._position.x}px, ${this._position.y}px) scale(${this._scale})`;
  }
}
