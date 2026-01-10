import Order from "../models/Order.js";

export const placeOrder = async (req, res) => {
  try {
    const { items, totalAmount, address } = req.body;

    const order = await Order.create({
      userId: req.user.id,
      items,
      totalAmount,
      address,
      paymentStatus: "Pending",
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Order failed" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
};
