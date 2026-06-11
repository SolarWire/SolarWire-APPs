import path from 'path';
import { Request, Response, NextFunction } from 'express';

const WORKSPACE_ROOT = path.resolve(process.cwd(), '..', 'workspace');

export function resolveSafePath(userPath: string): string {
  const normalized = path.normalize(userPath).replace(/^[/\\]+/, '');
  const resolved = path.resolve(WORKSPACE_ROOT, normalized);

  if (!resolved.startsWith(WORKSPACE_ROOT)) {
    throw new Error('Path traversal detected');
  }

  return resolved;
}

export function getWorkspaceRoot(): string {
  return WORKSPACE_ROOT;
}

export function workspaceGuard(req: Request, _res: Response, next: NextFunction): void {
  const filePath = req.query.path as string || req.body?.path || '';
  if (filePath) {
    try {
      resolveSafePath(filePath);
    } catch {
      _res.status(403).json({ error: 'Forbidden: path traversal detected' });
      return;
    }
  }
  next();
}