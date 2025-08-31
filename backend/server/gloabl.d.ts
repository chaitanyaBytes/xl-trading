declare namespace Express {
  export interface Request {
    id?: string;
    userId?: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  }
}
