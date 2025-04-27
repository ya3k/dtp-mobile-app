
export const formatPrice = (price: number | undefined) => {
    if (price == undefined || typeof price == "string") return "0";
    return price.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };
  