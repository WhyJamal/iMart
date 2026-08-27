export interface IPromotionItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
}

export interface IPromotion {
  id: string;
  name: string;
  pointId: string;
  pointName: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCellId: string;
  warehouseCellName: string;
  discountPercent: number;
  endsAt: Date;
  comment: string | null;
  createdAt: Date;
  items: IPromotionItem[];
}

export interface IPromotionDiscount {
  productId: string;
  warehouseId: string;
  warehouseCellId: string;
  discountPercent: number;
  promotionName: string;
  endsAt: Date;
}
