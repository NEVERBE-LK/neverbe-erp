import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Divider,
  Alert,
  Switch,
  Table,
  InputNumber,
  Modal,
  Image,
} from "antd";
import api from "@/lib/api";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Order } from "@/model/Order";
import { OrderItem } from "@/model/OrderItem";
import { Payment } from "@/model/Payment";
import toast from "react-hot-toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import {
  IconSettings,
  IconReceipt,
  IconTruck,
  IconBell,
  IconDeviceFloppy,
  IconArrowBackUp,
  IconPlus,
  IconTrash,
  IconCoin,
  IconUser,
  IconCamera,
  IconPackage,
} from "@tabler/icons-react";
import { Html5Qrcode } from "html5-qrcode";
import type { ColumnsType } from "antd/es/table";

interface OrderEditFormProps {
  order: Order;
  onRefresh?: () => void;
}

interface ProductOption {
  id: string;
  label: string;
  buyingPrice?: number;
  sellingPrice?: number;
  variants?: any[];
  availableSizes?: string[];
}

interface VariantOption {
  id: string;
  label: string;
  sizes?: string[];
}

export const OrderEditForm: React.FC<OrderEditFormProps> = ({
  order,
  onRefresh,
}) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Master Dropdown Data
  const [paymentMethods, setPaymentMethods] = useState<{ paymentId: string; name: string; customerFee?: number; fee?: number }[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, ProductOption>>({});
  const [availableVariants, setAvailableVariants] = useState<VariantOption[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [globalSizes, setGlobalSizes] = useState<string[]>([]);

  // Local Order State for Items & Payments
  const [items, setItems] = useState<OrderItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Item Addition Form State
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [itemDiscount, setItemDiscount] = useState(0);

  // Payment Addition Form State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("");
  const [payCard, setPayCard] = useState("");

  const { showConfirmation } = useConfirmationDialog();

  // --- Mobile Detection ---
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // --- Barcode Camera Scanner ---
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<any>(null);
  const isStoppingRef = useRef(false);

  const startTrackingScanner = () => {
    setScannerActive(true);
  };

  const safeStopScanner = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      const instance = scannerRef.current;
      if (instance) {
        const state = instance.getState?.();
        if (state === 2 || state === undefined) {
          await instance.stop().catch(() => {});
        }
        scannerRef.current = null;
      }
    } catch (err) {
      console.warn("Scanner stop error (safe):", err);
      scannerRef.current = null;
    } finally {
      isStoppingRef.current = false;
      setScannerActive(false);
    }
  };

  useEffect(() => {
    if (!scannerActive) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      try {
        const html5Qrcode = new Html5Qrcode("edit-scanner-container");
        scannerRef.current = html5Qrcode;
        await html5Qrcode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 300, height: 120 } },
          (decodedText) => {
            const cleanText = decodedText.trim().replace(/\s+/g, "");
            toast.success(`Scanned: ${cleanText}`);
            form.setFieldsValue({ trackingNumber: cleanText });
            safeStopScanner();
          },
          () => {}
        );
      } catch (err) {
        if (!cancelled) {
          console.error("Camera scan failed", err);
          toast.error("Unable to access camera.");
          setScannerActive(false);
        }
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      const instance = scannerRef.current;
      if (instance) {
        instance.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [scannerActive]);

  // Load dropdown data
  const fetchDropdownData = useCallback(async () => {
    try {
      const [pmRes, prodRes, sizeRes] = await Promise.all([
        api.get("/api/v1/erp/finance/payment-methods"),
        api.get<ProductOption[]>("/api/v1/erp/master/products/dropdown"),
        api.get<{ id: string; label: string }[]>("/api/v1/erp/master/sizes/dropdown"),
      ]);
      setPaymentMethods(pmRes.data);
      setProducts(prodRes.data);
      
      const allSizes = sizeRes.data.map((s) => s.label);
      setGlobalSizes(allSizes);
      setAvailableSizes(allSizes);

      const map: Record<string, ProductOption> = {};
      prodRes.data.forEach((p) => {
        map[p.id] = p;
      });
      setProductsMap(map);
    } catch (error) {
      console.error("Failed to fetch dropdown options:", error);
      toast.error("Failed to load catalog dropdown options");
    }
  }, []);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  // Set initial form states
  useEffect(() => {
    const itemDiscounts = order.items?.reduce(
      (acc, item) => acc + ((item.discount || 0) * (item.quantity || 1)),
      0
    ) || 0;

    form.setFieldsValue({
      ...order,
      discount: Math.max(0, (order.discount || 0) - itemDiscounts),
      customer: order.customer || {},
      sendNotification: true,
    });
    setItems(order.items || []);
    setPayments(order.paymentReceived || []);
  }, [order, form]);

  // Fetch variants when item adder product changes
  useEffect(() => {
    const fetchVariants = async () => {
      setAvailableVariants([]);
      if (selectedProduct) {
        try {
          const variantsRes = await api.get<VariantOption[]>(
            `/api/v1/erp/master/products/${selectedProduct}/variants/dropdown`
          );
          setAvailableVariants(variantsRes.data || []);
        } catch (e) {
          console.error("Failed to fetch product variants", e);
        }
      }
    };

    if (selectedProduct) {
      fetchVariants();
    } else {
      setAvailableVariants([]);
    }
    setSelectedVariant("");
    setSelectedSize("");
    setAvailableSizes(globalSizes);
  }, [selectedProduct, globalSizes]);

  // Update sizes when item adder variant changes
  useEffect(() => {
    if (selectedVariant && availableVariants.length > 0) {
      const variant = availableVariants.find((v) => v.id === selectedVariant);
      if (variant && variant.sizes && variant.sizes.length > 0) {
        setAvailableSizes(variant.sizes);
      } else {
        setAvailableSizes(globalSizes);
      }
    } else {
      setAvailableSizes(globalSizes);
    }
  }, [selectedVariant, availableVariants, globalSizes]);

  const handleProductChange = (id: string) => {
    setSelectedProduct(id);
    const prod = productsMap[id];
    setPrice(prod?.sellingPrice || 0);
    setItemDiscount(0);
  };

  // Add Item
  const handleAddItem = () => {
    if (!selectedProduct || !selectedSize || quantity <= 0) {
      toast.error("Please select a Product, Size and valid Quantity");
      return;
    }

    const prod = productsMap[selectedProduct];
    if (!prod) return;

    const variant = availableVariants.find((v) => v.id === selectedVariant);

    const newItem: OrderItem = {
      itemId: prod.id,
      name: prod.label,
      variantId: selectedVariant || "",
      variantName: variant?.label || "",
      size: selectedSize,
      quantity,
      price,
      discount: itemDiscount,
    };

    setItems([...items, newItem]);
    
    // Reset inputs
    setSelectedProduct("");
    setSelectedVariant("");
    setSelectedSize("");
    setQuantity(1);
    setPrice(0);
    setItemDiscount(0);
    toast.success("Item added to order list");
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast.success("Item removed");
  };

  // Edit quantity directly in table
  const handleQtyChange = (index: number, val: number | null) => {
    const newItems = [...items];
    newItems[index].quantity = val || 1;
    setItems(newItems);
  };

  // Edit price directly in table
  const handlePriceChange = (index: number, val: number | null) => {
    const newItems = [...items];
    newItems[index].price = val || 0;
    setItems(newItems);
  };

  // Edit discount directly in table
  const handleItemDiscountChange = (index: number, val: number | null) => {
    const newItems = [...items];
    newItems[index].discount = val || 0;
    setItems(newItems);
  };

  // Add Payment
  const handleAddPayment = () => {
    if (payAmount <= 0 || !payMethod) {
      toast.error("Please enter a valid payment amount and method");
      return;
    }

    const selectedMethodObj = paymentMethods.find((m) => m.paymentId === payMethod);

    const newPay: Payment = {
      id: `PAY-${Date.now()}`,
      amount: payAmount,
      paymentMethod: selectedMethodObj?.name || payMethod,
      paymentMethodId: payMethod,
      cardNumber: payCard || "",
    };

    const newPayments = [...payments, newPay];
    setPayments(newPayments);
    
    // Automatically update payment status if fully paid
    const itemsTotal = items.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0);
    const shippingFee = form.getFieldValue("shippingFee") || 0;
    const orderDiscount = form.getFieldValue("discount") || 0;
    const payMethodVal = form.getFieldValue("paymentMethod");
    const selectedMethodObjForFee = paymentMethods.find((m) => m.name.toUpperCase() === payMethodVal?.toUpperCase());
    const fee = selectedMethodObjForFee ? (itemsTotal * (selectedMethodObjForFee.customerFee || 0) / 100) : (order?.fee || 0);
    const expectedTotal = itemsTotal + Number(shippingFee) + Number(fee) - Number(orderDiscount);
    const totalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
    
    if (totalPaid >= expectedTotal) {
      form.setFieldValue("paymentStatus", "Paid");
    } else if (totalPaid > 0) {
      form.setFieldValue("paymentStatus", "Pending");
    }

    setPayAmount(0);
    setPayMethod("");
    setPayCard("");
    toast.success("Payment logged successfully");
  };

  // Remove Payment
  const handleRemovePayment = (id: string) => {
    const newPayments = payments.filter((p) => p.id !== id);
    setPayments(newPayments);

    // Recalculate and update payment status to Pending if it's less than total
    const itemsTotal = items.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0);
    const shippingFee = form.getFieldValue("shippingFee") || 0;
    const orderDiscount = form.getFieldValue("discount") || 0;
    const payMethodVal = form.getFieldValue("paymentMethod");
    const selectedMethodObjForFee = paymentMethods.find((m) => m.name.toUpperCase() === payMethodVal?.toUpperCase());
    const fee = selectedMethodObjForFee ? (itemsTotal * (selectedMethodObjForFee.customerFee || 0) / 100) : (order?.fee || 0);
    const expectedTotal = itemsTotal + Number(shippingFee) + Number(fee) - Number(orderDiscount);
    const totalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid < expectedTotal || totalPaid === 0) {
      form.setFieldValue("paymentStatus", "Pending");
    }
    toast.success("Payment record removed");
  };

  // Calculate live values
  const itemsTotal = items.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0);
  const totalPaidAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  const onFinish = async (values: any) => {
    if (items.length === 0) {
      toast.error("An order must have at least one product item");
      return;
    }

    const selectedMethodObjForFee = paymentMethods.find((m) => m.name.toUpperCase() === values.paymentMethod?.toUpperCase());
    const fee = selectedMethodObjForFee ? (itemsTotal * (selectedMethodObjForFee.customerFee || 0) / 100) : (order?.fee || 0);
    const calculatedTotal = itemsTotal + Number(values.shippingFee || 0) + Number(fee) - Number(values.discount || 0);

    showConfirmation({
      title: "UPDATE ORDER DETAILS",
      message:
        order?.integrity === false
          ? "WARNING: THIS ORDER IS FLAGGED FOR SECURITY INTEGRITY. CONFIRM FULL EDIT?"
          : "ARE YOU SURE YOU WANT TO SAVE THESE ORDER MODIFICATIONS? Stock and payments will be adjusted dynamically.",
      confirmText: "SAVE ORDER",
      variant: order?.integrity === false ? "danger" : "default",
      onSuccess: async () => {
        try {
          setIsSubmitting(true);
          
          const transactionFeeCharge = payments.reduce((acc, p) => {
            const method = paymentMethods.find(
              (m) => m.name.toUpperCase() === p.paymentMethod?.toUpperCase()
            );
            const feePercent = method?.fee || 0;
            return acc + p.amount * (feePercent / 100);
          }, 0);

          // Assemble complete edit payload
          const itemDiscountsTotal = items.reduce(
            (acc, item) => acc + ((item.discount || 0) * (item.quantity || 1)),
            0
          );

          const payload: Partial<Order> = {
            status: values.status,
            paymentStatus: values.paymentStatus,
            paymentMethod: values.paymentMethod,
            trackingNumber: values.trackingNumber || "",
            courier: values.courier || "",
            customer: values.customer || {},
            items,
            paymentReceived: payments,
            total: calculatedTotal,
            shippingFee: Number(values.shippingFee || 0),
            discount: Number(values.discount || 0) + itemDiscountsTotal,
            fee: Number(fee),
            transactionFeeCharge: Math.round(transactionFeeCharge * 100) / 100,
          };

          if (values.status !== order.status) {
            const existingHistory = order.statusHistory || [];
            payload.statusHistory = [
              ...existingHistory,
              { status: values.status, date: new Date().toISOString() },
            ];
          }

          const fd = new FormData();
          const finalPayload = {
            ...payload,
            sendNotification: values.sendNotification,
          };
          fd.append("data", JSON.stringify(finalPayload));
          
          await api.put(`/api/v1/erp/orders/${order.orderId}`, fd);
          toast.success(`ORDER #${order.orderId} UPDATED SUCCESSFULLY`);
          onRefresh?.();
        } catch (error: any) {
          console.error(error);
          toast.error(
            error.response?.data?.message || "Failed to update order details"
          );
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  // Build image map from productsMap — updates reactively when items or productsMap change
  const itemImages = useMemo(() => {
    const map: Record<string, string> = {};
    items.forEach((item) => {
      const product = productsMap[item.itemId];
      if (!product) return;
      if (product.variants) {
        product.variants.forEach((v: any) => {
          if (v.images && v.images.length > 0) {
            map[`${item.itemId}_${v.variantId || v.id}`] = v.images[0].url;
          }
        });
      }
    });
    return map;
  }, [items, productsMap]);

  const itemColumns = [
    {
      title: "Product Item",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: OrderItem) => {
        const imgKey = `${record.itemId}_${record.variantId}`;
        const imageUrl = itemImages[imgKey] || "";
        const formattedVariant = record.variantName
          ? record.variantName.replace(/\b\w/g, (c) => c.toUpperCase())
          : "";

        return (
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shadow-sm flex-shrink-0 bg-gray-50 cursor-pointer">
                <Image
                  src={imageUrl}
                  alt={text}
                  width={40}
                  height={40}
                  className="object-cover rounded-lg"
                  preview={{
                    mask: <span className="text-[8px] font-bold">View</span>,
                  }}
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0 border border-gray-100">
                <IconPackage size={18} />
              </div>
            )}
            <div>
              <span className="font-bold text-xs text-gray-800 block">{text}</span>
              {formattedVariant && (
                <span className="block text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                  Variant: {formattedVariant}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 80,
      render: (size: string) => (
        <span className="inline-block text-[10px] font-bold text-gray-700 bg-gray-100 border border-gray-200 rounded px-2 py-0.5 uppercase">
          {size}
        </span>
      ),
    },
    {
      title: "Unit Price (Rs)",
      dataIndex: "price",
      key: "price",
      width: 130,
      render: (val: number, record: OrderItem, idx: number) => (
        <InputNumber
          min={0}
          value={val}
          className="w-full rounded-lg h-9 text-xs"
          formatter={(v) => `Rs ${v}`}
          onChange={(v) => handlePriceChange(idx, v)}
        />
      ),
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 90,
      render: (val: number, record: OrderItem, idx: number) => (
        <InputNumber
          min={1}
          value={val}
          className="w-full rounded-lg h-9 text-xs"
          onChange={(v) => handleQtyChange(idx, v)}
        />
      ),
    },
    {
      title: "Discount (Rs)",
      dataIndex: "discount",
      key: "discount",
      width: 120,
      render: (val: number, record: OrderItem, idx: number) => (
        <InputNumber
          min={0}
          value={val}
          className="w-full rounded-lg h-9 text-xs"
          formatter={(v) => `Rs ${v}`}
          onChange={(v) => handleItemDiscountChange(idx, v)}
        />
      ),
    },
    {
      title: "Subtotal",
      key: "subtotal",
      align: "right" as const,
      width: 120,
      render: (_: any, record: OrderItem) => (
        <span className="font-mono text-xs font-bold text-gray-800">
          Rs {((record.price - record.discount) * record.quantity).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 60,
      align: "center" as const,
      render: (_: any, record: OrderItem, idx: number) => (
        <Button
          type="text"
          danger
          icon={<IconTrash size={16} />}
          onClick={() => handleRemoveItem(idx)}
          className="hover:bg-red-50 rounded-lg flex items-center justify-center"
        />
      ),
    },
  ];

  return (
    <div className="w-full animate-in fade-in duration-700 flex flex-col gap-6">
      {/* ⚠️ Security Alert */}
      {order.integrity === false && (
        <Alert
          message="Security Integrity Check Failed"
          description="This order has failed system integrity checks. Please exercise extreme caution before proceeding."
          type="error"
          showIcon
          className="shadow-sm rounded-2xl"
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        className="w-full"
      >
        <Row gutter={[24, 24]}>
          {/* LEFT COLUMN: Configuration, Items, Payments & Addresses */}
          <Col xs={24} lg={16}>
            <div className="flex flex-col gap-6">

            {/* Order Configuration Card */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <IconSettings size={18} className="text-emerald-600" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Order Configuration
                  </span>
                </div>
              }
              className="shadow-sm border-gray-100 rounded-2xl"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order Status</span>}
                    name="status"
                    rules={[{ required: true }]}
                  >
                    <Select className="h-10 rounded-lg">
                      <Select.Option value="Pending">PENDING</Select.Option>
                      <Select.Option value="Processing">PROCESSING</Select.Option>
                      <Select.Option value="Completed">COMPLETED</Select.Option>
                      <Select.Option value="Cancelled">CANCELLED</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Primary Payment Method</span>}
                    name="paymentMethod"
                    rules={[{ required: true }]}
                  >
                    <Select className="h-10 rounded-lg" placeholder="Select Method">
                      {paymentMethods.map((m) => (
                        <Select.Option
                          key={m.paymentId}
                          value={m.name.toUpperCase()}
                        >
                          {m.name.toUpperCase()}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Status</span>}
                    name="paymentStatus"
                    rules={[{ required: true }]}
                  >
                    <Select className="h-10 rounded-lg">
                      <Select.Option value="Pending">PENDING</Select.Option>
                      <Select.Option value="Paid">PAID</Select.Option>
                      <Select.Option value="Failed">FAILED</Select.Option>
                      <Select.Option value="Refunded">REFUNDED</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]} className="mt-4">
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tracking Number</span>}
                    name="trackingNumber"
                  >
                    <Input
                      className="h-10 rounded-lg border-gray-200"
                      placeholder="Enter courier tracking ID"
                      suffix={
                        isMobile ? (
                          <IconCamera
                            size={18}
                            className="text-gray-400 hover:text-emerald-600 cursor-pointer transition"
                            onClick={() => startTrackingScanner()}
                          />
                        ) : null
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shipping Courier</span>}
                    name="courier"
                  >
                    <Select className="h-10 rounded-lg" placeholder="Select courier service">
                      <Select.Option value="Domex">Domex</Select.Option>
                      <Select.Option value="Certis">Certis</Select.Option>
                      <Select.Option value="Prompt">Prompt Express</Select.Option>
                      <Select.Option value="Koombiyo">Koombiyo</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* ORDER ITEMS MANAGER CARD */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <IconReceipt size={18} className="text-emerald-600" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Order Items Manager
                  </span>
                </div>
              }
              className="shadow-sm border-gray-100 rounded-2xl overflow-hidden"
            >
              {/* Product Adder Inline Panel */}
              <div className="bg-gray-50 p-4 border border-gray-100 rounded-xl mb-4 space-y-4">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Add Item to Order</span>
                <Row gutter={[12, 12]} className="items-end">
                  <Col xs={24} sm={8}>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Product</label>
                    <Select
                      showSearch
                      placeholder="Select Product"
                      optionFilterProp="children"
                      className="w-full h-9 rounded-lg"
                      value={selectedProduct || undefined}
                      onChange={handleProductChange}
                    >
                      {products.map((p) => (
                        <Select.Option key={p.id} value={p.id}>
                          {p.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={12} sm={4}>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Variant</label>
                    <Select
                      placeholder="Variant"
                      className="w-full h-9 rounded-lg"
                      value={selectedVariant || undefined}
                      onChange={(v) => setSelectedVariant(v)}
                      disabled={!selectedProduct}
                    >
                      {availableVariants.map((v) => (
                        <Select.Option key={v.id} value={v.id}>
                          {v.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={12} sm={3}>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Size</label>
                    <Select
                      placeholder="Size"
                      className="w-full h-9 rounded-lg"
                      value={selectedSize || undefined}
                      onChange={(v) => setSelectedSize(v)}
                      disabled={!selectedProduct}
                    >
                      {availableSizes.map((s) => (
                        <Select.Option key={s} value={s}>
                          {s}
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={12} sm={3}>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Price</label>
                    <InputNumber
                      min={0}
                      value={price}
                      className="w-full h-9 rounded-lg"
                      formatter={(v) => `Rs ${v}`}
                      onChange={(v) => setPrice(v || 0)}
                    />
                  </Col>
                  <Col xs={12} sm={3}>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Discount</label>
                    <InputNumber
                      min={0}
                      value={itemDiscount}
                      className="w-full h-9 rounded-lg"
                      formatter={(v) => `Rs ${v}`}
                      onChange={(v) => setItemDiscount(v || 0)}
                    />
                  </Col>
                  <Col xs={12} sm={3}>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Qty</label>
                    <InputNumber
                      min={1}
                      value={quantity}
                      className="w-full h-9 rounded-lg"
                      onChange={(v) => setQuantity(v || 1)}
                    />
                  </Col>
                </Row>
                <div className="flex justify-end mt-2">
                  <Button
                    type="primary"
                    icon={<IconPlus size={15} />}
                    onClick={handleAddItem}
                    className="bg-black border-none rounded-lg h-9 px-4 font-bold flex items-center gap-1.5"
                  >
                    Add Product Item
                  </Button>
                </div>
              </div>

              {/* Items List Table */}
              <Table
                columns={itemColumns}
                dataSource={items}
                rowKey={(record, idx) => `${record.itemId}_${record.variantId}_${record.size}_${idx}`}
                pagination={false}
                scroll={{ x: 600 }}
                size="small"
                className="border border-gray-100 rounded-xl overflow-hidden"
              />
            </Card>

            {/* PAYMENTS HISTORY & RECEIVED LOGS CARD */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <IconCoin size={18} className="text-emerald-600" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Payments History & Entry
                  </span>
                </div>
              }
              className="shadow-sm border-gray-100 rounded-2xl"
            >
              <div className="bg-gray-50 p-4 border border-gray-100 rounded-xl mb-4 space-y-4">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Record Received Payment</span>
                <Row gutter={[12, 12]} className="items-end">
                  <Col xs={24} sm={8}>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Amount Paid</label>
                    <InputNumber
                      min={1}
                      value={payAmount}
                      className="w-full h-9 rounded-lg"
                      formatter={(v) => `Rs ${v}`}
                      onChange={(v) => setPayAmount(v || 0)}
                    />
                  </Col>
                  <Col xs={24} sm={8}>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Payment Method</label>
                    <Select
                      placeholder="Select Method"
                      className="w-full h-9 rounded-lg"
                      value={payMethod || undefined}
                      onChange={(v) => setPayMethod(v)}
                    >
                      {paymentMethods.map((m) => (
                        <Select.Option key={m.paymentId} value={m.paymentId}>
                          {m.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} sm={8}>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Transaction Card/Reference #</label>
                    <Input
                      value={payCard}
                      placeholder="Last 4 digits / Ref"
                      className="w-full h-9 rounded-lg border-gray-200"
                      onChange={(e) => setPayCard(e.target.value)}
                    />
                  </Col>
                </Row>
                <div className="flex justify-end mt-2">
                  <Button
                    type="primary"
                    icon={<IconPlus size={15} />}
                    onClick={handleAddPayment}
                    className="bg-black border-none rounded-lg h-9 px-4 font-bold flex items-center gap-1.5"
                  >
                    Log Received Payment
                  </Button>
                </div>
              </div>

              {/* Payments Ledger */}
              <div className="space-y-2">
                <Form.Item noStyle shouldUpdate>
                  {() => {
                    const paymentStatus = form.getFieldValue("paymentStatus") || order?.paymentStatus;
                    const isPaidWebsite = order?.from?.toLowerCase() === "website" && paymentStatus?.toLowerCase() === "paid";
                    
                    if (payments.length === 0 && !isPaidWebsite) {
                      return (
                        <div className="text-center py-6 text-gray-400 text-xs font-semibold bg-gray-50/50 rounded-xl border border-dashed border-gray-100">
                          No payment transactions recorded for this order.
                        </div>
                      );
                    }

                    const shipping = form.getFieldValue("shippingFee") || 0;
                    const discount = form.getFieldValue("discount") || 0;
                    const payMethod = form.getFieldValue("paymentMethod");
                    const selectedMethodObj = paymentMethods.find((m) => m.name.toUpperCase() === payMethod?.toUpperCase());
                    const fee = selectedMethodObj ? (itemsTotal * (selectedMethodObj.customerFee || 0) / 100) : (order?.fee || 0);
                    const totalVal = itemsTotal + Number(shipping) + Number(fee) - Number(discount);

                    return (
                      <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white">
                        {isPaidWebsite && (
                          <div className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 transition duration-150">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                                <IconCoin size={16} />
                              </div>
                              <div>
                                <span className="font-bold text-xs text-gray-800">
                                  Rs {totalVal.toLocaleString()}
                                </span>
                                <span className="inline-block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2 bg-gray-100 px-1.5 py-0.5 rounded">
                                  {form.getFieldValue("paymentMethod") || order?.paymentMethod || "IPG Payment"}
                                </span>
                                {order?.paymentId && (
                                  <span className="block text-[10px] text-gray-400 font-bold mt-0.5">
                                    Card/Ref: {order.paymentId}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase">
                              Website Paid
                            </span>
                          </div>
                        )}
                        {payments.map((p) => (
                          <div key={p.id} className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 transition duration-150">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                                <IconCoin size={16} />
                              </div>
                              <div>
                                <span className="font-bold text-xs text-gray-800">Rs {p.amount.toLocaleString()}</span>
                                <span className="inline-block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2 bg-gray-100 px-1.5 py-0.5 rounded">
                                  {p.paymentMethod}
                                </span>
                                {p.cardNumber && (
                                  <span className="block text-[10px] text-gray-400 font-bold mt-0.5">
                                    Card/Ref: {p.cardNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              type="text"
                              danger
                              icon={<IconTrash size={14} />}
                              onClick={() => handleRemovePayment(p.id)}
                              className="hover:bg-red-50 rounded-lg flex items-center justify-center h-8 w-8"
                            />
                          </div>
                        ))}
                      </div>
                    );
                  }}
                </Form.Item>
              </div>
            </Card>

            {/* Address Grid */}
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card
                  title={
                    <div className="flex items-center gap-2">
                      <IconUser size={18} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Billing Details
                      </span>
                    </div>
                  }
                  className="shadow-sm border-gray-100 rounded-2xl h-full"
                >
                  <div className="space-y-4">
                    <Form.Item
                      label={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer Name</span>}
                      name={["customer", "name"]}
                    >
                      <Input className="h-10 rounded-lg border-gray-200" placeholder="Full Name" />
                    </Form.Item>
                    <Form.Item
                      label={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</span>}
                      name={["customer", "email"]}
                    >
                      <Input
                        className="h-10 rounded-lg border-gray-200"
                        type="email"
                        placeholder="email@example.com"
                      />
                    </Form.Item>
                    <Form.Item
                      label={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</span>}
                      name={["customer", "phone"]}
                    >
                      <Input className="h-10 rounded-lg border-gray-200" placeholder="+94 XX XXX XXXX" />
                    </Form.Item>
                    <Form.Item
                      label={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Street Address</span>}
                      name={["customer", "address"]}
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder="Mailing Address"
                        className="rounded-lg border-gray-200"
                      />
                    </Form.Item>
                    <Row gutter={8}>
                      <Col span={14}>
                        <Form.Item
                          label={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">City</span>}
                          name={["customer", "city"]}
                        >
                          <Input className="h-10 rounded-lg border-gray-200" placeholder="City" />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item
                          label={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Zip Code</span>}
                          name={["customer", "zip"]}
                        >
                          <Input className="h-10 rounded-lg border-gray-200" placeholder="00000" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card
                  title={
                    <div className="flex items-center gap-2">
                      <IconTruck size={18} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Shipping Details
                      </span>
                    </div>
                  }
                  className="shadow-sm border-gray-100 rounded-2xl h-full"
                >
                  <div className="space-y-4">
                    <Form.Item
                      label={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recipient Name</span>}
                      name={["customer", "shippingName"]}
                    >
                      <Input className="h-10 rounded-lg border-gray-200" placeholder="Recipient Name" />
                    </Form.Item>
                    <Form.Item
                      label={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact Phone</span>}
                      name={["customer", "shippingPhone"]}
                    >
                      <Input className="h-10 rounded-lg border-gray-200" placeholder="+94 XX XXX XXXX" />
                    </Form.Item>
                    <Form.Item
                      label={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Street Address</span>}
                      name={["customer", "shippingAddress"]}
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder="Shipping Address"
                        className="rounded-lg border-gray-200"
                      />
                    </Form.Item>
                    <Row gutter={8}>
                      <Col span={14}>
                        <Form.Item
                          label={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">City</span>}
                          name={["customer", "shippingCity"]}
                        >
                          <Input className="h-10 rounded-lg border-gray-200" placeholder="City" />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item
                          label={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Zip Code</span>}
                          name={["customer", "shippingZip"]}
                        >
                          <Input className="h-10 rounded-lg border-gray-200" placeholder="00000" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </Card>
              </Col>
            </Row>
            </div>
          </Col>

          {/* RIGHT COLUMN: Sidebar Summary & Primary CTAs */}
          <Col xs={24} lg={8}>
            <Card
              className="sticky top-6 shadow-sm border-gray-100 bg-gray-50/50 rounded-2xl"
              title={
                <div className="flex items-center gap-2">
                  <IconBell size={16} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Order Transaction Summary
                  </span>
                </div>
              }
            >
              <div className="flex flex-col gap-6">
                
                {/* Meta details */}
                <div className="bg-white p-4 border border-gray-100 rounded-2xl shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                      Order ID
                    </span>
                    <span className="font-mono font-bold text-sm text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                      #{order.orderId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                      Source Location
                    </span>
                    <span className="text-xs font-black text-gray-500 uppercase tracking-wide">
                      {(order as any).storeName || order.from || "Online Stock"}
                    </span>
                  </div>
                  <Divider className="my-1" />
                  
                  {/* Financial inputs and tallies */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-semibold uppercase">Items Total</span>
                      <span className="text-xs font-mono font-bold text-gray-800">Rs {itemsTotal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center gap-4">
                      <span className="text-xs text-gray-500 font-semibold uppercase">Shipping Fee</span>
                      <Form.Item name="shippingFee" className="!mb-0 w-24">
                        <InputNumber
                          min={0}
                          size="small"
                          className="w-full text-right rounded-lg"
                        />
                      </Form.Item>
                    </div>

                    <div className="flex justify-between items-center gap-4">
                      <span className="text-xs text-gray-500 font-semibold uppercase">Discount/Coupon</span>
                      <Form.Item name="discount" className="!mb-0 w-24">
                        <InputNumber
                          min={0}
                          size="small"
                          className="w-full text-right rounded-lg"
                        />
                      </Form.Item>
                    </div>

                    <Form.Item noStyle shouldUpdate>
                      {() => {
                        const payMethod = form.getFieldValue("paymentMethod");
                        const selectedMethodObj = paymentMethods.find((m) => m.name.toUpperCase() === payMethod?.toUpperCase());
                        const fee = selectedMethodObj ? (itemsTotal * (selectedMethodObj.customerFee || 0) / 100) : (order?.fee || 0);
                        if (fee <= 0) return null;
                        return (
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 font-semibold uppercase">Payment Fee</span>
                            <span className="text-xs font-mono font-bold text-gray-800">Rs {fee.toLocaleString()}</span>
                          </div>
                        );
                      }}
                    </Form.Item>

                    <Divider className="my-1" />

                    <div className="flex justify-between items-center py-1 bg-emerald-50/50 px-2 rounded-xl border border-emerald-100/50">
                      <span className="text-xs font-black text-emerald-900 uppercase">Grand Total</span>
                      <Form.Item className="!mb-0">
                        <Form.Item noStyle shouldUpdate>
                          {() => {
                            const shipping = form.getFieldValue("shippingFee") || 0;
                            const discount = form.getFieldValue("discount") || 0;
                            const payMethod = form.getFieldValue("paymentMethod");
                            const selectedMethodObj = paymentMethods.find((m) => m.name.toUpperCase() === payMethod?.toUpperCase());
                            const fee = selectedMethodObj ? (itemsTotal * (selectedMethodObj.customerFee || 0) / 100) : (order?.fee || 0);
                            const totalVal = itemsTotal + Number(shipping) + Number(fee) - Number(discount);
                            return (
                              <span className="font-mono font-black text-sm text-emerald-700">
                                Rs {totalVal.toLocaleString()}
                              </span>
                            );
                          }}
                        </Form.Item>
                      </Form.Item>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Total Paid</span>
                      <Form.Item noStyle shouldUpdate>
                        {() => {
                          const shipping = form.getFieldValue("shippingFee") || 0;
                          const discount = form.getFieldValue("discount") || 0;
                          const payMethod = form.getFieldValue("paymentMethod");
                          const selectedMethodObj = paymentMethods.find((m) => m.name.toUpperCase() === payMethod?.toUpperCase());
                          const fee = selectedMethodObj ? (itemsTotal * (selectedMethodObj.customerFee || 0) / 100) : (order?.fee || 0);
                          const totalVal = itemsTotal + Number(shipping) + Number(fee) - Number(discount);
                          const paymentStatus = form.getFieldValue("paymentStatus") || order?.paymentStatus;
                          const isPaidWebsite = order?.from?.toLowerCase() === "website" && paymentStatus?.toLowerCase() === "paid";
                          
                          const paidVal = isPaidWebsite ? totalVal : totalPaidAmount;
                          return (
                            <span className="text-xs font-mono font-black text-blue-600">
                              Rs {paidVal.toLocaleString()}
                            </span>
                          );
                        }}
                      </Form.Item>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Due Amount</span>
                      <Form.Item noStyle shouldUpdate>
                        {() => {
                          const shipping = form.getFieldValue("shippingFee") || 0;
                          const discount = form.getFieldValue("discount") || 0;
                          const payMethod = form.getFieldValue("paymentMethod");
                          const selectedMethodObj = paymentMethods.find((m) => m.name.toUpperCase() === payMethod?.toUpperCase());
                          const fee = selectedMethodObj ? (itemsTotal * (selectedMethodObj.customerFee || 0) / 100) : (order?.fee || 0);
                          const totalVal = itemsTotal + Number(shipping) + Number(fee) - Number(discount);
                          const paymentStatus = form.getFieldValue("paymentStatus") || order?.paymentStatus;
                          const isPaidWebsite = order?.from?.toLowerCase() === "website" && paymentStatus?.toLowerCase() === "paid";
                          const due = isPaidWebsite ? 0 : totalVal - totalPaidAmount;
                          return (
                            <span className={`text-xs font-mono font-black ${due <= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                              {due <= 0 ? "PAID" : `Rs ${due.toLocaleString()}`}
                            </span>
                          );
                        }}
                      </Form.Item>
                    </div>
                  </div>
                </div>

                <Divider className="my-0" />

                <div className="bg-emerald-50/50 p-4 border border-emerald-100 rounded-2xl flex justify-between items-center">
                  <div className="flex flex-col pr-2">
                    <span className="text-[10px] text-emerald-900 font-black uppercase tracking-widest">
                      Notifications
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold leading-snug">
                      Alert customer of changes via email/SMS
                    </span>
                  </div>
                  <Form.Item name="sendNotification" valuePropName="checked" className="!mb-0">
                    <Switch className="bg-gray-300" />
                  </Form.Item>
                </div>

                <div className="space-y-3">
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={isSubmitting}
                    icon={<IconDeviceFloppy size={18} />}
                    className="h-12 rounded-xl font-bold text-sm bg-green-600 hover:bg-green-700 border-none shadow-none"
                  >
                    Save Changes
                  </Button>
                  <Button
                    block
                    size="large"
                    icon={<IconArrowBackUp size={18} />}
                    onClick={() => {
                      form.setFieldsValue({
                        ...order,
                        customer: order.customer || {},
                      });
                      setItems(order.items || []);
                      setPayments(order.paymentReceived || []);
                    }}
                    className="h-12 rounded-xl border-gray-100 bg-white text-gray-600 hover:text-black font-bold text-sm shadow-none"
                  >
                    Discard Edits
                  </Button>
                </div>

                <p className="text-[10px] text-gray-400 text-center px-4 leading-relaxed font-semibold">
                  By saving these updates, order items, stock quantities, and customer billing history will be updated instantly.
                </p>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
      {/* Barcode Camera Scanner Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <IconCamera className="text-emerald-600" size={20} />
            <span className="font-black text-xs text-gray-800 uppercase tracking-wider">
              Scan Tracking Barcode
            </span>
          </div>
        }
        open={scannerActive}
        onCancel={() => safeStopScanner()}
        footer={null}
        width={450}
        styles={{ body: { padding: "20px" } }}
        maskClosable={false}
      >
        <div className="flex flex-col gap-4 items-center">
          <div className="text-xs text-gray-500 font-semibold text-center mb-1">
            Position the shipping label barcode within the viewfinder below.
          </div>
          <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border border-gray-100 shadow-inner flex items-center justify-center">
            <div id="edit-scanner-container" className="w-full h-full" />
            <div className="absolute inset-x-8 top-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse pointer-events-none" />
            <div className="absolute inset-x-12 inset-y-16 border-2 border-dashed border-emerald-500 rounded pointer-events-none" />
          </div>
          <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-wide">
            Supports standard 1D Barcodes (Code 128, Code 39) & QR Codes.
          </div>
          <Button
            onClick={() => safeStopScanner()}
            block
            className="mt-2 h-10 font-bold rounded-xl"
          >
            Cancel Scan
          </Button>
        </div>
      </Modal>
    </div>
  );
};
