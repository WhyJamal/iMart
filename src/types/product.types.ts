
export interface IProduct {
  id: string;
  name: string;
  price: number;
  code: string;
  category: string;
  image: string | null;
  createdAt: Date;
}