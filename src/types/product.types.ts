
export interface IProduct {
  id: string;
  name: string;
  price: number;
  code: string;
  categoryId: string | null;
  categoryName: string;
  unit: string;
  image: string | null;
  createdAt: Date;
}
