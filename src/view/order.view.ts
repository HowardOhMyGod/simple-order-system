export class OrderProduct {
  public orderId: number;
  public productId: number;
  public userId: number;
  public quantity: number;
  public price: number;
  public name: string;
}

export class Order {
  public id: number;
  public products: OrderProduct[];
}
